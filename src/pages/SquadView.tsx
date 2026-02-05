import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { usePlayersData } from "@/hooks/usePlayersData";
import { usePlayerPositionAssignments, useUpdatePlayerPositionAssignment, useAllPlayerPositionAssignments } from "@/hooks/usePlayerPositionAssignments";
import SquadFormationCard from "@/components/SquadFormationCard";
import { useMultiPlayerPositions } from "@/hooks/useMultiPlayerPositions";
import { useSquadData } from "@/hooks/useSquadData";
import { useMarescaFormations } from "@/hooks/useMarescaFormations";
import { useHeadCoach } from "@/hooks/useHeadCoach";
import { useSquadRecommendations } from "@/hooks/useSquadRecommendations";
import SaveSquadConfigurationDialog from "@/components/SaveSquadConfigurationDialog";
import { SquadConfiguration, useSquadConfigurations } from "@/hooks/useSquadConfigurations";
import { toast } from "@/hooks/use-toast";
import { useCurrentSquadRating } from "@/hooks/useCurrentSquadRating";
import { SquadViewHeader } from "@/components/squad-view/SquadViewHeader";
import SquadDepthView from "@/components/squad-view/SquadDepthView";
import PositionPlayersTable from "@/components/squad-view/PositionPlayersTable";

const SquadView = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [selectedSquad, setSelectedSquad] = useState<string>('shadow-squad');
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [loadedConfiguration, setLoadedConfiguration] = useState<SquadConfiguration | null>(null);
  const [currentFormation, setCurrentFormation] = useState<string>('4-3-3');
  const [viewMode, setViewMode] = useState<'detail' | 'depth'>('detail');
  
  // Start with blank squad by default (no auto-fill)
  const [disableAutoFill, setDisableAutoFill] = useState(true);
  
  // Multi-player positions hook for managing multiple players per position
  const {
    positionSlots,
    setActivePlayer,
    addPlayerToPosition,
    loadFromAssignments,
    getActiveAssignments,
    clearAll: clearMultiPlayerSlots
  } = useMultiPlayerPositions();
  
  // Fetch real players data - MUST be called before any conditional returns
  const {
    data: allPlayers = [],
    isLoading,
    error
  } = usePlayersData();
  const userClub = "Chelsea F.C.";

  // Get formations list
  const { data: formations = [] } = useMarescaFormations();
  
  // Fetch squad configurations to load default on mount
  const { data: squadConfigs = [] } = useSquadConfigurations(userClub);

  // Load default configuration on initial mount only
  const [hasLoadedDefault, setHasLoadedDefault] = useState(false);
  
  useEffect(() => {
    if (squadConfigs.length > 0 && !loadedConfiguration && !hasLoadedDefault) {
      const defaultConfig = squadConfigs.find(c => c.is_default);
      if (defaultConfig) {
        setLoadedConfiguration(defaultConfig);
        loadFromAssignments(defaultConfig.position_assignments);
        setCurrentFormation(defaultConfig.formation);
        setSelectedSquad(defaultConfig.squad_type);
        // Keep auto-fill disabled when loading configurations
        setHasLoadedDefault(true);
      }
    }
  }, [squadConfigs, loadedConfiguration, hasLoadedDefault, loadFromAssignments]);

  // Get head coach data
  const { data: headCoach } = useHeadCoach(userClub);

  // Get player position assignments - don't use DB assignments on initial load
  const { data: savedPositionAssignments = [] } = usePlayerPositionAssignments(userClub, currentFormation, selectedSquad);
  
  // Get active assignments from multi-player hook (only the currently active player per position)
  const positionAssignments = useMemo(() => {
    const activeAssignments = getActiveAssignments();
    return activeAssignments.length > 0 ? activeAssignments : (loadedConfiguration ? savedPositionAssignments : []);
  }, [getActiveAssignments, loadedConfiguration, savedPositionAssignments]);
  
  const { data: allPositionAssignments = [] } = useAllPlayerPositionAssignments(userClub, currentFormation);
  const updateAssignment = useUpdatePlayerPositionAssignment();

  // Fetch squad recommendations from database
  const { data: dbRecommendations = [] } = useSquadRecommendations();

  // Role check moved below all hooks to preserve hook order


  // Filter players based on Chelsea F.C. (including all squads and loans)
  const clubPlayers = useMemo(() => {
    return allPlayers.filter(player => {
      // Check if player belongs to Chelsea in any capacity
      const club = player.club?.toLowerCase() || '';
      return club.includes('chelsea') || club === 'chelsea fc' || club === 'chelsea';
    });
  }, [allPlayers]);

  // Use custom hooks for data management
  const {
    squadPlayers
  } = useSquadData(clubPlayers, selectedSquad, allPositionAssignments);

  // Get players with alerts (contract expiring soon or aging) - filtered by selected squad
  const alertPlayers = useMemo(() => {
    return squadPlayers.filter(player => {
      // Contract expiring within 12 months
      if (player.contractExpiry) {
        const expiryDate = new Date(player.contractExpiry);
        const now = new Date();
        const monthsUntilExpiry = Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30));
        if (monthsUntilExpiry <= 12 && monthsUntilExpiry > 0) return true;
      }
      // Players aged 30 or above
      if (player.age >= 30) return true;
      return false;
    });
  }, [squadPlayers]);

  // Calculate current squad rating based on position assignments
  const currentSquadRating = useCurrentSquadRating(positionAssignments, allPlayers);
  
  // Auth/role guard via effect to avoid altering hook order during render
  const isAuthorized = profile?.role === 'recruitment' || profile?.role === 'director';
  useEffect(() => {
    if (profile && !isAuthorized) {
      navigate('/');
    }
  }, [profile, isAuthorized, navigate]);
  
  // Optional: show lightweight placeholder while redirecting unauthorized users
  if (profile && !isAuthorized) {
    return <div className="container mx-auto py-8 px-4">Redirecting…</div>;
  }
  
  const handleFormationChange = (formation: string) => {
    setCurrentFormation(formation);
    // Clear assignments when formation changes
    clearMultiPlayerSlots();
  };

  const isEligibleForSeniorSquad = (player: any) => {
    if (player.age < 21) return false;
    const isOnLoan = player.club !== 'Chelsea FC' && 
                     !player.club?.includes('Chelsea') && 
                     player.club !== 'Unknown';
    if (isOnLoan) return false;
    const isChelsea = player.club === 'Chelsea FC' || 
                     (player.club?.includes('Chelsea') && 
                      !player.club?.includes('U21') && 
                      !player.club?.includes('U18'));
    return isChelsea;
  };

  const getSquadPlayerCount = (squadType: string): number => {
    switch (squadType) {
      case 'first-team':
        return clubPlayers.filter(isEligibleForSeniorSquad).length;
      case 'u21':
        return clubPlayers.filter(player => player.club?.includes('U21')).length;
      case 'u18':
        return clubPlayers.filter(player => player.club?.includes('U18')).length;
      default:
        return 0;
    }
  };

  const squadsList = [
    { id: 'first-team', label: 'First Team', count: getSquadPlayerCount('first-team') },
    { id: 'u21', label: 'U21s', count: getSquadPlayerCount('u21') },
    { id: 'u18', label: 'U18s', count: getSquadPlayerCount('u18') },
  ];
  
  if (isLoading) {
    return <div className="container mx-auto py-4 sm:py-8 px-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-base sm:text-lg">Loading squad data...</div>
        </div>
      </div>;
  }
  if (error) {
    return <div className="container mx-auto py-4 sm:py-8 px-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-base sm:text-lg text-destructive">Error loading squad data. Please try again.</div>
        </div>
      </div>;
  }
  const handleLoadConfiguration = (config: SquadConfiguration) => {
    setLoadedConfiguration(config);
    loadFromAssignments(config.position_assignments);
    setCurrentFormation(config.formation);
    // Keep auto-fill disabled when loading configurations
    setSelectedSquad(config.squad_type);
    
    toast({
      title: "Configuration loaded",
      description: `${config.name} has been applied`
    });
  };

  const handlePlayerChange = async (position: string, playerId: string) => {
    console.log(`Player change requested: ${position} -> ${playerId}`);
    
    // Set as active player (replaces current active, moves old active to alternates)
    setActivePlayer(position, playerId);
    
    // Also persist to database
    try {
      await updateAssignment.mutateAsync({
        club_name: userClub,
        position: position,
        player_id: playerId,
        formation: currentFormation,
        squad_type: selectedSquad
      });
    } catch (error) {
      console.error('Failed to update player assignment:', error);
    }
  };

  // Handler for adding a player as an alternate to a position
  const handleAddPlayerToPosition = (position: string, playerId: string) => {
    console.log(`Adding player ${playerId} as alternate to position ${position}`);
    addPlayerToPosition(position, playerId);
    
    toast({
      title: "Player added",
      description: "Player added as an alternative option for this position"
    });
  };

  // Handler for switching active player in a position
  const handleSetActivePlayer = (position: string, playerId: string) => {
    console.log(`Switching active player for ${position} to ${playerId}`);
    setActivePlayer(position, playerId);
  };

  const handleStartNewSquad = () => {
    clearMultiPlayerSlots();
    setLoadedConfiguration(null);
    setDisableAutoFill(true);
    setSelectedPosition(null);
    setCurrentFormation('4-3-3');
    
    toast({
      title: "New squad started",
      description: "Starting with a blank squad. Make your changes and save when ready.",
    });
  };
  return (
    <>
      {/* Unified Header */}
      <SquadViewHeader
        loadedConfiguration={loadedConfiguration}
        selectedSquad={selectedSquad}
        onSquadChange={setSelectedSquad}
        squadsList={squadsList}
        headCoach={headCoach}
        currentFormation={currentFormation}
        onFormationChange={handleFormationChange}
        formations={formations}
        recommendations={dbRecommendations}
        alertPlayers={alertPlayers}
        onStartNewSquad={handleStartNewSquad}
        onSaveSquad={() => setShowSaveDialog(true)}
        currentSquadRating={currentSquadRating}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        clubName={userClub}
        onLoadConfiguration={handleLoadConfiguration}
      />

      {/* Main Content - Grey Background */}
      <div className="w-full max-w-full overflow-x-hidden bg-muted/30">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 py-6">
          {viewMode === 'detail' ? (
            /* Detail View - Condensed pitch with side panel */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Pitch View - Condensed, takes 5 columns */}
              <div className="lg:col-span-5">
                <div className="max-w-md mx-auto lg:mx-0">
                  <SquadFormationCard 
                    squadPlayers={squadPlayers} 
                    selectedSquad={selectedSquad} 
                    formation={currentFormation} 
                    positionAssignments={positionAssignments} 
                    multiPlayerSlots={positionSlots}
                    onPositionClick={setSelectedPosition} 
                    selectedPosition={selectedPosition} 
                    onPlayerChange={handlePlayerChange}
                    onAddPlayerToPosition={handleAddPlayerToPosition}
                    onSetActivePlayer={handleSetActivePlayer}
                    disableAutoFill={disableAutoFill}
                    hideSlideout={true}
                  />
                </div>
              </div>

              {/* Position Players Panel - Takes 7 columns */}
              <div className="lg:col-span-7">
                <PositionPlayersTable
                  squadPlayers={squadPlayers}
                  allPlayers={allPlayers}
                  selectedPosition={selectedPosition}
                  onPlayerChange={handlePlayerChange}
                  onAddPlayerToPosition={handleAddPlayerToPosition}
                />
              </div>
            </div>
          ) : (
            /* Depth View - Horizontal pitch with depth cards */
            <div className="w-full">
              <SquadDepthView
                squadPlayers={squadPlayers}
                allPlayers={allPlayers}
                formation={currentFormation}
                positionAssignments={positionAssignments}
                multiPlayerSlots={positionSlots}
              />
            </div>
          )}
        </div>
      </div>

      {/* Save Squad Configuration Dialog */}
      <SaveSquadConfigurationDialog
        open={showSaveDialog}
        onOpenChange={setShowSaveDialog}
        clubName={userClub}
        formation={currentFormation}
        squadType={selectedSquad}
        positionAssignments={positionAssignments}
        allPlayers={allPlayers}
        currentConfiguration={loadedConfiguration}
      />
    </>
  );
};

export default SquadView;