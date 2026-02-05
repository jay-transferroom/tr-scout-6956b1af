import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Player } from "@/types/player";
import { MoreHorizontal, Plus, AlertTriangle, Clock, ChevronDown } from "lucide-react";

interface EnhancedFootballPitchProps {
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

// Formation configurations
const FORMATION_CONFIGS: Record<string, Record<string, { x: number; y: number; label: string }>> = {
  '4-3-3': {
    GK: { x: 50, y: 8, label: 'Goalkeeper' },
    LB: { x: 85, y: 22, label: 'Full Back' },
    CB1: { x: 35, y: 22, label: 'Centre Back' },
    CB2: { x: 65, y: 22, label: 'Centre Back' },
    RB: { x: 15, y: 22, label: 'Full Back' },
    CDM: { x: 50, y: 40, label: 'Central Midfield' },
    CM1: { x: 30, y: 52, label: 'Central Midfield' },
    CM2: { x: 70, y: 52, label: 'Central Midfield' },
    LW: { x: 80, y: 72, label: 'Winger' },
    ST: { x: 50, y: 82, label: 'Striker' },
    RW: { x: 20, y: 72, label: 'Winger' },
  },
  '4-2-3-1': {
    GK: { x: 50, y: 8, label: 'Goalkeeper' },
    LB: { x: 85, y: 22, label: 'Full Back' },
    CB1: { x: 35, y: 22, label: 'Centre Back' },
    CB2: { x: 65, y: 22, label: 'Centre Back' },
    RB: { x: 15, y: 22, label: 'Full Back' },
    CDM1: { x: 35, y: 40, label: 'Defensive Midfield' },
    CDM2: { x: 65, y: 40, label: 'Defensive Midfield' },
    LW: { x: 80, y: 60, label: 'Winger' },
    CAM: { x: 50, y: 60, label: 'Attacking Midfield' },
    RW: { x: 20, y: 60, label: 'Winger' },
    ST: { x: 50, y: 82, label: 'Striker' },
  },
  '3-5-2': {
    GK: { x: 50, y: 8, label: 'Goalkeeper' },
    CB1: { x: 25, y: 22, label: 'Centre Back' },
    CB2: { x: 50, y: 22, label: 'Centre Back' },
    CB3: { x: 75, y: 22, label: 'Centre Back' },
    LWB: { x: 85, y: 45, label: 'Wing Back' },
    CM1: { x: 35, y: 45, label: 'Central Midfield' },
    CM2: { x: 50, y: 45, label: 'Central Midfield' },
    CM3: { x: 65, y: 45, label: 'Central Midfield' },
    RWB: { x: 15, y: 45, label: 'Wing Back' },
    ST1: { x: 40, y: 82, label: 'Striker' },
    ST2: { x: 60, y: 82, label: 'Striker' },
  },
  '4-4-2': {
    GK: { x: 50, y: 8, label: 'Goalkeeper' },
    LB: { x: 85, y: 22, label: 'Full Back' },
    CB1: { x: 35, y: 22, label: 'Centre Back' },
    CB2: { x: 65, y: 22, label: 'Centre Back' },
    RB: { x: 15, y: 22, label: 'Full Back' },
    LM: { x: 85, y: 52, label: 'Left Midfield' },
    CM1: { x: 35, y: 52, label: 'Central Midfield' },
    CM2: { x: 65, y: 52, label: 'Central Midfield' },
    RM: { x: 15, y: 52, label: 'Right Midfield' },
    ST1: { x: 40, y: 82, label: 'Striker' },
    ST2: { x: 60, y: 82, label: 'Striker' },
  },
};

const EnhancedFootballPitch = ({ players, squadType, formation = '4-3-3', positionAssignments = [], onPositionClick, selectedPosition, onPlayerChange }: EnhancedFootballPitchProps) => {
  // Get current formation positions
  const currentFormation = FORMATION_CONFIGS[formation] || FORMATION_CONFIGS['4-3-3'];
  
  // Track assigned players to prevent duplicates across positions
  const assignedPlayers = new Set<string>();

  // Get all currently displayed players across all positions
  const getAllCurrentlyAssignedPlayers = () => {
    const assignedPlayerIds = new Set<string>();
    
    // Get players for each position in the current formation
    Object.keys(currentFormation).forEach(pos => {
      const positionPlayers = getPlayersForPosition(pos);
      if (positionPlayers.length > 0) {
        assignedPlayerIds.add(positionPlayers[0].id);
      }
    });
    
    return assignedPlayerIds;
  };

  // Get all eligible players for a position (not just assigned ones), excluding already assigned players
  const getAllPlayersForPosition = (position: string) => {
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
        case 'LWB': 
          return ['LWB', 'LB'];
        case 'RWB': 
          return ['RWB', 'RB'];
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

    const allowedPositions = getPositionMapping(position);
    
    // Get all currently assigned player IDs except for the current position
    const assignedPlayerIds = getAllCurrentlyAssignedPlayers();
    const currentPositionPlayer = getPlayersForPosition(position)[0];
    
    // Remove the current position's player from the assigned set so they can still appear in their own dropdown
    if (currentPositionPlayer) {
      assignedPlayerIds.delete(currentPositionPlayer.id);
    }

    // For shadow squad, also exclude first-team players
    if (squadType === 'shadow') {
      const firstTeamPlayerIds = new Set(
        positionAssignments.map(assignment => assignment.player_id)
      );
      firstTeamPlayerIds.forEach(id => assignedPlayerIds.add(id));
    }
    
    // Return all players that can play this position and aren't assigned elsewhere
    return players.filter(player => 
      player.positions.some(pos => allowedPositions.includes(pos)) &&
      !assignedPlayerIds.has(player.id)
    ).sort((a, b) => {
      const ratingA = a.transferroomRating || a.xtvScore || 0;
      const ratingB = b.transferroomRating || b.xtvScore || 0;
      return ratingB - ratingA;
    });
  };
    // Map formation positions to player position names
    const getPositionMapping = (pos: string) => {
      switch (pos) {
        case 'GK': 
          return ['GK'];
        case 'LB': 
          return ['LB', 'LWB'];
        case 'CB1': 
        case 'CB2': 
          return ['CB'];
        case 'RB': 
          return ['RB', 'RWB'];
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
        case 'LWB': 
          return ['LWB', 'LB'];
        case 'RWB': 
          return ['RWB', 'RB'];
        case 'CB3': 
          return ['CB'];
        case 'ST1': 
        case 'ST2': 
          return ['F', 'FW', 'ST', 'CF'];
        case 'LW': 
          return ['W', 'LW', 'LM'];
        case 'ST': 
          return ['F', 'FW', 'ST', 'CF'];
        case 'RW': 
          return ['W', 'RW', 'RM'];
        default: 
          return [];
      }
    };

  // Get assigned player for a position
  const getAssignedPlayer = (position: string): Player | null => {
    const assignment = positionAssignments.find(a => a.position === position);
    if (!assignment) return null;
    
    return players.find(p => p.id === assignment.player_id) || null;
  };

  const getPlayersForPosition = (position: string) => {
    // Check if there's a specific assignment for this position
    const assignedPlayer = getAssignedPlayer(position);
    if (assignedPlayer) {
      return [assignedPlayer];
    }

    // Fallback to automatic assignment logic for positions without specific assignments
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
        case 'LWB': 
          return ['LWB', 'LB'];
        case 'RWB': 
          return ['RWB', 'RB'];
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

    const allowedPositions = getPositionMapping(position);
    
    // Filter players who have this position in their positions array and aren't already assigned
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
    
    // Sort by rating
    const sortedPlayers = positionPlayers.sort((a, b) => {
      const ratingA = a.transferroomRating || a.xtvScore || 0;
      const ratingB = b.transferroomRating || b.xtvScore || 0;
      return ratingB - ratingA;
    });
    
    // For first-team squad, only show the leading player per position
    if (squadType === 'first-team') {
      const selectedPlayer = sortedPlayers.slice(0, 1);
      // Mark this player as assigned
      if (selectedPlayer.length > 0) {
        assignedPlayers.add(selectedPlayer[0].id);
      }
      return selectedPlayer;
    }
    
    return sortedPlayers;
  };

  const handlePositionClick = (position: string, label: string) => {
    if (onPositionClick) {
      onPositionClick(label);
    }
  };

  // Helper to check if a player is external (non-Chelsea)
  const isExternalPlayer = (player: Player): boolean => {
    return !(player.club === 'Chelsea FC' || (player.club?.includes('Chelsea') ?? false));
  };

  const getContractRiskLevel = (player: Player) => {
    if (!player.contractExpiry) return 'none';
    const expiryDate = new Date(player.contractExpiry);
    const oneYearFromNow = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    const sixMonthsFromNow = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000);
    
    if (expiryDate < sixMonthsFromNow) return 'high';
    if (expiryDate < oneYearFromNow) return 'medium';
    return 'low';
  };

  const renderPlayerTooltipContent = (positionPlayers: Player[]) => {
    if (positionPlayers.length === 0) {
      return (
        <div className="p-2">
          <p className="text-sm text-red-500 font-medium">No players available</p>
        </div>
      );
    }

    return (
      <div className="p-2 max-w-sm max-h-96 overflow-y-auto">
        <div className="space-y-2">
          <div className="text-xs font-semibold text-gray-700 mb-2">
            {positionPlayers.length} player{positionPlayers.length > 1 ? 's' : ''} available
          </div>
          {positionPlayers.map((player, index) => {
            const contractRisk = getContractRiskLevel(player);
            const isPrimary = index === 0;
            const yearsLeft = player.contractExpiry ? Math.max(0, Math.floor((new Date(player.contractExpiry).getTime() - Date.now()) / (365 * 24 * 60 * 60 * 1000))) : null;

            return (
              <div key={player.id} className={`flex items-center gap-2 text-sm p-2 rounded ${isPrimary ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'}`}>
                <Avatar className="w-6 h-6">
                  <AvatarImage 
                    src={player.image} 
                    alt={player.name}
                  />
                  <AvatarFallback className="bg-blue-600 text-white text-xs">
                    {player.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate flex items-center gap-1">
                    {player.name}
                    {isPrimary && <Badge variant="default" className="text-xs px-1 py-0">1st</Badge>}
                  </div>
                  <div className="text-xs text-gray-500">
                    Age {player.age} • Rating: {player.transferroomRating || player.xtvScore || 'N/A'}
                    {yearsLeft !== null && ` • +${yearsLeft}`}
                  </div>
                  <div className="flex gap-1 mt-1">
                    {contractRisk === 'high' && (
                      <div className="w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                        <Clock className="h-1.5 w-1.5 text-white" />
                      </div>
                    )}
                    {contractRisk === 'medium' && (
                      <div className="w-3 h-3 bg-amber-500 rounded-full flex items-center justify-center">
                        <Clock className="h-1.5 w-1.5 text-white" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderPositionCard = (position: string, coords: { x: number; y: number; label: string }) => {
    const positionPlayers = getPlayersForPosition(position);
    const allEligiblePlayers = getAllPlayersForPosition(position);
    const isSelected = selectedPosition === coords.label;
    const currentPlayer = positionPlayers[0]; // The assigned player
    const [showDropdown, setShowDropdown] = useState(false);
    
    return (
      <div
        key={position}
        className={`absolute transform -translate-x-1/2 transition-all z-10 ${
          isSelected ? 'scale-110' : 'hover:scale-105'
        }`}
        style={{
          left: `${coords.x}%`,
          top: `${coords.y}%`,
          transform: `translate(-50%, -50%)`,
        }}
      >
        {/* Position label */}
        <div className="mb-2 text-center">
          <Badge 
            variant={isSelected ? "default" : "secondary"} 
            className={`text-xs px-2 py-1 font-semibold ${
              isSelected ? 'bg-yellow-500 text-yellow-900' : 'bg-white/90 text-gray-700'
            }`}
          >
            {position}
          </Badge>
        </div>

        {/* Player Circle */}
        <div className="flex flex-col items-center min-w-24">
          {currentPlayer ? (
            <div className="relative">
              {/* Main Player Circle */}
              <div 
                className={`w-16 h-16 rounded-full border-4 transition-all cursor-pointer ${
                  isSelected 
                    ? 'border-yellow-500 shadow-lg shadow-yellow-500/50' 
                    : isExternalPlayer(currentPlayer)
                      ? 'border-amber-400 hover:border-amber-500 shadow-md shadow-amber-200/50'
                      : 'border-blue-500 hover:border-blue-600 shadow-md'
                } bg-white hover:shadow-lg animate-scale-in`}
                onClick={() => setShowDropdown(!showDropdown)}
              >
                <Avatar className="w-full h-full flex items-center justify-center">
                  <AvatarImage
                    src={currentPlayer.image} 
                    alt={currentPlayer.name}
                    className="rounded-full object-center object-cover"
                  />
                  <AvatarFallback className="bg-blue-600 text-white text-sm font-bold rounded-full">
                    {currentPlayer.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                
                {/* Rating overlay */}
                <div className="absolute -right-2 bg-blue-600 text-white text-xs rounded-full w-7 h-7 flex items-center justify-center font-bold z-20 border-2 border-white shadow-md" style={{ bottom: '2.2rem' }}>
                  {Math.round(currentPlayer.transferroomRating || currentPlayer.xtvScore || 0)}
                </div>
                
                {/* Contract risk indicator */}
                {(() => {
                  const contractRisk = getContractRiskLevel(currentPlayer);
                  if (contractRisk === 'high') {
                    return <div className="absolute -top-2 -left-2 w-4 h-4 bg-red-500 rounded-full border-2 border-white z-20" title="Contract expires soon" />;
                  }
                  if (contractRisk === 'medium') {
                    return <div className="absolute -top-2 -left-2 w-4 h-4 bg-amber-500 rounded-full border-2 border-white z-20" title="Contract expires within a year" />;
                  }
                  return null;
                })()}
              </div>
              
              {/* Player Name Below Circle */}
              <div className="mt-3 text-center z-10 relative">
                <div className="text-xs font-bold text-white drop-shadow-md bg-black/60 rounded px-2 py-1 max-w-20 truncate">
                  {currentPlayer.name} {/* Show full name */}
                </div>
              </div>

              {/* Hidden Dropdown - Appears on Circle Click */}
              {showDropdown && onPlayerChange && allEligiblePlayers.length > 1 && (
                <>
                  {/* Click outside to close dropdown */}
                  <div 
                    className="fixed inset-0 z-[100]" 
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDropdown(false);
                    }}
                  />
                  <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-[101] animate-fade-in">
                    <div className="bg-white border border-gray-300 rounded-lg shadow-2xl p-2 min-w-48 max-h-60 overflow-y-auto">
                      <div className="flex items-center justify-between mb-2 px-2">
                        <div className="text-xs font-semibold text-gray-600">
                          Select Player for {position}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowDropdown(false);
                          }}
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                          aria-label="Close dropdown"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      {allEligiblePlayers.map((player) => (
                        <div
                          key={player.id}
                          className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                            player.id === currentPlayer.id 
                              ? 'bg-blue-50 border border-blue-200' 
                              : 'hover:bg-gray-50'
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onPlayerChange(position, player.id);
                            setShowDropdown(false);
                          }}
                        >
                          <Avatar className="w-8 h-8">
                            <AvatarImage 
                              src={player.image || `https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&crop=face&fit=crop`} 
                              alt={player.name}
                            />
                            <AvatarFallback className="bg-blue-600 text-white text-xs">
                              {player.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="text-sm font-medium">{player.name}</div>
                            <div className="text-xs text-gray-500">
                              Rating: {player.transferroomRating?.toFixed(1) || player.xtvScore || 'N/A'}
                            </div>
                          </div>
                          {player.id === currentPlayer.id && (
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
            /* Empty Position Circle */
            <div className="relative">
              <div 
                className="w-16 h-16 rounded-full border-4 border-dashed border-gray-400 bg-white/50 hover:border-gray-500 transition-all cursor-pointer flex items-center justify-center animate-scale-in"
                onClick={() => setShowDropdown(!showDropdown)}
              >
                <Plus className="h-6 w-6 text-gray-400" />
              </div>
              
              <div className="mt-2 text-center">
                <div className="text-xs font-bold text-white drop-shadow-md bg-black/50 rounded px-2 py-1">
                  No Player
                </div>
              </div>

              {/* Hidden Dropdown for Empty Position */}
              {showDropdown && onPlayerChange && allEligiblePlayers.length > 0 && (
                <>
                  {/* Click outside to close dropdown */}
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowDropdown(false)}
                  />
                  <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in">
                    <div className="bg-white border border-gray-300 rounded-lg shadow-xl p-2 min-w-48 max-h-60 overflow-y-auto">
                      <div className="text-xs font-semibold text-gray-600 mb-2 px-2">
                        Select Player for {position}
                      </div>
                      {allEligiblePlayers.map((player) => (
                        <div
                          key={player.id}
                          className="flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-gray-50 transition-colors"
                          onClick={() => {
                            onPlayerChange(position, player.id);
                            setShowDropdown(false);
                          }}
                        >
                          <Avatar className="w-8 h-8">
                            <AvatarImage 
                              src={player.image} 
                              alt={player.name}
                            />
                            <AvatarFallback className="bg-blue-600 text-white text-xs">
                              {player.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="text-sm font-medium">{player.name}</div>
                            <div className="text-xs text-gray-500">
                              Rating: {player.transferroomRating?.toFixed(1) || player.xtvScore || 'N/A'}
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

  return (
    <Card className="p-6 bg-green-50">
      <div className="relative w-full h-[1000px] bg-green-600 rounded-lg overflow-visible">
        {/* Pitch markings */}
        <div className="absolute inset-0 overflow-hidden rounded-lg">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 border-2 border-white rounded-full"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-white rounded-full"></div>
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white"></div>
          <div className="absolute top-0 left-1/3 right-1/3 h-8 border-2 border-white border-t-0"></div>
          <div className="absolute bottom-0 left-1/3 right-1/3 h-8 border-2 border-white border-b-0"></div>
          <div className="absolute top-0 left-1/4 right-1/4 h-16 border-2 border-white border-t-0"></div>
          <div className="absolute bottom-0 left-1/4 right-1/4 h-16 border-2 border-white border-b-0"></div>
        </div>

        {/* Players positioned around the pitch */}
        {Object.entries(currentFormation).map(([position, coords]) => {
          // Reset assigned players for each render to ensure proper assignment order
          if (position === 'GK') assignedPlayers.clear();
          return renderPositionCard(position, coords);
        })}
      </div>
      
      <div className="mt-4 text-center">
        <p className="text-sm text-muted-foreground">
          Formation: {formation} • {players.length} players in squad • 
          Players stacked by position depth
        </p>
      </div>
    </Card>
  );
};

export default EnhancedFootballPitch;
