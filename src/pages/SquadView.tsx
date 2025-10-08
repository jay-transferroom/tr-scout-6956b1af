
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { usePlayersData } from "@/hooks/usePlayersData";
import { usePlayerPositionAssignments, useUpdatePlayerPositionAssignment, useAllPlayerPositionAssignments } from "@/hooks/usePlayerPositionAssignments";
import SquadSelector from "@/components/SquadSelector";
import SquadRecommendations from "@/components/SquadRecommendations";
import ProspectComparison from "@/components/ProspectComparison";
import SquadFormationCard from "@/components/SquadFormationCard";
import SquadTableView from "@/components/SquadTableView";
import ViewToggle from "@/components/ViewToggle";
import SquadSettingsButton from "@/components/SquadSettingsButton";
import { useSquadData } from "@/hooks/useSquadData";
import { useSquadMetrics } from "@/hooks/useSquadMetrics";
import { useClubSettings } from "@/hooks/useClubSettings";
import { getSquadDisplayName } from "@/utils/squadUtils";
import { ClubBadge } from "@/components/ui/club-badge";

const SquadView = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [selectedSquad, setSelectedSquad] = useState<string>('first-team');
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'grid' | 'list'>('grid');

  // Redirect if not recruitment or director role
  if (profile?.role !== 'recruitment' && profile?.role !== 'director') {
    navigate('/');
    return null;
  }

  // Fetch real players data
  const { data: allPlayers = [], isLoading, error } = usePlayersData();

  const userClub = "Chelsea F.C.";

  // Get club settings including formation
  const { data: clubSettings } = useClubSettings(userClub);
  const currentFormation = clubSettings?.formation || '4-3-3';
  
  // Get player position assignments
  const { data: positionAssignments = [] } = usePlayerPositionAssignments(userClub, currentFormation, selectedSquad);
  const { data: allPositionAssignments = [] } = useAllPlayerPositionAssignments(userClub, currentFormation);
  const updateAssignment = useUpdatePlayerPositionAssignment();

  // Filter players based on Chelsea F.C. (including all squads and loans)
  const clubPlayers = useMemo(() => {
    return allPlayers.filter(player => {
      // Check if player belongs to Chelsea in any capacity
      const club = player.club?.toLowerCase() || '';
      return club.includes('chelsea') || 
             club === 'chelsea fc' || 
             club === 'chelsea';
    });
  }, [allPlayers]);

  // Use custom hooks for data management
  const { squadPlayers } = useSquadData(clubPlayers, selectedSquad, allPositionAssignments);
  const squadMetrics = useSquadMetrics(squadPlayers, selectedSquad);

  const displayTitle = `${userClub} ${getSquadDisplayName(selectedSquad)} Analysis`;

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading squad data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-red-600">Error loading squad data. Please try again.</div>
        </div>
      </div>
    );
  }

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
    } catch (error) {
      console.error('Failed to update player assignment:', error);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <ClubBadge clubName={userClub} size="md" />
          <div>
            <h1 className="text-3xl font-bold">{displayTitle}</h1>
            <p className="text-muted-foreground mt-2">
              Manage squad formations, analyze depth, and identify recruitment opportunities
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <SquadSettingsButton clubName={userClub} />
          <ViewToggle currentView={currentView} onViewChange={setCurrentView} />
        </div>
      </div>

      {/* Squad Selector */}
      <SquadSelector 
        selectedSquad={selectedSquad}
        onSquadSelect={setSelectedSquad}
        club={userClub}
        players={clubPlayers}
      />

      {/* Conditional View Rendering */}
      {currentView === 'grid' ? (
        <>
          {/* Enhanced Football Pitch Visualization */}
          <SquadFormationCard
            squadPlayers={squadPlayers}
            selectedSquad={selectedSquad}
            formation={currentFormation}
            positionAssignments={positionAssignments}
            onPositionClick={setSelectedPosition}
            selectedPosition={selectedPosition}
            onPlayerChange={handlePlayerChange}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Squad Recommendations */}
            <SquadRecommendations 
              players={squadPlayers}
              selectedPosition={selectedPosition}
              onPositionSelect={setSelectedPosition}
              allPlayers={allPlayers}
            />

            {/* Prospect Comparison */}
            {selectedPosition && (
              <ProspectComparison 
                position={selectedPosition}
                currentPlayers={squadPlayers.filter(p => 
                  p.positions.some(pos => pos.toLowerCase().includes(selectedPosition.toLowerCase()))
                )}
                allPlayers={allPlayers}
                squadAnalysis={(() => {
                  // Find the analysis for the selected position from SquadRecommendations
                  const positions = [
                    { name: 'GK', requiredPositions: ['GK'] },
                    { name: 'CB', requiredPositions: ['CB'] },
                    { name: 'FB', requiredPositions: ['LB', 'RB', 'LWB', 'RWB'] },
                    { name: 'CM', requiredPositions: ['CM', 'CDM', 'CAM'] },
                    { name: 'W', requiredPositions: ['LW', 'RW', 'LM', 'RM', 'W'] },
                    { name: 'ST', requiredPositions: ['ST', 'CF', 'F', 'FW'] }
                  ];
                  
                  const positionData = positions.find(p => p.name === selectedPosition);
                  if (!positionData) return undefined;
                  
                  const positionPlayers = squadPlayers.filter(p => 
                    p.positions.some(playerPos => positionData.requiredPositions.includes(playerPos))
                  );
                  
                  const current = positionPlayers.length;
                  const needed = positionData.name === 'GK' ? 2 : 
                               positionData.name === 'CB' || positionData.name === 'FB' || positionData.name === 'W' ? 4 :
                               positionData.name === 'CM' ? 6 : 3;
                  
                  const ratings = positionPlayers.map(p => p.transferroomRating || p.xtvScore || 0);
                  const averageRating = ratings.length > 0 ? Math.round(ratings.reduce((a, b) => a + b, 0) / ratings.length) : 0;
                  
                  let priority: 'Critical' | 'High' | 'Medium' | 'Low' | 'Strong';
                  let recruitmentSuggestion: string;
                  
                  if (current === 0) {
                    priority = 'Critical';
                    recruitmentSuggestion = 'Immediate recruitment required - consider multiple targets';
                  } else if (current < needed / 2) {
                    priority = 'Critical' ;
                    recruitmentSuggestion = 'Priority recruitment target - focus on proven quality';
                  } else if (current < needed) {
                    priority = averageRating < 65 ? 'High' : 'Medium';
                    recruitmentSuggestion = averageRating < 65 
                      ? 'Target higher-rated players to improve squad depth and quality'
                      : 'Add depth with promising young players or experienced squad players';
                  } else if (averageRating >= 75) {
                    priority = 'Strong';
                    recruitmentSuggestion = 'Consider selling surplus players or focus on youth development';
                  } else {
                    priority = 'Low';
                    recruitmentSuggestion = 'Monitor for opportunities to upgrade quality';
                  }
                  
                  return {
                    priority,
                    recruitmentSuggestion,
                    averageRating,
                    current,
                    needed
                  };
                })()}
              />
            )}
          </div>
        </>
      ) : (
        /* Table View */
        <SquadTableView players={squadPlayers} />
      )}
    </div>
  );
};

export default SquadView;
