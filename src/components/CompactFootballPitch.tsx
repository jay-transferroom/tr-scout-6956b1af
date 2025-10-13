import { useState } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Player } from "@/types/player";
import { Plus, Hash, AlertTriangle, Clock } from "lucide-react";
import pitchBackground from "@/assets/pitch.svg";
import { useSquadRecommendations } from "@/hooks/useSquadRecommendations";

interface CompactFootballPitchProps {
  players: Player[];
  squadType: string;
  formation?: string;
  positionAssignments?: Array<{
    position: string;
    player_id: string;
  }>;
  onPositionClick?: (position: string) => void;
  selectedPosition?: string | null;
  onPlayerChange?: (position: string, playerId: string) => void;
  priorityPositions?: string[];
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
  squadType, 
  formation = '4-3-3', 
  positionAssignments = [],
  onPositionClick,
  selectedPosition,
  onPlayerChange,
  priorityPositions = []
}: CompactFootballPitchProps) => {
  // Get current formation positions
  const currentFormation = COMPACT_FORMATION_CONFIGS[formation] || COMPACT_FORMATION_CONFIGS['4-3-3'];
  const assignedPlayers = new Set<string>();
  
  // Get database recommendations
  const { data: dbRecommendations } = useSquadRecommendations();
  
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
    
    return players.find(p => p.id === assignment.player_id) || null;
  };

  const getPlayerForPosition = (position: string): Player | null => {
    // Check if there's a specific assignment for this position
    const assignedPlayer = getAssignedPlayer(position);
    if (assignedPlayer) {
      return assignedPlayer;
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
    
    // Calculate average rating
    const totalRating = availablePlayers.reduce((sum, player) => {
      return sum + (player.transferroomRating || player.xtvScore || 0);
    }, 0);
    const avgRating = count > 0 ? totalRating / count : 0;
    
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
    <div className="relative w-full h-full rounded-lg overflow-hidden z-0 isolate">
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
        
        return (
          <PositionSlot 
            key={position}
            position={position}
            coords={coords}
            player={player}
            isSelected={isSelected}
            eligiblePlayers={eligiblePlayers}
            onPositionClick={onPositionClick}
            onPlayerChange={onPlayerChange}
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

// Separate component for each position slot to handle dropdowns
const PositionSlot = ({ 
  position, 
  coords, 
  player, 
  isSelected, 
  eligiblePlayers,
  onPositionClick,
  onPlayerChange,
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
  onPositionClick?: (position: string) => void;
  onPlayerChange?: (position: string, playerId: string) => void;
  depth: { count: number; color: string; avgRating: number; warningCount: number };
  isPriority: boolean;
  hasRecommendation: boolean;
  warnings: { hasWarning: boolean; isContract: boolean; isInjury: boolean };
}) => {
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <div
      className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all cursor-pointer hover:scale-105 z-10 ${
        isPriority ? 'animate-pulse' : ''
      }`}
      style={{
        left: `${coords.x}%`,
        top: `${coords.y}%`,
      }}
      onClick={() => onPositionClick?.(position)}
    >
      <div className="flex flex-col items-center relative">
        {/* Large subtle position label in background */}
        <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 -translate-y-full z-0">
          <span className={`text-4xl font-bold ${hasRecommendation ? 'text-purple-600/40' : 'text-green-800/20'}`}>
            {position}
          </span>
        </div>

        {/* Priority indicator ring */}
        {isPriority && (
          <div className="absolute -inset-2 rounded-full border-2 border-amber-500 bg-amber-500/10 animate-pulse" />
        )}
        
        {/* Condensed info bar - count, rating, warnings */}
        <div className={`flex items-center gap-1 mb-1 px-2 py-0.5 rounded-full shadow-md border-2 relative z-10 ${
          isPriority ? 'bg-amber-500 border-amber-600' : depth.warningCount > 0 ? 'bg-orange-100 border-orange-400' : 'bg-white border-gray-300'
        }`}>
          <div className="flex items-center">
            <Hash className={`w-2.5 h-2.5 ${isPriority ? 'text-white' : 'text-gray-600'}`} />
            <span className={`text-xs font-bold ${isPriority ? 'text-white' : 'text-gray-700'}`}>{depth.count}</span>
          </div>
          {depth.avgRating > 0 && (
            <>
              <div className={`w-px h-3 ${isPriority ? 'bg-white/30' : 'bg-gray-300'}`} />
              <span className={`text-xs font-bold ${isPriority ? 'text-white' : 'text-gray-700'}`}>
                {Math.round(depth.avgRating)}
              </span>
            </>
          )}
          {depth.warningCount > 0 && (
            <>
              <div className={`w-px h-3 ${isPriority ? 'bg-white/30' : 'bg-gray-300'}`} />
              <AlertTriangle className={`w-2.5 h-2.5 ${isPriority ? 'text-white' : 'text-orange-600'}`} />
              <span className={`text-xs font-bold ${isPriority ? 'text-white' : 'text-orange-600'}`}>{depth.warningCount}</span>
            </>
          )}
        </div>
        
        {/* Player avatar */}
        {player ? (
          <div className="relative" onMouseEnter={() => setShowDropdown(true)} onMouseLeave={() => setShowDropdown(false)}>
            <Avatar 
              className={`w-12 h-12 border-2 shadow-md cursor-pointer hover:shadow-lg transition-shadow ${
                warnings.hasWarning ? 'border-orange-500' : 'border-white'
              }`}
              onClick={() => onPositionClick?.(position)}
            >
              <AvatarImage 
                src={player.image} 
                alt={player.name}
                className="rounded-full object-cover"
              />
              <AvatarFallback className="bg-blue-600 text-white text-xs">
                {player.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            
            {/* Warning icon for injuries or contract expiry */}
            {warnings.hasWarning && (
              <div className="absolute -top-2 -left-2 bg-orange-500 text-white rounded-full w-5 h-5 flex items-center justify-center border border-white z-10">
                {warnings.isContract ? (
                  <Clock className="w-3 h-3" />
                ) : (
                  <AlertTriangle className="w-3 h-3" />
                )}
              </div>
            )}
            
            {/* Rating */}
            <div className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold border border-white">
              {Math.round(player.transferroomRating || player.xtvScore || 0)}
            </div>

            {/* Player selection dropdown (hover) */}
            {showDropdown && onPlayerChange && eligiblePlayers.length > 1 && (
              <div className="absolute top-12 left-1/2 transform -translate-x-1/2 z-[80]">
                <div className="bg-white border border-gray-300 rounded-lg shadow-xl p-2 min-w-40 max-h-48 overflow-y-auto">
                  <div className="text-xs font-semibold text-gray-600 mb-2 px-2">
                    Select Player
                  </div>
                  {eligiblePlayers.map((eligiblePlayer) => (
                    <div
                      key={eligiblePlayer.id}
                      className={`flex items-center gap-2 p-1 rounded cursor-pointer transition-colors ${
                        eligiblePlayer.id === player.id 
                          ? 'bg-blue-50 border border-blue-200' 
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onPlayerChange(position, eligiblePlayer.id);
                        setShowDropdown(false);
                      }}
                    >
                      <Avatar className="w-6 h-6">
                        <AvatarImage 
                          src={eligiblePlayer.image} 
                          alt={eligiblePlayer.name}
                        />
                        <AvatarFallback className="bg-blue-600 text-white text-xs">
                          {eligiblePlayer.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium truncate">{eligiblePlayer.name}</div>
                        <div className="text-xs text-gray-500">
                          {Math.round(eligiblePlayer.transferroomRating || eligiblePlayer.xtvScore || 0)}
                        </div>
                      </div>
                      {eligiblePlayer.id === player.id && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div 
            className="w-12 h-12 rounded-full border-2 border-dashed border-gray-400 bg-white/50 flex items-center justify-center cursor-pointer hover:border-gray-500 transition-colors"
            onClick={() => onPositionClick?.(position)}
            onMouseEnter={() => setShowDropdown(true)}
            onMouseLeave={() => setShowDropdown(false)}
          >
            <Plus className="h-4 w-4 text-gray-400" />

            {/* Empty position dropdown (hover) */}
            {showDropdown && onPlayerChange && eligiblePlayers.length > 0 && (
              <div className="absolute top-12 left-1/2 transform -translate-x-1/2 z-[80]">
                <div className="bg-white border border-gray-300 rounded-lg shadow-xl p-2 min-w-40 max-h-48 overflow-y-auto">
                  <div className="text-xs font-semibold text-gray-600 mb-2 px-2">
                    Select Player
                  </div>
                  {eligiblePlayers.map((eligiblePlayer) => (
                    <div
                      key={eligiblePlayer.id}
                      className="flex items-center gap-2 p-1 rounded cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        onPlayerChange(position, eligiblePlayer.id);
                        setShowDropdown(false);
                      }}
                    >
                      <Avatar className="w-6 h-6">
                        <AvatarImage 
                          src={eligiblePlayer.image} 
                          alt={eligiblePlayer.name}
                        />
                        <AvatarFallback className="bg-blue-600 text-white text-xs">
                          {eligiblePlayer.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium truncate">{eligiblePlayer.name}</div>
                        <div className="text-xs text-gray-500">
                          {Math.round(eligiblePlayer.transferroomRating || eligiblePlayer.xtvScore || 0)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CompactFootballPitch;