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
import { Users, TrendingUp, AlertTriangle, Lightbulb } from "lucide-react";
import SquadPitchLegend from "@/components/SquadPitchLegend";
import { Separator } from "@/components/ui/separator";
import { useSquadRecommendations } from "@/hooks/useSquadRecommendations";
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

  // Fetch squad recommendations from database
  const { data: dbRecommendations = [] } = useSquadRecommendations();

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
  return <>
      <div className="container mx-auto py-4 sm:py-6 lg:py-8 px-4 sm:px-6 max-w-7xl">
        {/* Header */}
        <div className="space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
            <ClubBadge clubName={userClub} size="lg" className="shrink-0" />
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">{displayTitle}</h1>
              <p className="text-sm sm:text-base text-muted-foreground mt-1 sm:mt-2">
                Manage squad formations, analyze depth, and identify recruitment opportunities
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Squad Selection and Formation Controls */}
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


      {/* Enhanced Football Pitch Visualization */}
      <div className="py-4 sm:py-6 px-4 sm:px-0">
        <SquadFormationCard squadPlayers={squadPlayers} selectedSquad={selectedSquad} formation={currentFormation} positionAssignments={positionAssignments} onPositionClick={setSelectedPosition} selectedPosition={selectedPosition} onPlayerChange={handlePlayerChange} />
      </div>

      {/* Squad Comparison */}
      <div className="px-4 sm:px-0">
        <SquadComparisonChart clubName={userClub} />
      </div>
    </div>
  </>;
};

export default SquadView;