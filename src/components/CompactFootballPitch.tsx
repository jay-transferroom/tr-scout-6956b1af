import { useState } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Player } from "@/types/player";
import { Plus, Hash, AlertTriangle, Clock, ChevronDown, Users } from "lucide-react";
import pitchBackground from "@/assets/pitch.svg";
import { useSquadRecommendations } from "@/hooks/useSquadRecommendations";
import { useSquadAverageRatings } from "@/hooks/useSquadAverageRatings";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

export interface PositionPlayerSlot {
  position: string;
  activePlayerId: string;
  alternatePlayerIds: string[];
}

interface CompactFootballPitchProps {
  players: Player[];
  allPlayers?: Player[];
  squadType: string;
  formation?: string;
  positionAssignments?: Array<{
    position: string;
    player_id: string;
  }>;
  multiPlayerSlots?: PositionPlayerSlot[];
  onPositionClick?: (position: string) => void;
  selectedPosition?: string | null;
  onPlayerChange?: (position: string, playerId: string) => void;
  onAddPlayerToPosition?: (position: string, playerId: string) => void;
  onSetActivePlayer?: (position: string, playerId: string) => void;
  priorityPositions?: string[];
  disableAutoFill?: boolean;
}

// Simplified formation configurations for compact view - GK at bottom, attackers at top
const COMPACT_FORMATION_CONFIGS: Record<string, Record<string, { x: number; y: number }>> = {
  '4-3-3': {
    GK: { x: 50, y: 90 },
    LB: { x: 20, y: 75 },
    CB1: { x: 40, y: 75 },
    CB2: { x: 60, y: 75 },
    RB: { x: 80, y: 75 },
    CDM: { x: 50, y: 55 },
    CM1: { x: 35, y: 45 },
    CM2: { x: 65, y: 45 },
    LW: { x: 25, y: 25 },
    ST: { x: 50, y: 15 },
    RW: { x: 75, y: 25 },
  },
  '4-2-3-1': {
    GK: { x: 50, y: 90 },
    LB: { x: 20, y: 75 },
    CB1: { x: 40, y: 75 },
    CB2: { x: 60, y: 75 },
    RB: { x: 80, y: 75 },
    CDM1: { x: 40, y: 55 },
    CDM2: { x: 60, y: 55 },
    LW: { x: 25, y: 35 },
    CAM: { x: 50, y: 35 },
    RW: { x: 75, y: 35 },
    ST: { x: 50, y: 15 },
  },
  '4-4-2': {
    GK: { x: 50, y: 90 },
    LB: { x: 20, y: 75 },
    CB1: { x: 40, y: 75 },
    CB2: { x: 60, y: 75 },
    RB: { x: 80, y: 75 },
    LM: { x: 20, y: 45 },
    CM1: { x: 40, y: 45 },
    CM2: { x: 60, y: 45 },
    RM: { x: 80, y: 45 },
    ST1: { x: 40, y: 15 },
    ST2: { x: 60, y: 15 },
  },
};

const CompactFootballPitch = ({ 
  players, 
  allPlayers = [],
  squadType, 
  formation = '4-3-3', 
  positionAssignments = [],
  multiPlayerSlots = [],
  onPositionClick,
  selectedPosition,
  onPlayerChange,
  onAddPlayerToPosition,
  onSetActivePlayer,
  priorityPositions = [],
  disableAutoFill = false
}: CompactFootballPitchProps) => {
  // Get current formation positions
  const currentFormation = COMPACT_FORMATION_CONFIGS[formation] || COMPACT_FORMATION_CONFIGS['4-3-3'];
  const assignedPlayers = new Set<string>();
  
  // Get database recommendations
  const { data: dbRecommendations } = useSquadRecommendations();
  
  // Get squad average ratings from database
  const { data: squadRatings } = useSquadAverageRatings("Premier League");
  const chelseaRatings = squadRatings?.find(squad => squad.Squad?.toLowerCase().includes('chelsea'));
  
  // Map position codes to position groups for recommendations
  const getPositionGroup = (position: string): string => {
    if (position.startsWith('GK')) return 'Goalkeeper';
    if (position.startsWith('CB')) return 'Centre Back';
    if (position.startsWith('LB') || position.startsWith('RB')) return 'Full Back';
    if (position.includes('CM') || position.includes('CDM') || position.includes('CAM')) return 'Central Midfield';
    if (position.includes('W') || position.includes('LM') || position.includes('RM')) return 'Winger';
    if (position.includes('ST')) return 'Striker';
    return '';
  };
  
  // Check if position has a database recommendation
  const hasRecommendation = (position: string): boolean => {
    const group = getPositionGroup(position);
    return dbRecommendations?.some(rec => {
      const recPosition = rec.Position.toLowerCase();
      const posGroup = group.toLowerCase();
      
      // Handle specific position names (e.g., "Right back" should match RB positions)
      if (recPosition === 'right back' && position.startsWith('RB')) return true;
      if (recPosition === 'left back' && position.startsWith('LB')) return true;
      
      // General matching
      return recPosition === posGroup;
    }) || false;
  };
  
  // Helper to check if player has warnings
  const getPlayerWarnings = (player: Player | null): { hasWarning: boolean; isContract: boolean; isInjury: boolean } => {
    if (!player) return { hasWarning: false, isContract: false, isInjury: false };
    
    let isContract = false;
    let isInjury = false;
    
    // Check contract expiry
    if (player.contractExpiry) {
      const expiryDate = new Date(player.contractExpiry);
      const oneYearFromNow = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
      isContract = expiryDate < oneYearFromNow;
    }
    
    // Check injury (would come from real data, placeholder for now)
    // isInjury = player.injuryStatus === 'injured';
    
    return { hasWarning: isContract || isInjury, isContract, isInjury };
  };

  // Helper function to get eligible players for a position
  const getEligiblePlayers = (position: string): Player[] => {
    const allowedPositions = getPositionMapping(position);
    return players.filter(player => 
      player.positions.some(pos => allowedPositions.includes(pos))
    ).sort((a, b) => {
      const ratingA = a.transferroomRating || a.xtvScore || 0;
      const ratingB = b.transferroomRating || b.xtvScore || 0;
      return ratingB - ratingA;
    });
  };

  const getPositionMapping = (pos: string) => {
    switch (pos) {
      case 'GK': 
        return ['GK'];
      case 'LB': 
        return ['LB', 'LWB'];
      case 'CB1': 
      case 'CB2': 
      case 'CB3': 
        return ['CB'];
      case 'RB': 
        return ['RB', 'RWB'];
      case 'CDM': 
      case 'CDM1': 
      case 'CDM2': 
        return ['CM', 'CDM'];
      case 'CM1': 
      case 'CM2': 
      case 'CM3':
        return ['CM', 'CAM'];
      case 'CAM':
        return ['CAM', 'CM'];
      case 'LM': 
        return ['LM', 'W', 'LW'];
      case 'RM': 
        return ['RM', 'W', 'RW'];
      case 'LW': 
        return ['W', 'LW', 'LM'];
      case 'ST': 
      case 'ST1': 
      case 'ST2': 
        return ['F', 'FW', 'ST', 'CF'];
      case 'RW': 
        return ['W', 'RW', 'RM'];
      default: 
        return [];
    }
  };

  const getAssignedPlayer = (position: string): Player | null => {
    const assignment = positionAssignments.find(a => a.position === position);
    if (!assignment) return null;
    
    // First try to find in allPlayers (includes both Chelsea squad and recommendations)
    const playerFromAll = allPlayers.find(p => p.id === assignment.player_id);
    if (playerFromAll) return playerFromAll;
    
    // Fallback to squad players only
    return players.find(p => p.id === assignment.player_id) || null;
  };

  const getPlayerForPosition = (position: string): Player | null => {
    // Check if there's a specific assignment for this position
    const assignedPlayer = getAssignedPlayer(position);
    if (assignedPlayer) {
      return assignedPlayer;
    }

    // When disableAutoFill is enabled, don't auto-pick players for empty positions
    if (disableAutoFill) {
      return null;
    }

    // Fallback to automatic assignment logic
    const allowedPositions = getPositionMapping(position);
    
    let positionPlayers = players.filter(player => 
      player.positions.some(pos => allowedPositions.includes(pos)) && 
      !assignedPlayers.has(player.id)
    );

    // For shadow squad, exclude players who are assigned to first-team positions
    if (squadType === 'shadow') {
      const firstTeamPlayerIds = new Set(
        positionAssignments.map(assignment => assignment.player_id)
      );
      positionPlayers = positionPlayers.filter(player => 
        !firstTeamPlayerIds.has(player.id)
      );
    }
    
    // Sort by rating and get the best player
    const sortedPlayers = positionPlayers.sort((a, b) => {
      const ratingA = a.transferroomRating || a.xtvScore || 0;
      const ratingB = b.transferroomRating || b.xtvScore || 0;
      return ratingB - ratingA;
    });
    
    const selectedPlayer = sortedPlayers[0];
    if (selectedPlayer) {
      assignedPlayers.add(selectedPlayer.id);
      return selectedPlayer;
    }
    
    return null;
  };

  // Calculate depth for each position group
  const getPositionDepth = (position: string): { count: number; color: string; avgRating: number; warningCount: number } => {
    const allowedPositions = getPositionMapping(position);
    const availablePlayers = players.filter(player => 
      player.positions.some(pos => allowedPositions.includes(pos))
    );
    
    const count = availablePlayers.length;
    
    // Get average rating from database based on position
    let avgRating = 0;
    if (chelseaRatings) {
      if (position.startsWith('GK')) {
        avgRating = chelseaRatings.KeeperRating || 0;
      } else if (position.startsWith('CB')) {
        avgRating = chelseaRatings.CentreBackRating || 0;
      } else if (position.startsWith('LB')) {
        avgRating = chelseaRatings.LeftBackRating || 0;
      } else if (position.startsWith('RB')) {
        avgRating = chelseaRatings.RightBackRating || 0;
      } else if (position.includes('CM') || position.includes('CDM') || position.includes('CAM')) {
        avgRating = chelseaRatings.CentreMidfielderRating || 0;
      } else if (position.includes('W') || position.includes('LM') || position.includes('RM')) {
        avgRating = chelseaRatings.WingerRating || 0;
      } else if (position.includes('ST')) {
        avgRating = chelseaRatings.ForwardRating || 0;
      }
    }
    
    // Count players with warnings (contract expiry or aging)
    const warningCount = availablePlayers.filter(player => {
      // Check contract expiry
      if (player.contractExpiry) {
        const expiryDate = new Date(player.contractExpiry);
        const oneYearFromNow = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
        if (expiryDate < oneYearFromNow) return true;
      }
      // Check age
      if (player.age > 32) return true;
      return false;
    }).length;
    
    // Traffic light system: Red (0-1), Amber (2), Green (3+)
    let color = 'text-red-500';
    if (count >= 3) {
      color = 'text-green-500';
    } else if (count === 2) {
      color = 'text-amber-500';
    }
    
    return { count, color, avgRating, warningCount };
  };

  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden sm:overflow-visible z-0 isolate">
      {/* Football pitch background */}
      <div 
        className="absolute inset-0 bg-cover bg-center pointer-events-none z-0"
        style={{ backgroundImage: `url(${pitchBackground})` }}
      />

      {/* Player positions */}
      {Object.entries(currentFormation).map(([position, coords]) => {
        const player = getPlayerForPosition(position);
        const isSelected = selectedPosition === position;
        const eligiblePlayers = getEligiblePlayers(position);
        const depth = getPositionDepth(position);
        const isPriority = priorityPositions.some(p => position.startsWith(p));
        const hasDbRecommendation = hasRecommendation(position);
        const warnings = getPlayerWarnings(player);
        
        // Get multi-player slot data for this position
        const multiSlot = multiPlayerSlots.find(slot => slot.position === position);
        const assignedPlayerCount = multiSlot 
          ? 1 + multiSlot.alternatePlayerIds.length 
          : (player ? 1 : 0);
        
        // Get all assigned players for this position (for dropdown)
        const assignedPlayersForPosition: Player[] = multiSlot 
          ? [multiSlot.activePlayerId, ...multiSlot.alternatePlayerIds]
              .map(id => [...players, ...allPlayers].find(p => p.id === id))
              .filter((p): p is Player => p !== undefined)
          : player ? [player] : [];
        
        return (
          <PositionSlot 
            key={position}
            position={position}
            coords={coords}
            player={player}
            isSelected={isSelected}
            eligiblePlayers={eligiblePlayers}
            assignedPlayers={assignedPlayersForPosition}
            assignedPlayerCount={assignedPlayerCount}
            onPositionClick={onPositionClick}
            onPlayerChange={onPlayerChange}
            onSetActivePlayer={onSetActivePlayer}
            depth={depth}
            isPriority={isPriority}
            hasRecommendation={hasDbRecommendation}
            warnings={warnings}
          />
        );
      })}
    </div>
  );
};

// Separate component for each position slot
const PositionSlot = ({ 
  position, 
  coords, 
  player, 
  isSelected, 
  eligiblePlayers,
  assignedPlayers,
  assignedPlayerCount,
  onPositionClick,
  onPlayerChange,
  onSetActivePlayer,
  depth,
  isPriority,
  hasRecommendation,
  warnings
}: {
  position: string;
  coords: { x: number; y: number };
  player: Player | null;
  isSelected: boolean;
  eligiblePlayers: Player[];
  assignedPlayers: Player[];
  assignedPlayerCount: number;
  onPositionClick?: (position: string) => void;
  onPlayerChange?: (position: string, playerId: string) => void;
  onSetActivePlayer?: (position: string, playerId: string) => void;
  depth: { count: number; color: string; avgRating: number; warningCount: number };
  isPriority: boolean;
  hasRecommendation: boolean;
  warnings: { hasWarning: boolean; isContract: boolean; isInjury: boolean };
}) => {
  const hasMultiplePlayers = assignedPlayerCount > 1;

  return (
    <div
      className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all cursor-pointer hover:scale-105 z-10 ${
        isPriority ? 'animate-pulse' : ''
      } ${isSelected ? 'scale-110 z-20' : ''}`}
      style={{
        left: `${coords.x}%`,
        top: `${coords.y}%`,
      }}
      onClick={() => onPositionClick?.(position)}
    >
      <div className="flex flex-col items-center relative">
        {/* Large subtle position label in background */}
        <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 -translate-y-full z-0">
          <span className={`text-2xl sm:text-3xl md:text-4xl font-bold ${hasRecommendation ? 'text-primary/30' : 'text-primary/15'}`}>
            {position}
          </span>
        </div>

        {/* Priority indicator ring */}
        {isPriority && (
          <div className="absolute -inset-1 sm:-inset-2 rounded-full border-2 border-amber-500 bg-amber-500/10 animate-pulse" />
        )}
        
        {/* Selection ring */}
        {isSelected && (
          <div className="absolute -inset-2 rounded-full border-4 border-primary ring-4 ring-primary/20 animate-pulse" />
        )}
        
        {/* Condensed info bar - count, rating, warnings */}
        <div className={`flex items-center gap-1 mb-1 px-2 py-0.5 rounded-full shadow-sm border relative z-10 ${
          isPriority ? 'bg-amber-500 border-amber-600' : depth.warningCount > 0 ? 'bg-orange-50 border-orange-300' : 'bg-white/90 border-border'
        }`}>
          <div className="flex items-center">
            <Hash className={`w-2.5 h-2.5 ${isPriority ? 'text-white' : 'text-muted-foreground'}`} />
            <span className={`text-xs font-medium ${isPriority ? 'text-white' : 'text-foreground'}`}>{depth.count}</span>
          </div>
          {depth.avgRating > 0 && (
            <>
              <div className={`w-px h-3 ${isPriority ? 'bg-white/30' : 'bg-border'}`} />
              <span className={`text-xs ${isPriority ? 'text-white/70' : 'text-muted-foreground'}`}>⌀</span>
              <span className={`text-xs font-medium ${isPriority ? 'text-white' : 'text-foreground'}`}>
                {Math.round(depth.avgRating)}
              </span>
            </>
          )}
          {depth.warningCount > 0 && (
            <>
              <div className={`w-px h-3 ${isPriority ? 'bg-white/30' : 'bg-border'}`} />
              <AlertTriangle className={`w-2.5 h-2.5 ${isPriority ? 'text-white' : 'text-orange-500'}`} />
              <span className={`text-xs font-medium ${isPriority ? 'text-white' : 'text-orange-500'}`}>{depth.warningCount}</span>
            </>
          )}
        </div>
        
        {/* Player avatar with multi-player dropdown */}
        {player ? (
          <div className="relative">
            {hasMultiplePlayers && onSetActivePlayer ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="relative cursor-pointer">
                    <Avatar 
                      className={`w-10 h-10 sm:w-12 sm:h-12 border-2 shadow-md cursor-pointer hover:shadow-lg transition-shadow ${
                        warnings.hasWarning ? 'border-orange-500' : 'border-white'
                      }`}
                    >
                      <AvatarImage 
                        src={player.image} 
                        alt={player.name}
                        className="rounded-full object-cover"
                      />
                      <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
                        {player.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    
                    {/* Multi-player badge count */}
                    <div className="absolute -top-1 -left-1 bg-primary text-primary-foreground text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold border border-white z-10">
                      {assignedPlayerCount}
                    </div>
                    
                    {/* Dropdown indicator */}
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-muted rounded-full p-0.5 border border-border">
                      <ChevronDown className="w-2.5 h-2.5 text-muted-foreground" />
                    </div>
                    
                    {/* Rating */}
                    <div className="absolute -bottom-1 -right-1 bg-secondary text-secondary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium border border-white">
                      {Math.round(player.transferroomRating || player.xtvScore || 0)}
                    </div>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  className="w-56 bg-background border shadow-lg z-[100]" 
                  onClick={(e) => e.stopPropagation()}
                >
                  <DropdownMenuLabel className="flex items-center gap-2 text-xs">
                    <Users className="h-3 w-3" />
                    {position} Players ({assignedPlayerCount})
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {assignedPlayers.map((p, idx) => (
                    <DropdownMenuItem
                      key={p.id}
                      className={`flex items-center gap-2 cursor-pointer ${
                        p.id === player.id ? 'bg-primary/10' : ''
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSetActivePlayer(position, p.id);
                      }}
                    >
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={p.image} alt={p.name} />
                        <AvatarFallback className="bg-secondary text-secondary-foreground text-[10px]">
                          {p.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{p.name}</div>
                        <div className="text-xs text-muted-foreground">
                          Rating: {Math.round(p.transferroomRating || p.xtvScore || 0)}
                        </div>
                      </div>
                      {p.id === player.id && (
                        <Badge variant="default" className="text-[10px] px-1 py-0">Active</Badge>
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Avatar 
                  className={`w-10 h-10 sm:w-12 sm:h-12 border-2 shadow-md cursor-pointer hover:shadow-lg transition-shadow ${
                    warnings.hasWarning ? 'border-orange-500' : 'border-white'
                  }`}
                >
                  <AvatarImage 
                    src={player.image} 
                    alt={player.name}
                    className="rounded-full object-cover"
                  />
                  <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
                    {player.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                
                {/* Warning icon for injuries or contract expiry */}
                {warnings.hasWarning && (
                  <div className="absolute -top-1 -right-1 bg-orange-500 rounded-full p-0.5">
                    {warnings.isContract ? (
                      <Clock className="w-2.5 h-2.5 text-white" />
                    ) : (
                      <AlertTriangle className="w-2.5 h-2.5 text-white" />
                    )}
                  </div>
                )}
                
                {/* Rating */}
                <div className="absolute -bottom-1 -right-1 bg-secondary text-secondary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium border border-white">
                  {Math.round(player.transferroomRating || player.xtvScore || 0)}
                </div>
              </>
            )}
          </div>
        ) : (
          <div 
            className="w-12 h-12 rounded-full border-2 border-dashed border-muted-foreground/40 bg-white/50 flex items-center justify-center cursor-pointer hover:border-muted-foreground/60 transition-colors"
          >
            <Plus className="h-4 w-4 text-muted-foreground" />
          </div>
        )}

        {/* Name badge */}
        <Badge variant="secondary" className="text-xs mt-1 px-1 py-0">
          {player ? player.name.split(' ').pop() : position}
        </Badge>
      </div>
    </div>
  );
};

export default CompactFootballPitch;
