import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, TrendingUp } from "lucide-react";
import { Player } from "@/types/player";
import { getSquadDisplayName } from "@/utils/squadUtils";

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
}

const SquadOverview = ({ selectedSquad, onSquadSelect, club, players, headCoach }: SquadOverviewProps) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getSquadPlayerCount = (squadType: string): number => {
    return players.filter(player => {
      const age = player.age || 0;
      
      switch (squadType) {
        case 'first-team':
          return age >= 21;
        case 'u21':
          return age >= 18 && age < 21;
        case 'u18':
          return age < 18;
        case 'out-on-loan':
          return player.club?.toLowerCase().includes('on loan');
        default:
          return false;
      }
    }).length;
  };

  const squads = [
    { id: 'first-team', label: 'First Team', count: getSquadPlayerCount('first-team') },
    { id: 'u21', label: 'U21s', count: getSquadPlayerCount('u21') },
    { id: 'u18', label: 'U18s', count: getSquadPlayerCount('u18') },
    { id: 'out-on-loan', label: 'Out on Loan', count: getSquadPlayerCount('out-on-loan') },
  ];

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6">
          {/* Squad Selector */}
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
