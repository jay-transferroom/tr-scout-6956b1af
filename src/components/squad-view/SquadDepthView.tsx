import { forwardRef, useState, useRef, useLayoutEffect, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Player } from "@/types/player";
import { Users, ChevronDown, Download, FileImage, FileText, Users2 } from "lucide-react";
import pitchBackground from "@/assets/pitch.svg";
import { cn } from "@/lib/utils";
import { useClubRatingWeights } from "@/hooks/useClubRatingWeights";
import { getClubRating } from "@/utils/clubRating";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";




interface PositionPlayerSlot {
  position: string;
  activePlayerId: string;
  alternatePlayerIds: string[];
}

export type DepthDensity = 'compact' | 'standard' | 'full';

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
  playerReportRatings?: Map<string, { rating: number | string; raw: any }>;
  density?: DepthDensity;
  onDensityChange?: (d: DepthDensity) => void;
  onExportPng?: () => void;
  onExportPdf?: () => void;
  onFillDepth?: () => void;
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


const SquadDepthView = forwardRef<HTMLDivElement, SquadDepthViewProps>(({
  squadPlayers,
  allPlayers = [],
  formation = '4-3-3',
  positionAssignments = [],
  multiPlayerSlots = [],
  onPositionClick,
  selectedPosition,
  playerReportRatings = new Map(),
  density = 'compact',
  onDensityChange,
  onExportPng,
  onExportPdf,
  onFillDepth,

}, ref) => {
  const { data: clubRatingData } = useClubRatingWeights();
  const clubWeights = clubRatingData?.weights;
  const currentFormation = DEPTH_FORMATION_CONFIGS[formation] || DEPTH_FORMATION_CONFIGS['4-3-3'];
  const [expandedPosition, setExpandedPosition] = useState<string | null>(null);

  // Density-driven presentation
  const densityConfig = {
    compact: {
      collapsedCount: 5,
      minWidth: 'min-w-[150px] max-w-[180px]',
      rowPadding: 'px-1.5 py-[3px]',
      rowText: 'text-[11px]',
      pillText: 'text-[10px]',
      headerText: 'text-[11px]',
      baseAspect: 16 / 9,
      estCardWidth: 170,
      estHeaderHeight: 26,
      estRowHeight: 20,
    },
    standard: {
      collapsedCount: 3,
      minWidth: 'min-w-[180px] max-w-[210px]',
      rowPadding: 'px-1.5 py-1',
      rowText: 'text-xs',
      pillText: 'text-xs',
      headerText: 'text-xs',
      baseAspect: 16 / 9,
      estCardWidth: 195,
      estHeaderHeight: 28,
      estRowHeight: 26,
    },
    full: {
      collapsedCount: 5,
      minWidth: 'min-w-[200px] max-w-[230px]',
      rowPadding: 'px-2 py-1.5',
      rowText: 'text-xs',
      pillText: 'text-xs',
      headerText: 'text-sm',
      baseAspect: 4 / 3,
      estCardWidth: 215,
      estHeaderHeight: 32,
      estRowHeight: 30,
    },
  }[density];




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

  // Get bg + text color for report rating as a pill
  const getReportRatingStyles = (rating: number | string): string => {
    if (typeof rating === 'string') {
      const letter = rating.trim().toUpperCase();
      switch (letter) {
        case 'A': return 'bg-emerald-500 text-white';
        case 'B': return 'bg-green-500 text-white';
        case 'C': return 'bg-yellow-400 text-yellow-950';
        case 'D': return 'bg-orange-400 text-orange-950';
        case 'E': return 'bg-red-500 text-white';
        default: return 'bg-primary text-primary-foreground';
      }
    }
    if (rating >= 8) return 'bg-emerald-500 text-white';
    if (rating >= 6) return 'bg-green-500 text-white';
    if (rating >= 5) return 'bg-yellow-400 text-yellow-950';
    if (rating >= 3) return 'bg-orange-400 text-orange-950';
    return 'bg-red-500 text-white';
  };

  // Merge forwarded ref with local ref so we can observe container width
  const containerRef = useRef<HTMLDivElement | null>(null);
  const setContainerRef = (node: HTMLDivElement | null) => {
    containerRef.current = node;
    if (typeof ref === 'function') ref(node);
    else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
  };

  const [containerWidth, setContainerWidth] = useState(0);
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setContainerWidth(el.clientWidth);
    update();
    const obs = new ResizeObserver(update);
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Pre-compute per-position players & card heights, then resolve vertical
  // collisions between horizontally-overlapping cards. Grow container height
  // if the resolved layout exceeds the base pitch height.
  const positionEntries = Object.entries(currentFormation);
  const layout = useMemo(() => {
    if (!containerWidth) return null;
    const baseHeight = containerWidth / densityConfig.baseAspect;
    const cardWidth = densityConfig.estCardWidth;

    const items = positionEntries.map(([position, config]) => {
      const players = getPositionDepth(position);
      const canExpand = density === 'standard' && players.length > densityConfig.collapsedCount;
      const isExpanded = canExpand && expandedPosition === position;
      const rowsShown = density === 'standard' && !isExpanded
        ? Math.min(Math.max(players.length, 1), densityConfig.collapsedCount)
        : Math.min(Math.max(players.length, 1), 5);
      const bodyHeight = rowsShown * densityConfig.estRowHeight + 10;
      const expandBtnH = canExpand ? 24 : 0;
      const cardHeight = densityConfig.estHeaderHeight + bodyHeight + expandBtnH;
      return {
        position,
        cardHeight,
        cardWidth,
        cx: (config.x / 100) * containerWidth,
        cy: (config.y / 100) * baseHeight,
      };
    });

    const VERT_PAD = 6;
    for (let iter = 0; iter < 60; iter++) {
      let moved = false;
      for (let i = 0; i < items.length; i++) {
        for (let j = i + 1; j < items.length; j++) {
          const a = items[i];
          const b = items[j];
          const dx = Math.abs(a.cx - b.cx);
          const minDx = (a.cardWidth + b.cardWidth) / 2 + 4;
          if (dx >= minDx) continue;
          const dy = b.cy - a.cy;
          const minDy = (a.cardHeight + b.cardHeight) / 2 + VERT_PAD;
          const absDy = Math.abs(dy);
          if (absDy >= minDy) continue;
          const push = (minDy - absDy) / 2 + 0.05;
          if (dy >= 0) { a.cy -= push; b.cy += push; }
          else { a.cy += push; b.cy -= push; }
          moved = true;
        }
      }
      if (!moved) break;
    }

    const OUTER = 10;
    let top = Infinity;
    let bottom = -Infinity;
    items.forEach(it => {
      top = Math.min(top, it.cy - it.cardHeight / 2);
      bottom = Math.max(bottom, it.cy + it.cardHeight / 2);
    });
    const shift = OUTER - top;
    if (shift !== 0) {
      items.forEach(it => { it.cy += shift; });
      top += shift;
      bottom += shift;
    }
    const height = Math.max(baseHeight, bottom + OUTER);

    const byPosition = new Map(items.map(it => [it.position, it]));
    return { byPosition, height };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerWidth, density, expandedPosition, formation, squadPlayers, allPlayers, multiPlayerSlots, positionAssignments]);

  const containerStyle: React.CSSProperties = layout
    ? { height: layout.height }
    : { aspectRatio: densityConfig.baseAspect === 4 / 3 ? '4 / 3' : '16 / 9' };

  return (
    <div ref={setContainerRef} className="relative w-full rounded-lg overflow-hidden bg-[#3A9D5C]" style={containerStyle}>

      {/* Football pitch background - rotated */}
      <div 
        className="absolute inset-0 bg-cover bg-center pointer-events-none opacity-30"
        style={{ 
          backgroundImage: `url(${pitchBackground})`,
          transform: 'rotate(-90deg) scaleX(-1)',
          transformOrigin: 'center center',
        }}
      />

      {/* Floating overlay controls - excluded from exports */}
      {(onDensityChange || onExportPng || onExportPdf || onFillDepth) && (
        <div
          data-export-hidden="true"
          className="absolute top-2 right-2 z-30 flex items-center gap-1"
        >
          {onDensityChange && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-1 h-7 pl-2 pr-1.5 rounded-md bg-slate-900/70 hover:bg-slate-900/85 text-white text-[11px] font-medium capitalize backdrop-blur-sm transition-colors"
                  aria-label="Change depth density"
                >
                  {density}
                  <ChevronDown className="h-3 w-3 opacity-80" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-background z-50 min-w-[8rem]">
                <DropdownMenuLabel>Density</DropdownMenuLabel>
                {(['compact', 'standard', 'full'] as const).map((d) => (
                  <DropdownMenuItem
                    key={d}
                    onClick={() => onDensityChange(d)}
                    className={cn("capitalize cursor-pointer", density === d && "font-semibold")}
                  >
                    {d}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {(onExportPng || onExportPdf || onFillDepth) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center justify-center h-7 w-7 rounded-md bg-slate-900/70 hover:bg-slate-900/85 text-white backdrop-blur-sm transition-colors"
                  aria-label="Export depth chart"
                >
                  <Download className="h-3.5 w-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-background z-50">
                {onFillDepth && (
                  <>
                    <DropdownMenuLabel>Demo</DropdownMenuLabel>
                    <DropdownMenuItem onClick={onFillDepth} className="cursor-pointer">
                      <Users2 className="h-4 w-4 mr-2" />
                      Fill depth (5 per position)
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuLabel>Export</DropdownMenuLabel>
                {onExportPng && (
                  <DropdownMenuItem onClick={onExportPng} className="cursor-pointer">
                    <FileImage className="h-4 w-4 mr-2" />
                    Pitch snapshot (PNG)
                  </DropdownMenuItem>
                )}
                {onExportPdf && (
                  <DropdownMenuItem onClick={onExportPdf} className="cursor-pointer">
                    <FileText className="h-4 w-4 mr-2" />
                    Full depth chart (PDF)
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      )}




      {/* Position cards */}
      {(() => {
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
          const normalized = (avg - minAvg) / range;
          if (normalized >= 0.75) return 'text-emerald-500';
          if (normalized >= 0.5) return 'text-primary';
          if (normalized >= 0.25) return 'text-amber-500';
          return 'text-red-500';
        };

        return positionEntries.map(([position, config]) => {
          const players = getPositionDepth(position);
          const COLLAPSED_COUNT = densityConfig.collapsedCount;
          const canExpand = density === 'standard' && players.length > COLLAPSED_COUNT;
          const isExpanded = canExpand && expandedPosition === position;
          const displayPlayers = density === 'standard' && !isExpanded
            ? players.slice(0, COLLAPSED_COUNT)
            : players;
          const remainingCount = players.length - COLLAPSED_COUNT;
          const posAvg = positionAvgMap.get(position) ?? null;
          const laid = layout?.byPosition.get(position);

          const posStyle: React.CSSProperties = laid
            ? { left: `${laid.cx}px`, top: `${laid.cy}px` }
            : { left: `${config.x}%`, top: `${config.y}%` };

          return (
            <div
              key={position}
              className={cn(
                "absolute transform -translate-x-1/2 -translate-y-1/2",
                isExpanded && "z-20"
              )}
              style={posStyle}
            >

              <div 
                className={cn(
                  "backdrop-blur-sm rounded-md shadow-lg transition-all",
                  densityConfig.minWidth,
                  "bg-slate-800 border border-slate-700",
                  selectedPosition === position && "ring-2 ring-primary ring-offset-2 ring-offset-[#3A9D5C]"
                )}
              >
                {/* Header */}
                <div
                  className="flex items-center justify-between px-2 py-1 border-b border-slate-700 cursor-pointer"
                  onClick={() => onPositionClick?.(position)}
                >
                  <span className={cn("font-semibold text-white", densityConfig.headerText)}>{config.label}</span>
                  <div className="flex items-center gap-1.5">
                    {posAvg !== null && (
                      <span className={cn("font-bold tabular-nums", densityConfig.headerText, getRelativeRatingColor(posAvg))}>
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
                <div className={cn(
                  "p-1 space-y-0.5",
                  isExpanded && "max-h-[280px] overflow-y-auto"
                )}>
                  {displayPlayers.length > 0 ? (
                    displayPlayers.map((player) => {
                      const reportRating = playerReportRatings.get(player.id);
                      const clubRating = getClubRating(player, clubWeights) ?? player.xtvScore;
                      const hasReport = !!reportRating;
                      const displayRating = hasReport ? reportRating.rating : clubRating;
                      const isExternal = player.isExternal || false;
                      
                      return (
                        <div 
                          key={player.id}
                          className={cn(
                            "flex items-center justify-between gap-1 rounded transition-colors",
                            densityConfig.rowPadding,
                            isExternal
                              ? "bg-sky-200/60 hover:bg-sky-200/80"
                              : "bg-white/95 hover:bg-white"
                          )}
                        >
                          <div className="flex items-center justify-between gap-1.5 min-w-0 flex-1">
                            <span className={cn(
                              "font-medium truncate",
                              densityConfig.rowText,
                              isExternal ? "text-sky-950" : "text-slate-800"
                            )}>
                              {player.name}
                            </span>
                            {hasReport ? (
                              <span className={cn(
                                "font-bold tabular-nums shrink-0 rounded px-1.5 py-0.5",
                                densityConfig.pillText,
                                getReportRatingStyles(reportRating.rating)
                              )}>
                                {displayRating}
                              </span>
                            ) : (
                              <span className={cn(
                                "font-bold tabular-nums shrink-0",
                                densityConfig.pillText,
                                getRatingColor(clubRating)
                              )}>
                                {displayRating || '-'}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="px-1.5 py-2 text-center">
                      <span className="text-xs italic text-slate-400">No players</span>
                    </div>
                  )}
                </div>

                {/* Expand / collapse control (standard density only) */}
                {canExpand && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedPosition(isExpanded ? null : position);
                    }}
                    className="w-full flex items-center justify-center gap-1 px-1.5 py-1 border-t border-slate-700 text-[11px] text-slate-300 hover:bg-slate-700/50 transition-colors"
                  >
                    {isExpanded ? (
                      <>
                        <ChevronDown className="w-3 h-3 rotate-180" />
                        Show less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-3 h-3" />
                        +{remainingCount} more
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        });
      })()}
    </div>
  );
});

SquadDepthView.displayName = "SquadDepthView";

export default SquadDepthView;

