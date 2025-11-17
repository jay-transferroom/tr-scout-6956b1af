import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { usePlayersData } from "@/hooks/usePlayersData";
import { usePlayerPositionAssignments, useUpdatePlayerPositionAssignment, useAllPlayerPositionAssignments, useClearAllPositionAssignments } from "@/hooks/usePlayerPositionAssignments";
import SquadOverview from "@/components/SquadOverview";
import SquadRecommendations from "@/components/SquadRecommendations";
import ProspectComparison from "@/components/ProspectComparison";
import SquadFormationCard from "@/components/SquadFormationCard";
import SquadTableView from "@/components/SquadTableView";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import SquadComparisonChart from "@/components/SquadComparisonChart";
import { useSquadData } from "@/hooks/useSquadData";
import { useSquadMetrics } from "@/hooks/useSquadMetrics";
import { useClubSettings, useUpdateClubSettings } from "@/hooks/useClubSettings";
import { useMarescaFormations } from "@/hooks/useMarescaFormations";
import { useHeadCoach } from "@/hooks/useHeadCoach";
import { getSquadDisplayName } from "@/utils/squadUtils";
import { ClubBadge } from "@/components/ui/club-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Users, TrendingUp, AlertTriangle, Lightbulb } from "lucide-react";
import SquadPitchLegend from "@/components/SquadPitchLegend";
import { Separator } from "@/components/ui/separator";
import { useSquadRecommendations } from "@/hooks/useSquadRecommendations";
import SavedSquadConfigurations from "@/components/SavedSquadConfigurations";
import SaveSquadConfigurationDialog from "@/components/SaveSquadConfigurationDialog";
import NewSquadDialog from "@/components/NewSquadDialog";
import { SquadConfiguration } from "@/hooks/useSquadConfigurations";
import { Save } from "lucide-react";
import { toast } from "@/hooks/use-toast";
const SquadView = () => {
  const navigate = useNavigate();
  const {
    profile
  } = useAuth();
  const [selectedSquad, setSelectedSquad] = useState<string>('first-team');
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showNewSquadDialog, setShowNewSquadDialog] = useState(false);
  // Start with empty pitch for Shadow squad by default
  const [disableAutoFill, setDisableAutoFill] = useState(true);

  // Fetch real players data - MUST be called before any conditional returns
  const {
    data: allPlayers = [],
    isLoading,
    error
  } = usePlayersData();
  const userClub = "Chelsea F.C.";

  // Get club settings including formation
  const {
    data: clubSettings
  } = useClubSettings(userClub);
  const currentFormation = clubSettings?.formation || '4-3-3';
  
  // Get formations list
  const { data: formations = [] } = useMarescaFormations();
  const updateClubSettings = useUpdateClubSettings();

  // Get head coach data
  const {
    data: headCoach,
    isLoading: isCoachLoading
  } = useHeadCoach(userClub);

  // Get player position assignments
  const {
    data: positionAssignments = []
  } = usePlayerPositionAssignments(userClub, currentFormation, selectedSquad);
  const {
    data: allPositionAssignments = []
  } = useAllPlayerPositionAssignments(userClub, currentFormation);
  const updateAssignment = useUpdatePlayerPositionAssignment();
  const clearAllAssignments = useClearAllPositionAssignments();

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

  const squadMetrics = useSquadMetrics(squadPlayers, selectedSquad);
  const displayTitle = `${userClub} ${getSquadDisplayName(selectedSquad)} Analysis`;
  
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
  
  const handleFormationChange = async (formation: string) => {
    try {
      await updateClubSettings.mutateAsync({
        club_name: userClub,
        formation: formation,
      });
    } catch (error) {
      console.error('Failed to update formation:', error);
    }
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
          <div className="text-base sm:text-lg text-red-600">Error loading squad data. Please try again.</div>
        </div>
      </div>;
  }
  const handleLoadConfiguration = async (config: SquadConfiguration) => {
    setSelectedSquad(config.squad_type);
    
    // Update formation if it's different
    if (config.formation !== currentFormation) {
      try {
        await updateClubSettings.mutateAsync({
          club_name: userClub,
          formation: config.formation,
        });
      } catch (error) {
        console.error('Failed to update formation:', error);
      }
    }
    // Position assignments will be loaded automatically through the positionAssignments query
  };

  const handlePlayerChange = async (position: string, playerId: string) => {
    console.log(`Player change requested: ${position} -> ${playerId}`);
    try {
      await updateAssignment.mutateAsync({
        club_name: userClub,
        position: position,
        player_id: playerId,
        formation: currentFormation,
        squad_type: selectedSquad
      });
      // Once a player is assigned, re-enable auto-fill for remaining positions
      setDisableAutoFill(false);
    } catch (error) {
      console.error('Failed to update player assignment:', error);
    }
  };

  const handleStartNewSquad = async (name: string, description: string) => {
    try {
      console.log('Starting new squad:', { name, description, userClub, currentFormation, selectedSquad });
      
      const result = await clearAllAssignments.mutateAsync({
        club_name: userClub,
        formation: currentFormation,
        squad_type: selectedSquad
      });
      
      console.log('Clear result:', result);
      // Force empty pitch (no auto-fill) until user assigns players
      setDisableAutoFill(true);
      setSelectedPosition(null);
      toast({
        title: "New squad started",
        description: `"${name}" is ready to configure. All positions are now empty.`,
      });
    } catch (error) {
      console.error('Failed to clear squad:', error);
      toast({
        title: "Error",
        description: "Failed to start new squad. Please try again.",
        variant: "destructive"
      });
    }
  };
  return <>
      <div className="w-full max-w-full overflow-x-hidden">
        <div className="container mx-auto py-4 sm:py-6 lg:py-8 px-4 sm:px-6 max-w-7xl">
          {/* Header */}
          <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
              <ClubBadge clubName={userClub} size="lg" className="shrink-0" />
              <div className="min-w-0 w-full">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold truncate">{displayTitle}</h1>
                <p className="text-sm sm:text-base text-muted-foreground mt-1 sm:mt-2">
                  Manage squad formations, analyze depth, and identify recruitment opportunities
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Squad Selection and Formation Controls */}
      <div className="w-full max-w-full overflow-x-hidden">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6">
          <div className="bg-muted/30 py-4 sm:py-6 px-4 sm:px-6 lg:px-8 rounded-lg">
          <div className="flex flex-col md:flex-row gap-4 sm:gap-6 items-start">
            {/* Select Squad Section */}
            <div className="flex-1 space-y-2 sm:space-y-3 w-full">
              <h3 className="text-xs sm:text-sm font-medium text-muted-foreground">Select Squad</h3>
              <div className="flex flex-wrap gap-2">
                {squadsList.map((squad) => (
                  <Button
                    key={squad.id}
                    onClick={() => setSelectedSquad(squad.id)}
                    variant={selectedSquad === squad.id ? "default" : "outline"}
                    className="flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base"
                    size="sm"
                  >
                    <span>{squad.label}</span>
                    <Badge variant="secondary" className="ml-0.5 sm:ml-1 text-xs">
                      {squad.count}
                    </Badge>
                  </Button>
                ))}
              </div>
            </div>

            {/* Formation Section */}
            <div className="space-y-2 sm:space-y-3 w-full md:w-auto">
              <h3 className="text-xs sm:text-sm font-medium text-muted-foreground">Formation</h3>
              <Select value={currentFormation} onValueChange={handleFormationChange}>
                <SelectTrigger className="w-full md:w-[200px] bg-background">
                  <SelectValue placeholder="Select formation" />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  {formations.map((formation) => (
                    <SelectItem 
                      key={formation.formation} 
                      value={formation.formation || ''}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm">{formation.formation}</span>
                        <Badge variant="secondary" className="text-xs">
                          {formation.games} {formation.games === 1 ? 'game' : 'games'}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator className="my-4 sm:my-6" />

          {/* Squad Recommendations and Alerts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Database Recommendations */}
            {dbRecommendations.length > 0 && (
              <div className="space-y-2 sm:space-y-3">
                <h3 className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Lightbulb className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  Squad Recommendations
                </h3>
                <div className="grid gap-2">
                  {dbRecommendations.map((rec, index) => (
                    <Card key={index} className="border-l-4 border-l-primary">
                      <CardContent className="py-2.5 sm:py-3 px-3 sm:px-4">
                        <div className="flex flex-col sm:flex-row items-start gap-2 sm:gap-3">
                          <Badge variant="secondary" className="text-xs shrink-0">
                            {rec.Position}
                          </Badge>
                          <p className="text-xs sm:text-sm flex-1">{rec.Reason}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Players with Alerts */}
            {alertPlayers.length > 0 && (
              <div className="space-y-2 sm:space-y-3">
                <h3 className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <AlertTriangle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  Players Requiring Attention ({alertPlayers.length})
                </h3>
                <div className="grid gap-2">
                  {alertPlayers.map((player) => {
                    const contractExpiringSoon = player.contractExpiry ? (() => {
                      const expiryDate = new Date(player.contractExpiry);
                      const now = new Date();
                      const monthsUntilExpiry = Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30));
                      return monthsUntilExpiry <= 12 && monthsUntilExpiry > 0;
                    })() : false;
                    const isAging = player.age >= 30;

                    return (
                      <Card key={player.id} className="border-l-4 border-l-amber-500">
                        <CardContent className="py-2.5 sm:py-3 px-3 sm:px-4">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-xs sm:text-sm truncate">{player.name}</div>
                              <div className="text-[10px] sm:text-xs text-muted-foreground truncate">
                                {player.positions.join(', ')} • Age {player.age}
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-1.5 self-start sm:self-auto">
                              {contractExpiringSoon && (
                                <Badge variant="outline" className="text-[9px] sm:text-[10px] border-amber-500 text-amber-700">
                                  Contract expiring
                                </Badge>
                              )}
                              {isAging && (
                                <Badge variant="outline" className="text-[9px] sm:text-[10px] border-orange-500 text-orange-700">
                                  Aging player
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      </div>

      <div className="w-full max-w-full overflow-x-hidden">
        <div className="container mx-auto py-4 sm:py-6 max-w-7xl px-4 sm:px-6">
        {/* Head Coach Info and Squad Controls */}
        <div>
        <Card className="border-0 rounded-none shadow-none">
          <CardContent className="pt-4 sm:pt-6 pb-2 px-0">
            <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
              {/* Head Coach Info */}
              {headCoach && (
                <div className="flex items-start gap-3 sm:gap-4 flex-1">
                  <Avatar className="h-12 w-12 sm:h-16 sm:w-16 shrink-0">
                    <AvatarImage src={headCoach.Image || undefined} alt={headCoach.shortname || "Coach"} />
                    <AvatarFallback className="text-xs sm:text-sm">
                      {headCoach.shortname ? headCoach.shortname.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : "HC"}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 space-y-1.5 sm:space-y-2 min-w-0">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground shrink-0" />
                      <span className="text-xs sm:text-base font-medium text-muted-foreground">Head Coach</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-base sm:text-xl truncate">{headCoach.shortname || "Unknown"}</h4>
                      <p className="text-sm sm:text-base text-muted-foreground truncate">
                        {headCoach.current_Role} {headCoach.age ? `• ${headCoach.age} years old` : ""}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {headCoach.rating && (
                        <Badge variant="secondary" className="text-xs sm:text-sm">
                          Rating: {headCoach.rating}
                        </Badge>
                      )}
                      {headCoach.Style && (
                        <Badge variant="outline" className="text-xs sm:text-sm">
                          {headCoach.Style}
                        </Badge>
                      )}
                    {headCoach["Favourite Formation"] && (
                      <Badge variant="outline" className="text-xs sm:text-sm">
                        {headCoach["Favourite Formation"]}
                      </Badge>
                    )}
                  </div>
                  </div>
                </div>
              )}

              {/* Squad Selector and Formation - with left border */}
              <div className="lg:border-l lg:pl-6 flex-1">
                <SquadOverview 
                  selectedSquad={selectedSquad} 
                  onSquadSelect={setSelectedSquad} 
                  club={userClub} 
                  players={clubPlayers}
                  currentFormation={currentFormation}
                />
              </div>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
      </div>


      {/* Shadow Squad */}
      <div className="w-full max-w-full overflow-x-hidden">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 pb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Shadow Squad</h2>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowNewSquadDialog(true)}>
                Start a new squad
              </Button>
              <Button onClick={() => setShowSaveDialog(true)}>
                <Save className="h-4 w-4 mr-2" />
                Save current squad
              </Button>
            </div>
          </div>
          <SavedSquadConfigurations 
            clubName={userClub}
            onLoadConfiguration={handleLoadConfiguration}
          />
        </div>
      </div>

      {/* Formation View */}
      <div className="w-full max-w-full overflow-x-hidden">
        <div className="container mx-auto max-w-7xl py-4 sm:py-6 px-4 sm:px-6">
          <SquadFormationCard squadPlayers={squadPlayers} selectedSquad={selectedSquad} formation={currentFormation} positionAssignments={positionAssignments} onPositionClick={setSelectedPosition} selectedPosition={selectedPosition} onPlayerChange={handlePlayerChange} />
        </div>
      </div>

      {/* Squad Comparison */}
      <div className="w-full max-w-full overflow-x-hidden">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 py-6">
          <SquadComparisonChart clubName={userClub} />
        </div>
      </div>

      {/* New Squad Dialog */}
      <NewSquadDialog
        open={showNewSquadDialog}
        onOpenChange={setShowNewSquadDialog}
        onConfirm={handleStartNewSquad}
      />

      {/* Save Squad Configuration Dialog */}
      <SaveSquadConfigurationDialog
        open={showSaveDialog}
        onOpenChange={setShowSaveDialog}
        clubName={userClub}
        formation={currentFormation}
        squadType={selectedSquad}
        positionAssignments={positionAssignments}
        allPlayers={allPlayers}
      />
  </>;
};

export default SquadView;