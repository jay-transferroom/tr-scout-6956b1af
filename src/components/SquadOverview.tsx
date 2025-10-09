import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, TrendingUp, Settings } from "lucide-react";
import { Player } from "@/types/player";
import { getSquadDisplayName } from "@/utils/squadUtils";
import { useMarescaFormations } from "@/hooks/useMarescaFormations";
import { useUpdateClubSettings } from "@/hooks/useClubSettings";

interface HeadCoach {
  shortname: string | null;
  Image: string | null;
  current_Role: string | null;
  age: number | null;
  rating: number | null;
  Style: string | null;
  "Favourite Formation": string | null;
  TrustInYouth: number | null;
}

interface SquadOverviewProps {
  selectedSquad: string;
  onSquadSelect: (squad: string) => void;
  club: string;
  players: Player[];
  headCoach?: HeadCoach | null;
  currentFormation: string;
}

const SquadOverview = ({ selectedSquad, onSquadSelect, club, players, headCoach, currentFormation }: SquadOverviewProps) => {
  const { data: formations = [] } = useMarescaFormations();
  const updateClubSettings = useUpdateClubSettings();

  const handleFormationChange = async (formation: string) => {
    try {
      await updateClubSettings.mutateAsync({
        club_name: club,
        formation: formation,
      });
    } catch (error) {
      console.error('Failed to update formation:', error);
    }
  };
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const isEligibleForSeniorSquad = (player: Player) => {
    // Exclude players under 21
    if (player.age < 21) return false;
    
    // Exclude players on loan (club is not Chelsea-related)
    const isOnLoan = player.club !== 'Chelsea FC' && 
                     !player.club?.includes('Chelsea') && 
                     player.club !== 'Unknown';
    if (isOnLoan) return false;
    
    // Must be Chelsea-related club but not youth teams
    const isChelsea = player.club === 'Chelsea FC' || 
                     (player.club?.includes('Chelsea') && 
                      !player.club?.includes('U21') && 
                      !player.club?.includes('U18'));
    
    return isChelsea;
  };

  const getSquadPlayerCount = (squadType: string): number => {
    switch (squadType) {
      case 'first-team':
        return players.filter(isEligibleForSeniorSquad).length;
      case 'u21':
        return players.filter(player => player.club?.includes('U21')).length;
      case 'u18':
        return players.filter(player => player.club?.includes('U18')).length;
      default:
        return 0;
    }
  };

  const squads = [
    { id: 'first-team', label: 'First Team', count: getSquadPlayerCount('first-team') },
    { id: 'u21', label: 'U21s', count: getSquadPlayerCount('u21') },
    { id: 'u18', label: 'U18s', count: getSquadPlayerCount('u18') },
  ];

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6">
          {/* Squad Selector */}
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Select Squad</h3>
              <div className="flex flex-wrap gap-2">
                {squads.map((squad) => (
                  <Button
                    key={squad.id}
                    onClick={() => onSquadSelect(squad.id)}
                    variant={selectedSquad === squad.id ? "default" : "outline"}
                    className="flex items-center gap-2"
                  >
                    <span>{squad.label}</span>
                    <Badge variant="secondary" className="ml-1">
                      {squad.count}
                    </Badge>
                  </Button>
                ))}
              </div>
            </div>

            {/* Formation Settings */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Formation
              </h3>
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

          {/* Head Coach Info */}
          {headCoach && (
            <div className="lg:border-l lg:pl-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Head Coach
              </h3>
              <div className="flex items-start gap-3">
                <Avatar className="h-14 w-14">
                  <AvatarImage src={headCoach.Image || undefined} alt={headCoach.shortname || "Coach"} />
                  <AvatarFallback className="text-sm">
                    {headCoach.shortname ? getInitials(headCoach.shortname) : "HC"}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 space-y-2">
                  <div>
                    <h4 className="font-semibold">{headCoach.shortname || "Unknown"}</h4>
                    <p className="text-xs text-muted-foreground">
                      {headCoach.current_Role} {headCoach.age ? `• ${headCoach.age} years old` : ""}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {headCoach.rating && (
                      <Badge variant="secondary" className="text-xs">
                        Rating: {headCoach.rating}
                      </Badge>
                    )}
                    {headCoach.Style && (
                      <Badge variant="outline" className="text-xs">
                        {headCoach.Style}
                      </Badge>
                    )}
                    {headCoach["Favourite Formation"] && (
                      <Badge variant="outline" className="text-xs">
                        {headCoach["Favourite Formation"]}
                      </Badge>
                    )}
                  </div>

                  {headCoach.TrustInYouth !== null && headCoach.TrustInYouth !== undefined && (
                    <div className="flex items-center gap-1.5 text-xs">
                      <TrendingUp className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        Trust in Youth: <span className="font-medium text-foreground">{headCoach.TrustInYouth.toFixed(2)}</span>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SquadOverview;
