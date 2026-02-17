import { Badge } from "@/components/ui/badge";
import { Player } from "@/types/player";
import { Users } from "lucide-react";
import pitchBackground from "@/assets/pitch.svg";
import { cn } from "@/lib/utils";
import { useClubRatingWeights } from "@/hooks/useClubRatingWeights";
import { getClubRating } from "@/utils/clubRating";

interface PositionPlayerSlot {
  position: string;
  activePlayerId: string;
  alternatePlayerIds: string[];
}

interface SquadDepthViewProps {
  squadPlayers: Player[];
  allPlayers?: Player[];
  formation?: string;
  positionAssignments?: Array<{
    position: string;
    player_id: string;
  }>;
  multiPlayerSlots?: PositionPlayerSlot[];
  onPositionClick?: (position: string) => void;
  selectedPosition?: string | null;
}

// Horizontal layout - GK on left, attackers on right (shifted right to prevent GK cutoff)
const DEPTH_FORMATION_CONFIGS: Record<string, Record<string, { x: number; y: number; label: string }>> = {
  '4-3-3': {
    GK: { x: 10, y: 50, label: 'GK' },
    LB: { x: 30, y: 12, label: 'LB' },
    CB1: { x: 30, y: 36, label: 'CB' },
    CB2: { x: 30, y: 64, label: 'CB' },
    RB: { x: 30, y: 88, label: 'RB' },
    CDM: { x: 48, y: 50, label: 'DM' },
    CM1: { x: 58, y: 30, label: 'CM' },
    CM2: { x: 58, y: 70, label: 'CM' },
    LW: { x: 76, y: 15, label: 'LW' },
    ST: { x: 89, y: 50, label: 'ST' },
    RW: { x: 76, y: 85, label: 'RW' },
  },
  '4-2-3-1': {
    GK: { x: 10, y: 50, label: 'GK' },
    LB: { x: 30, y: 12, label: 'LB' },
    CB1: { x: 30, y: 36, label: 'CB' },
    CB2: { x: 30, y: 64, label: 'CB' },
    RB: { x: 30, y: 88, label: 'RB' },
    CDM1: { x: 46, y: 35, label: 'DM' },
    CDM2: { x: 46, y: 65, label: 'DM' },
    LW: { x: 64, y: 15, label: 'LW' },
    CAM: { x: 64, y: 50, label: 'AM' },
    RW: { x: 64, y: 85, label: 'RW' },
    ST: { x: 86, y: 50, label: 'ST' },
  },
  '4-4-2': {
    GK: { x: 10, y: 50, label: 'GK' },
    LB: { x: 30, y: 12, label: 'LB' },
    CB1: { x: 30, y: 36, label: 'CB' },
    CB2: { x: 30, y: 64, label: 'CB' },
    RB: { x: 30, y: 88, label: 'RB' },
    LM: { x: 52, y: 15, label: 'LM' },
    CM1: { x: 52, y: 38, label: 'CM' },
    CM2: { x: 52, y: 62, label: 'CM' },
    RM: { x: 52, y: 85, label: 'RM' },
    ST1: { x: 80, y: 35, label: 'ST' },
    ST2: { x: 80, y: 65, label: 'ST' },
  },
};


const SquadDepthView = ({
  squadPlayers,
  allPlayers = [],
  formation = '4-3-3',
  positionAssignments = [],
  multiPlayerSlots = [],
  onPositionClick,
  selectedPosition,
}: SquadDepthViewProps) => {
  const { data: clubRatingData } = useClubRatingWeights();
  const clubWeights = clubRatingData?.weights;
  const currentFormation = DEPTH_FORMATION_CONFIGS[formation] || DEPTH_FORMATION_CONFIGS['4-3-3'];

  // Create a map of position -> ALL assigned player IDs (active + alternates) for quick lookup
  const positionToAssignedPlayers = new Map<string, string[]>();
  
  // Use multiPlayerSlots if available (includes alternates), otherwise fall back to positionAssignments
  if (multiPlayerSlots.length > 0) {
    multiPlayerSlots.forEach(slot => {
      const allPlayerIds = [slot.activePlayerId, ...slot.alternatePlayerIds].filter(Boolean);
      positionToAssignedPlayers.set(slot.position, allPlayerIds);
    });
  } else {
    positionAssignments.forEach(a => {
      const existing = positionToAssignedPlayers.get(a.position) || [];
      existing.push(a.player_id);
      positionToAssignedPlayers.set(a.position, existing);
    });
  }


  // Helper to check if a player belongs to the club's squad (Chelsea)
  const isClubPlayer = (player: Player): boolean => {
    return player.club === 'Chelsea FC' || 
           (player.club?.includes('Chelsea') ?? false);
  };

  // Get only assigned players for each position (consistent with shadow squad sidebar)
  const getPositionDepth = (position: string): Array<Player & { isExternal?: boolean }> => {
    const assignedPlayerIds = positionToAssignedPlayers.get(position) || [];
    
    // Only show players that are explicitly assigned to this position
    return assignedPlayerIds
      .map(id => {
        const player = squadPlayers.find(p => p.id === id) || allPlayers.find(p => p.id === id);
        return player ? { ...player, isExternal: !isClubPlayer(player) } : undefined;
      })
      .filter((p): p is Player & { isExternal: boolean } => p !== undefined);
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
      {(() => {
        // Pre-compute all position averages for relative color scaling
        const positionEntries = Object.entries(currentFormation);
        const positionAvgMap = new Map<string, number | null>();
        const allAvgs: number[] = [];

        positionEntries.forEach(([position]) => {
          const players = getPositionDepth(position);
          const ratings = players
            .map(p => getClubRating(p, clubWeights) ?? p.xtvScore)
            .filter((r): r is number => r !== null && r !== undefined);
          const avg = ratings.length > 0 ? Math.round(ratings.reduce((a, b) => a + b, 0) / ratings.length) : null;
          positionAvgMap.set(position, avg);
          if (avg !== null) allAvgs.push(avg);
        });

        const minAvg = allAvgs.length > 0 ? Math.min(...allAvgs) : 0;
        const maxAvg = allAvgs.length > 0 ? Math.max(...allAvgs) : 100;
        const range = maxAvg - minAvg || 1;

        const getRelativeRatingColor = (avg: number): string => {
          const normalized = (avg - minAvg) / range; // 0 = lowest, 1 = highest
          if (normalized >= 0.75) return 'text-emerald-500';
          if (normalized >= 0.5) return 'text-primary';
          if (normalized >= 0.25) return 'text-amber-500';
          return 'text-red-500';
        };

        return positionEntries.map(([position, config]) => {
        const players = getPositionDepth(position);
        const displayPlayers = players.slice(0, 3);
        const remainingCount = players.length - 3;
        const hasExternalPlayers = players.some(p => p.isExternal);
        const posAvg = positionAvgMap.get(position) ?? null;
        
        return (
          <div
            key={position}
            className="absolute transform -translate-x-1/2 -translate-y-1/2"
            style={{
              left: `${config.x}%`,
              top: `${config.y}%`,
            }}
          >
            {/* Position card - gold when external players added, ring when selected */}
            <div 
              className={cn(
                "backdrop-blur-sm rounded-md shadow-lg min-w-[180px] max-w-[210px] cursor-pointer transition-all",
                "bg-slate-800 border border-slate-700",
                selectedPosition === position && "ring-2 ring-primary ring-offset-2 ring-offset-[#3A9D5C]"
              )}
              onClick={() => onPositionClick?.(position)}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-2 py-1.5 border-b border-slate-700">
                <span className="text-xs font-semibold text-white">{config.label}</span>
                <div className="flex items-center gap-1.5">
                  {posAvg !== null && (
                    <span className={cn("text-xs font-bold tabular-nums", getRelativeRatingColor(posAvg))}>
                      {posAvg}
                    </span>
                  )}
                  <Badge 
                    variant="secondary" 
                    className="h-5 min-w-5 px-1.5 text-xs font-medium border-0 bg-emerald-500 text-white"
                  >
                    <Users className="w-2.5 h-2.5 mr-0.5" />
                    {players.length}
                  </Badge>
                </div>
              </div>
              
              {/* Player list */}
              <div className="p-1.5 space-y-1">
              {displayPlayers.length > 0 ? (
                  displayPlayers.map((player) => {
                    const rating = getClubRating(player, clubWeights) ?? player.xtvScore;
                    const isExternal = player.isExternal || false;
                    
                    return (
                      <div 
                        key={player.id}
                        className={cn(
                          "flex items-center justify-between gap-1 px-1.5 py-1 rounded transition-colors",
                          isExternal
                            ? "bg-sky-200/60 hover:bg-sky-200/80"
                            : "bg-white/95 hover:bg-white"
                        )}
                      >
                        <div className="flex items-center justify-between gap-1.5 min-w-0 flex-1">
                          <span className={cn(
                            "text-xs font-medium truncate",
                            isExternal ? "text-sky-950" : "text-slate-800"
                          )}>
                            {player.name}
                          </span>
                          <span className={cn(
                            "text-xs font-bold tabular-nums shrink-0",
                            getRatingColor(rating)
                          )}>
                            {rating || '-'}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="px-1.5 py-2 text-center">
                    <span className="text-xs italic text-slate-400">No players</span>
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
      });
      })()}
    </div>
  );
};

export default SquadDepthView;
