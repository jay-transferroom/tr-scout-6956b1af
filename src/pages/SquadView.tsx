import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { usePlayersData } from "@/hooks/usePlayersData";
import { usePlayerPositionAssignments, useUpdatePlayerPositionAssignment, useAllPlayerPositionAssignments } from "@/hooks/usePlayerPositionAssignments";
import SquadOverview from "@/components/SquadOverview";
import SquadRecommendations from "@/components/SquadRecommendations";
import ProspectComparison from "@/components/ProspectComparison";
import SquadFormationCard from "@/components/SquadFormationCard";
import SquadTableView from "@/components/SquadTableView";
import SquadLeagueRatings from "@/components/SquadLeagueRatings";
import SquadComparisonChart from "@/components/SquadComparisonChart";
import { useSquadData } from "@/hooks/useSquadData";
import { useSquadMetrics } from "@/hooks/useSquadMetrics";
import { useClubSettings } from "@/hooks/useClubSettings";
import { useHeadCoach } from "@/hooks/useHeadCoach";
import { getSquadDisplayName } from "@/utils/squadUtils";
import { ClubBadge } from "@/components/ui/club-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Users, TrendingUp } from "lucide-react";
const SquadView = () => {
  const navigate = useNavigate();
  const {
    profile
  } = useAuth();
  const [selectedSquad, setSelectedSquad] = useState<string>('first-team');
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null);

  // Redirect if not recruitment or director role
  if (profile?.role !== 'recruitment' && profile?.role !== 'director') {
    navigate('/');
    return null;
  }

  // Fetch real players data
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
  const squadMetrics = useSquadMetrics(squadPlayers, selectedSquad);
  const displayTitle = `${userClub} ${getSquadDisplayName(selectedSquad)} Analysis`;
  if (isLoading) {
    return <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading squad data...</div>
        </div>
      </div>;
  }
  if (error) {
    return <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-red-600">Error loading squad data. Please try again.</div>
        </div>
      </div>;
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
  return <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <ClubBadge clubName={userClub} size="md" />
          <div>
            <h1 className="text-3xl font-bold">{displayTitle}</h1>
            <p className="text-muted-foreground mt-2">
              Manage squad formations, analyze depth, and identify recruitment opportunities
            </p>
          </div>
        </div>

        {/* Head Coach Info */}
        {headCoach && (
          <Card className="border-0 border-b rounded-none shadow-none">
            <CardContent className="pt-6 pb-6">
              <div className="flex items-start gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={headCoach.Image || undefined} alt={headCoach.shortname || "Coach"} />
                  <AvatarFallback className="text-sm">
                    {headCoach.shortname ? headCoach.shortname.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : "HC"}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">Head Coach</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg">{headCoach.shortname || "Unknown"}</h4>
                    <p className="text-sm text-muted-foreground">
                      {headCoach.current_Role} {headCoach.age ? `• ${headCoach.age} years old` : ""}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {headCoach.rating && (
                      <Badge variant="secondary">
                        Rating: {headCoach.rating}
                      </Badge>
                    )}
                    {headCoach.Style && (
                      <Badge variant="outline">
                        {headCoach.Style}
                      </Badge>
                    )}
                    {headCoach["Favourite Formation"] && (
                      <Badge variant="outline">
                        {headCoach["Favourite Formation"]}
                      </Badge>
                    )}
                    {headCoach.TrustInYouth !== null && headCoach.TrustInYouth !== undefined && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        Trust in Youth: {headCoach.TrustInYouth.toFixed(2)}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Squad Overview - Squad Selector and Formation */}
      <SquadOverview 
        selectedSquad={selectedSquad} 
        onSquadSelect={setSelectedSquad} 
        club={userClub} 
        players={clubPlayers}
        currentFormation={currentFormation}
      />

      {/* Enhanced Football Pitch Visualization */}
      <SquadFormationCard squadPlayers={squadPlayers} selectedSquad={selectedSquad} formation={currentFormation} positionAssignments={positionAssignments} onPositionClick={setSelectedPosition} selectedPosition={selectedPosition} onPlayerChange={handlePlayerChange} />

      {/* Squad Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <SquadComparisonChart clubName={userClub} />
        <SquadLeagueRatings />
      </div>
    </div>;
};
export default SquadView;