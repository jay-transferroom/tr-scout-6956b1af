
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Shield, Trophy } from "lucide-react";
import { Player } from "@/types/player";

interface SquadSelectorProps {
  selectedSquad: string;
  onSquadSelect: (squad: string) => void;
  club?: string;
  players: Player[];
}

const SQUAD_TYPES = [
  { id: 'first-team', label: 'First Team', icon: Trophy, color: 'bg-blue-600' },
  { id: 'u21', label: 'Under 21s', icon: Users, color: 'bg-green-600' },
  { id: 'u18', label: 'Under 18s', icon: Users, color: 'bg-purple-600' },
];

const SquadSelector = ({ selectedSquad, onSquadSelect, club, players }: SquadSelectorProps) => {
  const getSquadPlayerCount = (squadType: string) => {
    switch (squadType) {
      case 'first-team':
        return players.filter(p => {
          // Same logic as useSquadData: must be 21+, Chelsea-related, not on loan, not youth team
          if (p.age < 21) return false;
          const isOnLoan = p.club !== 'Chelsea FC' && 
                          !p.club?.includes('Chelsea') && 
                          p.club !== 'Unknown';
          if (isOnLoan) return false;
          const isChelsea = p.club === 'Chelsea FC' || 
                           (p.club?.includes('Chelsea') && 
                            !p.club?.includes('U21') && 
                            !p.club?.includes('U18'));
          return isChelsea;
        }).length;
      case 'u21':
        return players.filter(p => p.club?.includes('U21')).length;
      case 'u18':
        return players.filter(p => p.club?.includes('U18')).length;
      default:
        return 0;
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Squad Selection {club && `- ${club}`}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {SQUAD_TYPES.map((squad) => {
            const Icon = squad.icon;
            const isSelected = selectedSquad === squad.id;
            const playerCount = getSquadPlayerCount(squad.id);
            
            return (
              <Button
                key={squad.id}
                variant={isSelected ? "default" : "outline"}
                onClick={() => onSquadSelect(squad.id)}
                className={`flex items-center gap-2 ${
                  isSelected 
                    ? `${squad.color} text-white hover:${squad.color}/90` 
                    : 'hover:bg-gray-50'
                }`}
              >
                <Icon className="h-4 w-4" />
                {squad.label}
                <Badge 
                  variant="secondary" 
                  className={`ml-2 text-xs ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-gray-100'
                  }`}
                >
                  {playerCount}
                </Badge>
              </Button>
            );
          })}
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          {selectedSquad === 'first-team' 
            ? 'Main senior squad players at Chelsea FC'
            : selectedSquad === 'u21'
            ? 'Under 21 development squad players'
            : selectedSquad === 'u18'
            ? 'Under 18 academy players'
            : 'Select squad to analyze formation and player assignments'
          }
        </p>
        <div className="mt-2 text-xs text-muted-foreground">
          Total squad size: {players.length} players
        </div>
      </CardContent>
    </Card>
  );
};

export default SquadSelector;
