import { Badge } from "@/components/ui/badge";
import { Player } from "@/types/player";
import { Users } from "lucide-react";
import pitchBackground from "@/assets/pitch.svg";
import { cn } from "@/lib/utils";

interface SquadDepthViewProps {
  squadPlayers: Player[];
  allPlayers?: Player[];
  formation?: string;
  positionAssignments?: Array<{
    position: string;
    player_id: string;
  }>;
}

// Horizontal layout - GK on left, attackers on right (shifted right to prevent GK cutoff)
const DEPTH_FORMATION_CONFIGS: Record<string, Record<string, { x: number; y: number; label: string }>> = {
  '4-3-3': {
    GK: { x: 10, y: 50, label: 'GK' },
    LB: { x: 24, y: 12, label: 'LB' },
    CB1: { x: 24, y: 36, label: 'CB' },
    CB2: { x: 24, y: 64, label: 'CB' },
    RB: { x: 24, y: 88, label: 'RB' },
    CDM: { x: 45, y: 50, label: 'DM' },
    CM1: { x: 55, y: 30, label: 'CM' },
    CM2: { x: 55, y: 70, label: 'CM' },
    LW: { x: 75, y: 15, label: 'LW' },
    ST: { x: 88, y: 50, label: 'ST' },
    RW: { x: 75, y: 85, label: 'RW' },
  },
  '4-2-3-1': {
    GK: { x: 10, y: 50, label: 'GK' },
    LB: { x: 24, y: 12, label: 'LB' },
    CB1: { x: 24, y: 36, label: 'CB' },
    CB2: { x: 24, y: 64, label: 'CB' },
    RB: { x: 24, y: 88, label: 'RB' },
    CDM1: { x: 42, y: 35, label: 'DM' },
    CDM2: { x: 42, y: 65, label: 'DM' },
    LW: { x: 62, y: 15, label: 'LW' },
    CAM: { x: 62, y: 50, label: 'AM' },
    RW: { x: 62, y: 85, label: 'RW' },
    ST: { x: 85, y: 50, label: 'ST' },
  },
  '4-4-2': {
    GK: { x: 10, y: 50, label: 'GK' },
    LB: { x: 24, y: 12, label: 'LB' },
    CB1: { x: 24, y: 36, label: 'CB' },
    CB2: { x: 24, y: 64, label: 'CB' },
    RB: { x: 24, y: 88, label: 'RB' },
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
  allPlayers = [],
  formation = '4-3-3',
  positionAssignments = [],
}: SquadDepthViewProps) => {
  const currentFormation = DEPTH_FORMATION_CONFIGS[formation] || DEPTH_FORMATION_CONFIGS['4-3-3'];

  // Create a map of position -> assigned player IDs for quick lookup
  const positionToAssignedPlayers = new Map<string, string[]>();
  positionAssignments.forEach(a => {
    const existing = positionToAssignedPlayers.get(a.position) || [];
    existing.push(a.player_id);
    positionToAssignedPlayers.set(a.position, existing);
  });

  // Get IDs of players in the squad
  const squadPlayerIds = new Set(squadPlayers.map(p => p.id));

  // Calculate depth for each position - includes both squad players and assigned external players
  const getPositionDepth = (position: string): Array<Player & { isExternal?: boolean }> => {
    const allowedPositions = getPositionMapping(position);
    
    // Get squad players eligible for this position
    const eligibleSquadPlayers = squadPlayers.filter(player =>
      player.positions.some(pos => allowedPositions.includes(pos))
    );

    // Get externally assigned players for this specific position
    const assignedPlayerIds = positionToAssignedPlayers.get(position) || [];
    const externalPlayers = assignedPlayerIds
      .filter(id => !squadPlayerIds.has(id)) // Only players not in squad
      .map(id => allPlayers.find(p => p.id === id))
      .filter((p): p is Player => p !== undefined)
      .map(p => ({ ...p, isExternal: true }));

    // Combine and sort by rating
    const allPositionPlayers = [
      ...externalPlayers, // External players first (they're the new additions)
      ...eligibleSquadPlayers.map(p => ({ ...p, isExternal: false }))
    ];

    return allPositionPlayers.sort((a, b) => {
      // External players sort first
      if (a.isExternal && !b.isExternal) return -1;
      if (!a.isExternal && b.isExternal) return 1;
      // Then by rating
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

  // Get rating color based on value
  const getRatingColor = (rating: number | undefined): string => {
    if (!rating) return 'text-slate-400';
    if (rating >= 80) return 'text-emerald-500';
    if (rating >= 70) return 'text-primary';
    if (rating >= 60) return 'text-yellow-500';
    return 'text-orange-500';
  };

  return (
    <div className="relative w-full rounded-lg overflow-hidden bg-[#3A9D5C]" style={{ aspectRatio: '16/9' }}>
      {/* Football pitch background - rotated */}
      <div 
        className="absolute inset-0 bg-cover bg-center pointer-events-none opacity-30"
        style={{ 
          backgroundImage: `url(${pitchBackground})`,
          transform: 'rotate(-90deg) scaleX(-1)',
          transformOrigin: 'center center',
        }}
      />

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
            {/* Position card - white background */}
            <div className="bg-slate-800 backdrop-blur-sm rounded-md border border-slate-700 shadow-lg min-w-[120px] max-w-[140px]">
              {/* Header */}
              <div className="flex items-center justify-between px-2 py-1.5 border-b border-slate-700">
                <span className="text-xs font-semibold text-white">{config.label}</span>
                <Badge 
                  variant="secondary" 
                  className="h-5 min-w-5 px-1.5 text-xs font-medium bg-emerald-500 text-white border-0"
                >
                  <Users className="w-2.5 h-2.5 mr-0.5" />
                  {players.length}
                </Badge>
              </div>
              
              {/* Player list */}
              <div className="p-1.5 space-y-1">
              {displayPlayers.length > 0 ? (
                  displayPlayers.map((player) => {
                    const rating = player.transferroomRating || player.xtvScore;
                    const isExternal = player.isExternal || false;
                    
                    return (
                      <div 
                        key={player.id}
                        className={cn(
                          "flex items-center justify-between gap-1 px-1.5 py-1 rounded transition-colors",
                          isExternal 
                            ? "bg-amber-400/90 hover:bg-amber-400 border border-amber-500/50" 
                            : "bg-white/95 hover:bg-white"
                        )}
                      >
                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                          <span className={cn(
                            "text-xs font-bold tabular-nums min-w-[24px]",
                            getRatingColor(rating)
                          )}>
                            {rating || '-'}
                          </span>
                          <span className={cn(
                            "text-xs font-medium truncate",
                            isExternal ? "text-amber-900" : "text-slate-800"
                          )}>
                            {getAbbreviatedName(player.name)}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="px-1.5 py-2 text-center">
                    <span className="text-xs text-slate-400 italic">No players</span>
                  </div>
                )}
                
                {/* More players indicator */}
                {remainingCount > 0 && (
                  <div className="px-1.5 py-0.5 text-center">
                    <span className="text-xs text-slate-400">
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
