import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Player } from "@/types/player";
import { PlayerAvatar } from "@/components/ui/player-avatar";
import { Plus, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PositionPlayersTableProps {
  squadPlayers: Player[];
  selectedPosition: string | null;
  onPlayerChange?: (position: string, playerId: string) => void;
  onAddPlayerToPosition?: (position: string, playerId: string) => void;
}

const getPositionMapping = (pos: string): string[] => {
  switch (pos) {
    case 'GK': return ['GK'];
    case 'LB': return ['LB', 'LWB'];
    case 'CB1': case 'CB2': case 'CB3': return ['CB'];
    case 'RB': return ['RB', 'RWB'];
    case 'CDM': case 'CDM1': case 'CDM2': return ['CM', 'CDM'];
    case 'CM1': case 'CM2': case 'CM3': return ['CM', 'CAM'];
    case 'CAM': return ['CAM', 'CM'];
    case 'LM': return ['LM', 'W', 'LW'];
    case 'RM': return ['RM', 'W', 'RW'];
    case 'LW': return ['W', 'LW', 'LM'];
    case 'ST': case 'ST1': case 'ST2': return ['F', 'FW', 'ST', 'CF'];
    case 'RW': return ['W', 'RW', 'RM'];
    default: return [];
  }
};

const getPositionLabel = (position: string): string => {
  const labels: Record<string, string> = {
    'GK': 'Goalkeeper',
    'LB': 'Left Back',
    'CB1': 'Centre Back',
    'CB2': 'Centre Back',
    'RB': 'Right Back',
    'CDM': 'Defensive Mid',
    'CDM1': 'Defensive Mid',
    'CDM2': 'Defensive Mid',
    'CM1': 'Central Mid',
    'CM2': 'Central Mid',
    'CAM': 'Attacking Mid',
    'LW': 'Left Wing',
    'RW': 'Right Wing',
    'LM': 'Left Mid',
    'RM': 'Right Mid',
    'ST': 'Striker',
    'ST1': 'Striker',
    'ST2': 'Striker',
  };
  return labels[position] || position;
};

const PositionPlayersTable = ({
  squadPlayers,
  selectedPosition,
  onPlayerChange,
  onAddPlayerToPosition,
}: PositionPlayersTableProps) => {
  const navigate = useNavigate();
  
  const eligiblePlayers = useMemo(() => {
    if (!selectedPosition) return [];
    
    const allowedPositions = getPositionMapping(selectedPosition);
    return squadPlayers
      .filter(player => player.positions.some(pos => allowedPositions.includes(pos)))
      .sort((a, b) => {
        const ratingA = a.transferroomRating || a.xtvScore || 0;
        const ratingB = b.transferroomRating || b.xtvScore || 0;
        return ratingB - ratingA;
      });
  }, [selectedPosition, squadPlayers]);

  if (!selectedPosition) {
    return (
      <div className="bg-card border rounded-lg p-4">
        <p className="text-sm text-muted-foreground text-center">
          Select a position on the pitch to see eligible players
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2 border-b bg-muted/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="default">{selectedPosition}</Badge>
          <span className="text-sm font-medium">{getPositionLabel(selectedPosition)}</span>
        </div>
        <Badge variant="secondary">{eligiblePlayers.length} players</Badge>
      </div>
      
      {/* Player list */}
      <div className="divide-y max-h-[300px] overflow-y-auto">
        {eligiblePlayers.length > 0 ? (
          eligiblePlayers.map((player) => (
            <div
              key={player.id}
              className="flex items-center justify-between px-3 py-2 hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <PlayerAvatar 
                  playerName={player.name} 
                  avatarUrl={player.image} 
                  size="sm" 
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{player.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {player.positions.join(', ')} • Age {player.age}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 shrink-0">
                {player.transferroomRating && (
                  <Badge variant="outline" className="text-xs">
                    {player.transferroomRating}
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => onPlayerChange?.(selectedPosition, player.id)}
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => navigate(`/player/${player.id}`)}
                >
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))
        ) : (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No eligible players for this position
          </div>
        )}
      </div>
    </div>
  );
};

export default PositionPlayersTable;
