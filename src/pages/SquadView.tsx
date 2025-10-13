import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { usePlayersData } from "@/hooks/usePlayersData";
import { usePlayerPositionAssignments, useUpdatePlayerPositionAssignment, useAllPlayerPositionAssignments } from "@/hooks/usePlayerPositionAssignments";
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
  return <div className="space-y-4 p-6">
      {/* Header */}
      <div className="container mx-auto px-0">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <ClubBadge clubName={userClub} size="lg" />
            <div>
              <h1 className="text-3xl font-bold">{displayTitle}</h1>
              <p className="text-muted-foreground mt-2">
                Manage squad formations, analyze depth, and identify recruitment opportunities
              </p>
            </div>
          </div>

          {/* Head Coach Info and Squad Controls */}
          <Card className="border-0 rounded-none shadow-none">
            <CardContent className="pt-6 pb-2">
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Head Coach Info */}
                {headCoach && (
                  <div className="flex items-start gap-4 flex-1">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={headCoach.Image || undefined} alt={headCoach.shortname || "Coach"} />
                      <AvatarFallback className="text-sm">
                        {headCoach.shortname ? headCoach.shortname.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : "HC"}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-muted-foreground" />
                        <span className="text-base font-medium text-muted-foreground">Head Coach</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-xl">{headCoach.shortname || "Unknown"}</h4>
                        <p className="text-base text-muted-foreground">
                          {headCoach.current_Role} {headCoach.age ? `• ${headCoach.age} years old` : ""}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {headCoach.rating && (
                          <Badge variant="secondary" className="text-sm">
                            Rating: {headCoach.rating}
                          </Badge>
                        )}
                        {headCoach.Style && (
                          <Badge variant="outline" className="text-sm">
                            {headCoach.Style}
                          </Badge>
                        )}
                      {headCoach["Favourite Formation"] && (
                        <Badge variant="outline" className="text-sm">
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

      {/* Squad Selection and Formation Controls - Full Width */}
      <div className="w-full bg-muted/30 py-6">
        <div className="container mx-auto">
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">Select Squad & Formation</h3>
            <div className="flex flex-wrap gap-2 items-center">
              {squadsList.map((squad) => (
                <Button
                  key={squad.id}
                  onClick={() => setSelectedSquad(squad.id)}
                  variant={selectedSquad === squad.id ? "default" : "outline"}
                  className="flex items-center gap-2"
                >
                  <span>{squad.label}</span>
                  <Badge variant="secondary" className="ml-1">
                    {squad.count}
                  </Badge>
                </Button>
              ))}
              
              <Select value={currentFormation} onValueChange={handleFormationChange}>
                <SelectTrigger className="w-[200px] bg-background">
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
                        <span>{formation.formation}</span>
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
        </div>
      </div>

      {/* Enhanced Football Pitch Visualization */}
      <div className="w-full py-6">
        <div className="container mx-auto px-0">
          <SquadFormationCard squadPlayers={squadPlayers} selectedSquad={selectedSquad} formation={currentFormation} positionAssignments={positionAssignments} onPositionClick={setSelectedPosition} selectedPosition={selectedPosition} onPlayerChange={handlePlayerChange} />
        </div>
      </div>

      {/* Squad Comparison */}
      <div className="container mx-auto px-0 pb-8">
        <SquadComparisonChart clubName={userClub} />
      </div>
    </div>;
};
export default SquadView;