import { useState } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Player } from "@/types/player";
import { Plus, Circle } from "lucide-react";

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
}

// Simplified formation configurations for compact view
const COMPACT_FORMATION_CONFIGS: Record<string, Record<string, { x: number; y: number }>> = {
  '4-3-3': {
    GK: { x: 50, y: 10 },
    LB: { x: 80, y: 25 },
    CB1: { x: 40, y: 25 },
    CB2: { x: 60, y: 25 },
    RB: { x: 20, y: 25 },
    CDM: { x: 50, y: 45 },
    CM1: { x: 35, y: 55 },
    CM2: { x: 65, y: 55 },
    LW: { x: 75, y: 75 },
    ST: { x: 50, y: 85 },
    RW: { x: 25, y: 75 },
  },
  '4-2-3-1': {
    GK: { x: 50, y: 10 },
    LB: { x: 80, y: 25 },
    CB1: { x: 40, y: 25 },
    CB2: { x: 60, y: 25 },
    RB: { x: 20, y: 25 },
    CDM1: { x: 40, y: 45 },
    CDM2: { x: 60, y: 45 },
    LW: { x: 75, y: 65 },
    CAM: { x: 50, y: 65 },
    RW: { x: 25, y: 65 },
    ST: { x: 50, y: 85 },
  },
  '4-4-2': {
    GK: { x: 50, y: 10 },
    LB: { x: 80, y: 25 },
    CB1: { x: 40, y: 25 },
    CB2: { x: 60, y: 25 },
    RB: { x: 20, y: 25 },
    LM: { x: 80, y: 55 },
    CM1: { x: 40, y: 55 },
    CM2: { x: 60, y: 55 },
    RM: { x: 20, y: 55 },
    ST1: { x: 40, y: 85 },
    ST2: { x: 60, y: 85 },
  },
};

const CompactFootballPitch = ({ 
  players, 
  squadType, 
  formation = '4-3-3', 
  positionAssignments = [],
  onPositionClick,
  selectedPosition,
  onPlayerChange
}: CompactFootballPitchProps) => {
  // Get current formation positions
  const currentFormation = COMPACT_FORMATION_CONFIGS[formation] || COMPACT_FORMATION_CONFIGS['4-3-3'];
  const assignedPlayers = new Set<string>();

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
  const getPositionDepth = (position: string): { count: number; color: string } => {
    const allowedPositions = getPositionMapping(position);
    const availablePlayers = players.filter(player => 
      player.positions.some(pos => allowedPositions.includes(pos))
    );
    
    const count = availablePlayers.length;
    
    // Traffic light system: Red (0-1), Amber (2), Green (3+)
    let color = 'text-red-500';
    if (count >= 3) {
      color = 'text-green-500';
    } else if (count === 2) {
      color = 'text-amber-500';
    }
    
    return { count, color };
  };

  return (
    <div className="relative w-full h-full bg-green-100 rounded-lg border border-green-200 overflow-hidden">
      {/* Football pitch background */}
      <div className="absolute inset-0 bg-gradient-to-b from-green-400/20 to-green-600/20">
        {/* Center circle */}
        <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 border-2 border-white/50 rounded-full"></div>
        {/* Goal areas */}
        <div className="absolute left-1/2 top-0 transform -translate-x-1/2 w-12 h-4 border-2 border-white/50 border-t-0"></div>
        <div className="absolute left-1/2 bottom-0 transform -translate-x-1/2 w-12 h-4 border-2 border-white/50 border-b-0"></div>
      </div>

      {/* Player positions */}
      {Object.entries(currentFormation).map(([position, coords]) => {
        const player = getPlayerForPosition(position);
        const isSelected = selectedPosition === position;
        const eligiblePlayers = getEligiblePlayers(position);
        const depth = getPositionDepth(position);
        
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
  depth
}: {
  position: string;
  coords: { x: number; y: number };
  player: Player | null;
  isSelected: boolean;
  eligiblePlayers: Player[];
  onPositionClick?: (position: string) => void;
  onPlayerChange?: (position: string, playerId: string) => void;
  depth: { count: number; color: string };
}) => {
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <div
      className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all cursor-pointer hover:scale-105 z-10"
      style={{
        left: `${coords.x}%`,
        top: `${coords.y}%`,
      }}
      onClick={() => onPositionClick?.(position)}
    >
      <div className="flex flex-col items-center">
        {/* Depth indicator */}
        <div className="flex items-center gap-0.5 mb-1">
          <Circle className={`w-2 h-2 ${depth.color} fill-current`} />
          <span className={`text-xs font-medium ${depth.color}`}>{depth.count}</span>
        </div>
        
        {/* Position badge */}
        <Badge 
          variant={isSelected ? "default" : "secondary"} 
          className="text-xs mb-1 bg-white/90"
        >
          {position}
        </Badge>
        
        {/* Player avatar */}
        {player ? (
          <div className="relative">
            <Avatar 
              className="w-12 h-12 border-2 border-white shadow-md cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => {
                if (onPlayerChange && eligiblePlayers.length > 1) {
                  setShowDropdown(!showDropdown);
                } else {
                  onPositionClick?.(position);
                }
              }}
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
            
            {/* Rating */}
            <div className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold border border-white">
              {Math.round(player.transferroomRating || player.xtvScore || 0)}
            </div>

            {/* Player selection dropdown */}
            {showDropdown && onPlayerChange && eligiblePlayers.length > 1 && (
              <>
                <div 
                  className="fixed inset-0 z-[100]" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDropdown(false);
                  }}
                />
                <div className="absolute top-12 left-1/2 transform -translate-x-1/2 z-[101]">
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
              </>
            )}
          </div>
        ) : (
          <div 
            className="w-12 h-12 rounded-full border-2 border-dashed border-gray-400 bg-white/50 flex items-center justify-center cursor-pointer hover:border-gray-500 transition-colors"
            onClick={() => {
              if (onPlayerChange && eligiblePlayers.length > 0) {
                setShowDropdown(!showDropdown);
              } else {
                onPositionClick?.(position);
              }
            }}
          >
            <Plus className="h-4 w-4 text-gray-400" />

            {/* Empty position dropdown */}
            {showDropdown && onPlayerChange && eligiblePlayers.length > 0 && (
              <>
                <div 
                  className="fixed inset-0 z-[100]" 
                  onClick={() => setShowDropdown(false)}
                />
                <div className="absolute top-12 left-1/2 transform -translate-x-1/2 z-[101]">
                  <div className="bg-white border border-gray-300 rounded-lg shadow-xl p-2 min-w-40 max-h-48 overflow-y-auto">
                    <div className="text-xs font-semibold text-gray-600 mb-2 px-2">
                      Select Player
                    </div>
                    {eligiblePlayers.map((eligiblePlayer) => (
                      <div
                        key={eligiblePlayer.id}
                        className="flex items-center gap-2 p-1 rounded cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => {
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
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CompactFootballPitch;