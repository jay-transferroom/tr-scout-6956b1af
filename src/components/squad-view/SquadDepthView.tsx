import { Badge } from "@/components/ui/badge";
import { Player } from "@/types/player";
import { Users, Star, Minus } from "lucide-react";
import pitchBackground from "@/assets/pitch.svg";

interface SquadDepthViewProps {
  squadPlayers: Player[];
  formation?: string;
  positionAssignments?: Array<{
    position: string;
    player_id: string;
  }>;
}

// Horizontal layout - GK on left, attackers on right
const DEPTH_FORMATION_CONFIGS: Record<string, Record<string, { x: number; y: number; label: string }>> = {
  '4-3-3': {
    GK: { x: 5, y: 50, label: 'GK' },
    LB: { x: 22, y: 15, label: 'LB' },
    CB1: { x: 22, y: 38, label: 'CB' },
    CB2: { x: 22, y: 62, label: 'CB' },
    RB: { x: 22, y: 85, label: 'RB' },
    CDM: { x: 45, y: 50, label: 'DM' },
    CM1: { x: 55, y: 30, label: 'CM' },
    CM2: { x: 55, y: 70, label: 'CM' },
    LW: { x: 78, y: 18, label: 'LW' },
    ST: { x: 90, y: 50, label: 'ST' },
    RW: { x: 78, y: 82, label: 'RW' },
  },
  '4-2-3-1': {
    GK: { x: 5, y: 50, label: 'GK' },
    LB: { x: 22, y: 15, label: 'LB' },
    CB1: { x: 22, y: 38, label: 'CB' },
    CB2: { x: 22, y: 62, label: 'CB' },
    RB: { x: 22, y: 85, label: 'RB' },
    CDM1: { x: 42, y: 35, label: 'DM' },
    CDM2: { x: 42, y: 65, label: 'DM' },
    LW: { x: 62, y: 18, label: 'LW' },
    CAM: { x: 62, y: 50, label: 'AM' },
    RW: { x: 62, y: 82, label: 'RW' },
    ST: { x: 85, y: 50, label: 'ST' },
  },
  '4-4-2': {
    GK: { x: 5, y: 50, label: 'GK' },
    LB: { x: 22, y: 15, label: 'LB' },
    CB1: { x: 22, y: 38, label: 'CB' },
    CB2: { x: 22, y: 62, label: 'CB' },
    RB: { x: 22, y: 85, label: 'RB' },
    LM: { x: 50, y: 15, label: 'LM' },
    CM1: { x: 50, y: 38, label: 'CM' },
    CM2: { x: 50, y: 62, label: 'CM' },
    RM: { x: 50, y: 85, label: 'RM' },
    ST1: { x: 80, y: 35, label: 'ST' },
    ST2: { x: 80, y: 65, label: 'ST' },
  },
};

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

const SquadDepthView = ({
  squadPlayers,
  formation = '4-3-3',
}: SquadDepthViewProps) => {
  const currentFormation = DEPTH_FORMATION_CONFIGS[formation] || DEPTH_FORMATION_CONFIGS['4-3-3'];

  // Calculate depth for each position
  const getPositionDepth = (position: string) => {
    const allowedPositions = getPositionMapping(position);
    const availablePlayers = squadPlayers.filter(player =>
      player.positions.some(pos => allowedPositions.includes(pos))
    );

    // Sort by rating
    return availablePlayers.sort((a, b) => {
      const ratingA = a.transferroomRating || a.xtvScore || 0;
      const ratingB = b.transferroomRating || b.xtvScore || 0;
      return ratingB - ratingA;
    });
  };

  // Get abbreviated name (First initial + surname)
  const getAbbreviatedName = (name: string): string => {
    const parts = name.split(' ');
    if (parts.length === 1) return parts[0].substring(0, 4);
    const firstName = parts[0];
    const lastName = parts[parts.length - 1];
    return `${firstName[0]}. ${lastName.substring(0, 5)}`;
  };

  // Get star rating visual
  const getStarRating = (rating: number | undefined): number => {
    if (!rating) return 0;
    if (rating >= 85) return 5;
    if (rating >= 75) return 4;
    if (rating >= 65) return 3;
    if (rating >= 55) return 2;
    return 1;
  };

  const renderStars = (rating: number | undefined) => {
    const stars = getStarRating(rating);
    const fullStars = Math.floor(stars);
    const hasHalf = stars % 1 >= 0.5;
    
    return (
      <div className="flex items-center gap-0.5">
        {[...Array(fullStars)].map((_, i) => (
          <Star key={i} className="w-2.5 h-2.5 fill-primary text-primary" />
        ))}
        {hasHalf && <Star className="w-2.5 h-2.5 fill-primary/50 text-primary" />}
        {[...Array(5 - Math.ceil(stars))].map((_, i) => (
          <Star key={`empty-${i}`} className="w-2.5 h-2.5 text-muted-foreground/30" />
        ))}
      </div>
    );
  };

  return (
    <div className="relative w-full rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
      {/* Football pitch background - rotated */}
      <div 
        className="absolute inset-0 bg-cover bg-center pointer-events-none"
        style={{ 
          backgroundImage: `url(${pitchBackground})`,
          transform: 'rotate(-90deg) scaleX(-1)',
          transformOrigin: 'center center',
        }}
      />
      
      {/* Overlay for better contrast */}
      <div className="absolute inset-0 bg-black/20" />

      {/* Position cards */}
      {Object.entries(currentFormation).map(([position, config]) => {
        const players = getPositionDepth(position);
        const displayPlayers = players.slice(0, 3);
        const remainingCount = players.length - 3;
        
        return (
          <div
            key={position}
            className="absolute transform -translate-x-1/2 -translate-y-1/2"
            style={{
              left: `${config.x}%`,
              top: `${config.y}%`,
            }}
          >
            {/* Position card */}
            <div className="bg-secondary/95 backdrop-blur-sm rounded-md border border-border/50 shadow-lg min-w-[120px] max-w-[140px]">
              {/* Header */}
              <div className="flex items-center justify-between px-2 py-1.5 border-b border-border/50 bg-secondary-foreground/5">
                <span className="text-xs font-semibold text-secondary-foreground">{config.label}</span>
                <Badge 
                  variant="secondary" 
                  className="h-5 min-w-5 px-1.5 text-xs font-medium bg-primary text-primary-foreground"
                >
                  <Users className="w-2.5 h-2.5 mr-0.5" />
                  {players.length}
                </Badge>
              </div>
              
              {/* Player list */}
              <div className="p-1.5 space-y-1">
                {displayPlayers.length > 0 ? (
                  displayPlayers.map((player) => (
                    <div 
                      key={player.id}
                      className="flex items-center justify-between gap-1 px-1.5 py-1 rounded bg-background/50 hover:bg-background/80 transition-colors"
                    >
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        {renderStars(player.transferroomRating || player.xtvScore)}
                        <span className="text-xs font-medium text-foreground truncate">
                          {getAbbreviatedName(player.name)}
                        </span>
                      </div>
                      <button className="shrink-0 w-4 h-4 rounded-full bg-destructive/20 hover:bg-destructive/40 flex items-center justify-center transition-colors">
                        <Minus className="w-2.5 h-2.5 text-destructive" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="px-1.5 py-2 text-center">
                    <span className="text-xs text-muted-foreground italic">No players</span>
                  </div>
                )}
                
                {/* More players indicator */}
                {remainingCount > 0 && (
                  <div className="px-1.5 py-0.5 text-center">
                    <span className="text-xs text-muted-foreground">
                      +{remainingCount} more player{remainingCount > 1 ? 's' : ''}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SquadDepthView;
