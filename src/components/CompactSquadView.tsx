import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, LayoutGrid, List, Eye, Minimize2, Maximize2, Target, Star, Zap } from "lucide-react";
import { Player } from "@/types/player";
import CompactFootballPitch from "./CompactFootballPitch";
import SquadListView from "./SquadListView";
import { useNavigate } from "react-router-dom";
import { useShortlists } from "@/hooks/useShortlists";
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
  
  // Fetch all players and shortlists for recommendations
  const { data: allPlayers = [] } = usePlayersData();
  const { shortlists } = useShortlists();

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
    
    return allPlayers.filter(player =>
      player.positions.some(pos => allowedPositions.includes(pos))
    ).sort((a, b) => {
      const ratingA = a.transferroomRating || a.xtvScore || 0;
      const ratingB = b.transferroomRating || b.xtvScore || 0;
      return ratingB - ratingA;
    });
  };

  // Filter players based on selected position
  const filteredPlayers = useMemo(() => {
    if (!selectedPosition) return squadPlayers;
    return getPositionEligiblePlayers(selectedPosition).filter(p => 
      squadPlayers.some(sp => sp.id === p.id)
    );
  }, [selectedPosition, squadPlayers, allPlayers]);

  // Get shortlist players for selected position
  const shortlistPlayersForPosition = useMemo(() => {
    if (!selectedPosition) return [];
    
    const eligiblePlayers = getPositionEligiblePlayers(selectedPosition);
    const shortlistPlayerIds = new Set(
      shortlists.flatMap(s => s.playerIds || [])
    );
    
    return eligiblePlayers.filter(p => 
      shortlistPlayerIds.has(p.id) && 
      !squadPlayers.some(sp => sp.id === p.id)
    ).slice(0, 10);
  }, [selectedPosition, shortlists, allPlayers, squadPlayers]);

  // Get recommendations for selected position
  const recommendationsForPosition = useMemo(() => {
    if (!selectedPosition) return [];
    
    const eligiblePlayers = getPositionEligiblePlayers(selectedPosition);
    const shortlistPlayerIds = new Set(
      shortlists.flatMap(s => s.playerIds || [])
    );
    
    return eligiblePlayers
      .filter(p => 
        !squadPlayers.some(sp => sp.id === p.id) &&
        !shortlistPlayerIds.has(p.id)
      )
      .slice(0, 10);
  }, [selectedPosition, shortlists, allPlayers, squadPlayers]);

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5" />
            Squad Overview
            {selectedSquad === 'shadow-squad' && (
              <Badge variant="secondary" className="text-xs">
                Depth View
              </Badge>
            )}
          </CardTitle>
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
      </CardHeader>
      
      <CardContent className="p-4">
        {!isMinimized ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Compact Pitch View */}
            <div className="space-y-2">
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
            </div>

            {/* Squad List View with Tabs when position selected */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <List className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-medium text-sm">
                  {selectedPosition ? `${selectedPosition} Options` : 'Squad List'}
                </h3>
                {selectedPosition && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handlePositionClick('')}
                    className="ml-auto text-xs"
                  >
                    Clear Filter
                  </Button>
                )}
              </div>
              
              {selectedPosition ? (
                <Tabs defaultValue="current" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="current" className="text-xs">
                      <Users className="h-3 w-3 mr-1" />
                      Current ({filteredPlayers.length})
                    </TabsTrigger>
                    <TabsTrigger value="shortlists" className="text-xs">
                      <Star className="h-3 w-3 mr-1" />
                      Shortlists ({shortlistPlayersForPosition.length})
                    </TabsTrigger>
                    <TabsTrigger value="recommendations" className="text-xs">
                      <Zap className="h-3 w-3 mr-1" />
                      Suggested ({recommendationsForPosition.length})
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="current" className="h-[630px] mt-2">
                    <SquadListView 
                      players={filteredPlayers}
                      squadType={selectedSquad}
                      formation={formation}
                      positionAssignments={positionAssignments}
                      onPlayerClick={handlePlayerClick}
                      selectedPlayer={selectedPlayer}
                    />
                  </TabsContent>
                  
                  <TabsContent value="shortlists" className="h-[630px] mt-2">
                    <SquadListView 
                      players={shortlistPlayersForPosition}
                      squadType={selectedSquad}
                      formation={formation}
                      positionAssignments={positionAssignments}
                      onPlayerClick={handlePlayerClick}
                      selectedPlayer={selectedPlayer}
                    />
                  </TabsContent>
                  
                  <TabsContent value="recommendations" className="h-[630px] mt-2">
                    <SquadListView 
                      players={recommendationsForPosition}
                      squadType={selectedSquad}
                      formation={formation}
                      positionAssignments={positionAssignments}
                      onPlayerClick={handlePlayerClick}
                      selectedPlayer={selectedPlayer}
                    />
                  </TabsContent>
                </Tabs>
              ) : (
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
      </CardContent>
    </Card>
  );
};

export default CompactSquadView;