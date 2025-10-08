import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, LayoutGrid, List, Eye, Minimize2, Maximize2, X, ChevronUp } from "lucide-react";
import { Player } from "@/types/player";
import CompactFootballPitch from "./CompactFootballPitch";
import SquadListView from "./SquadListView";
import SquadRecommendations from "./SquadRecommendations";
import { useNavigate } from "react-router-dom";
import { usePlayersData } from "@/hooks/usePlayersData";

interface CompactSquadViewProps {
  squadPlayers: Player[];
  selectedSquad: string;
  formation?: string;
  positionAssignments?: Array<{
    position: string;
    player_id: string;
  }>;
  onPositionClick?: (position: string) => void;
  selectedPosition?: string | null;
  onPlayerChange?: (position: string, playerId: string) => void;
}

const CompactSquadView = ({ 
  squadPlayers, 
  selectedSquad, 
  formation,
  positionAssignments = [],
  onPositionClick, 
  selectedPosition,
  onPlayerChange 
}: CompactSquadViewProps) => {
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const navigate = useNavigate();
  
  // Fetch all players for recommendations
  const { data: allPlayers = [] } = usePlayersData();

  const handlePlayerClick = (player: Player) => {
    setSelectedPlayer(selectedPlayer?.id === player.id ? null : player);
  };

  const handlePositionClick = (position: string) => {
    onPositionClick?.(position);
    // Clear selected player when clicking on position
    setSelectedPlayer(null);
  };

  const handleViewFullPitch = () => {
    // You could navigate to a full pitch view or open a modal
    // For now, we'll just clear selections
    setSelectedPlayer(null);
    onPositionClick?.('');
  };

  const handleViewPlayerProfile = (player: Player) => {
    if (player.isPrivatePlayer) {
      navigate(`/private-player/${player.id}`);
    } else {
      navigate(`/player/${player.id}`);
    }
  };

  // Map specific pitch positions to general position categories
  const mapPositionToCategory = (position: string): string => {
    if (position === 'GK') return 'GK';
    if (['CB', 'CB1', 'CB2', 'CB3'].includes(position)) return 'CB';
    if (['LB', 'RB', 'LWB', 'RWB'].includes(position)) return 'FB';
    if (['CDM', 'CDM1', 'CDM2', 'CM', 'CM1', 'CM2', 'CM3', 'CAM'].includes(position)) return 'CM';
    if (['LW', 'RW', 'LM', 'RM'].includes(position)) return 'W';
    if (['ST', 'ST1', 'ST2', 'CF'].includes(position)) return 'ST';
    return position;
  };

  // Get position-specific eligible players
  const getPositionEligiblePlayers = (position: string): Player[] => {
    const positionMapping: Record<string, string[]> = {
      'GK': ['GK'],
      'LB': ['LB', 'LWB'],
      'CB': ['CB'],
      'CB1': ['CB'],
      'CB2': ['CB'],
      'CB3': ['CB'],
      'RB': ['RB', 'RWB'],
      'CDM': ['CM', 'CDM'],
      'CDM1': ['CM', 'CDM'],
      'CDM2': ['CM', 'CDM'],
      'CM': ['CM', 'CAM'],
      'CM1': ['CM', 'CAM'],
      'CM2': ['CM', 'CAM'],
      'CM3': ['CM', 'CAM'],
      'CAM': ['CAM', 'CM'],
      'LM': ['LM', 'W', 'LW'],
      'RM': ['RM', 'W', 'RW'],
      'LW': ['W', 'LW', 'LM'],
      'RW': ['W', 'RW', 'RM'],
      'ST': ['F', 'FW', 'ST', 'CF'],
      'ST1': ['F', 'FW', 'ST', 'CF'],
      'ST2': ['F', 'FW', 'ST', 'CF'],
    };

    const allowedPositions = positionMapping[position] || [];
    
    return squadPlayers.filter(player =>
      player.positions.some(pos => allowedPositions.includes(pos))
    ).sort((a, b) => {
      const ratingA = a.transferroomRating || a.xtvScore || 0;
      const ratingB = b.transferroomRating || b.xtvScore || 0;
      return ratingB - ratingA;
    });
  };

  // Filter players based on selected position
  const positionEligiblePlayers = useMemo(() => {
    if (!selectedPosition) return [];
    return getPositionEligiblePlayers(selectedPosition);
  }, [selectedPosition, squadPlayers]);

  return (
    <div className="h-full">
      <div className="pb-3">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-lg font-semibold">
            <Users className="h-5 w-5" />
            Squad Overview
            {selectedSquad === 'shadow-squad' && (
              <Badge variant="secondary" className="text-xs">
                Depth View
              </Badge>
            )}
          </h3>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {squadPlayers.length} players
            </Badge>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsMinimized(!isMinimized)}
              className="text-xs"
            >
              {isMinimized ? <Maximize2 className="h-3 w-3 mr-1" /> : <Minimize2 className="h-3 w-3 mr-1" />}
              {isMinimized ? 'Expand' : 'Minimize'}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleViewFullPitch}
              className="text-xs"
            >
              <Eye className="h-3 w-3 mr-1" />
              Full View
            </Button>
          </div>
        </div>
      </div>
      
      <div className="p-4">
        {!isMinimized ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left Side: Pitch View or Position Player Selection */}
            <div className="space-y-2">
              {selectedPosition ? (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <List className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-medium text-sm">Select Player for {selectedPosition}</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePositionClick('')}
                      className="ml-auto text-xs"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Close
                    </Button>
                  </div>
                  
                  {/* Minimized Pitch Preview */}
                  <div className="h-[120px] bg-muted rounded-lg p-2 mb-2 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-30">
                      <CompactFootballPitch 
                        players={squadPlayers}
                        squadType={selectedSquad}
                        formation={formation}
                        positionAssignments={positionAssignments}
                        onPositionClick={handlePositionClick}
                        selectedPosition={selectedPosition}
                        onPlayerChange={onPlayerChange}
                      />
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handlePositionClick('')}
                        className="text-xs"
                      >
                        <ChevronUp className="h-3 w-3 mr-1" />
                        Expand Pitch
                      </Button>
                    </div>
                  </div>

                  {/* Player Selection List */}
                  <div className="h-[700px]">{/* Match height with recommendations */}
                    <SquadListView 
                      players={positionEligiblePlayers}
                      squadType={selectedSquad}
                      formation={formation}
                      positionAssignments={positionAssignments}
                      onPlayerClick={(player) => {
                        if (onPlayerChange && selectedPosition) {
                          onPlayerChange(selectedPosition, player.id);
                        }
                        handlePlayerClick(player);
                      }}
                      selectedPlayer={selectedPlayer}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <LayoutGrid className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-medium text-sm">Formation View</h3>
                    {formation && (
                      <Badge variant="outline" className="text-xs">
                        {formation}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="h-[700px] bg-muted rounded-lg p-2">
                    <CompactFootballPitch 
                      players={squadPlayers}
                      squadType={selectedSquad}
                      formation={formation}
                      positionAssignments={positionAssignments}
                      onPositionClick={handlePositionClick}
                      selectedPosition={selectedPosition}
                      onPlayerChange={onPlayerChange}
                    />
                  </div>
                </>
              )}
            </div>

            {/* Right Side: Squad Recommendations or Squad List */}
            <div className="space-y-2">
              {selectedPosition ? (
                <div className="h-[700px] overflow-y-auto">
                  <SquadRecommendations 
                    players={squadPlayers}
                    selectedPosition={mapPositionToCategory(selectedPosition)}
                    onPositionSelect={(pos) => handlePositionClick(pos)}
                    allPlayers={allPlayers}
                  />
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <List className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-medium text-sm">Squad List</h3>
                  </div>
                  
                  <div className="h-[700px]">
                    <SquadListView 
                      players={squadPlayers}
                      squadType={selectedSquad}
                      formation={formation}
                      positionAssignments={positionAssignments}
                      onPlayerClick={handlePlayerClick}
                      selectedPlayer={selectedPlayer}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Squad view minimized - {squadPlayers.length} players available</p>
          </div>
        )}

        {/* Selected Player Details */}
        {selectedPlayer && (
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-sm">
                  <div className="font-medium">{selectedPlayer.name}</div>
                  <div className="text-muted-foreground">
                    Age {selectedPlayer.age} • {selectedPlayer.club} • {selectedPlayer.nationality}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  Rating: {Math.round(selectedPlayer.transferroomRating || selectedPlayer.xtvScore || 0)}
                </Badge>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleViewPlayerProfile(selectedPlayer)}
                >
                  View Profile
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompactSquadView;