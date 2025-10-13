import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, LayoutGrid, List, Eye, Minimize2, Maximize2, X, ChevronUp, AlertTriangle } from "lucide-react";
import { Player } from "@/types/player";
import CompactFootballPitch from "./CompactFootballPitch";
import SquadListView from "./SquadListView";
import SquadRecommendations from "./SquadRecommendations";
import { useNavigate } from "react-router-dom";
import { usePlayersData } from "@/hooks/usePlayersData";
import { useSquadRecommendations } from "@/hooks/useSquadRecommendations";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

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
  const [selectedPlayerForDetails, setSelectedPlayerForDetails] = useState<Player | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const navigate = useNavigate();
  
  // Fetch all players for recommendations
  const { data: allPlayers = [] } = usePlayersData();
  
  // Fetch squad recommendations
  const { data: recommendations = [] } = useSquadRecommendations();

  const handlePlayerClick = (player: Player) => {
    setSelectedPlayerForDetails(player);
  };

  const handlePositionClick = (position: string) => {
    onPositionClick?.(position);
  };

  const handleViewFullPitch = () => {
    // You could navigate to a full pitch view or open a modal
    // For now, we'll just clear selections
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
          <Badge variant="outline" className="text-xs">
            {squadPlayers.length} players
          </Badge>
        </div>
      </div>
      
      {!isMinimized ? (
        <div className="flex gap-4 h-[calc(100vh-200px)]">
          {/* Left Side - Pitch View (Fixed) */}
          <div className="w-1/2 sticky top-0 h-fit">
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
              
              <div className="aspect-[392/541] w-full max-w-2xl mx-auto relative">
                <CompactFootballPitch 
                  players={squadPlayers}
                  squadType={selectedSquad}
                  formation={formation}
                  positionAssignments={positionAssignments}
                  onPositionClick={handlePositionClick}
                  selectedPosition={selectedPosition}
                  onPlayerChange={onPlayerChange}
                  priorityPositions={recommendations.map(rec => rec.Position)}
                />
              </div>
            </div>
          </div>

          {/* Right Side - Squad List (Scrollable) */}
          <div className="w-1/2 overflow-y-auto">
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <List className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-medium text-sm">Squad List</h3>
              </div>
              
              <div>
                <SquadListView 
                  players={squadPlayers}
                  squadType={selectedSquad}
                  formation={formation}
                  positionAssignments={positionAssignments}
                  onPlayerClick={handlePlayerClick}
                  selectedPlayer={null}
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-4 text-muted-foreground">
          <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Squad view minimized - {squadPlayers.length} players available</p>
        </div>
      )}

      {/* Position Selection Slide-out */}
      <Sheet open={!!selectedPosition} onOpenChange={(open) => !open && handlePositionClick('')}>
        <SheetContent side="right" className="w-[75vw] overflow-y-auto">
          {selectedPosition && (
            <>
              <SheetHeader>
                <SheetTitle>Select Player for {selectedPosition}</SheetTitle>
                <SheetDescription>
                  Choose from eligible players or view recommendations
                </SheetDescription>
              </SheetHeader>

              <Tabs defaultValue="select" className="mt-6">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="select">Select Player</TabsTrigger>
                  <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
                  <TabsTrigger value="shortlists">Shortlists</TabsTrigger>
                </TabsList>

                <TabsContent value="select" className="mt-6">
                  <div className="space-y-3">
                    <SquadListView 
                      players={positionEligiblePlayers}
                      squadType={selectedSquad}
                      formation={formation}
                      positionAssignments={positionAssignments}
                      onPlayerClick={(player) => {
                        if (onPlayerChange && selectedPosition) {
                          onPlayerChange(selectedPosition, player.id);
                        }
                        handlePositionClick('');
                      }}
                      selectedPlayer={null}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="recommendations" className="mt-6">
                  <div className="space-y-3">
                    <SquadRecommendations 
                      players={squadPlayers}
                      selectedPosition={mapPositionToCategory(selectedPosition)}
                      onPositionSelect={(pos) => handlePositionClick(pos)}
                      allPlayers={allPlayers}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="shortlists" className="mt-6">
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Shortlisted players for {selectedPosition} position will appear here.
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Player Details Slide-out */}
      <Sheet open={!!selectedPlayerForDetails} onOpenChange={(open) => !open && setSelectedPlayerForDetails(null)}>
        <SheetContent side="right" className="w-[75vw]">
          {selectedPlayerForDetails && (
            <>
              <SheetHeader>
                <SheetTitle>{selectedPlayerForDetails.name}</SheetTitle>
                <SheetDescription>
                  {selectedPlayerForDetails.positions.join(", ")}
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Basic Info */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold">Player Information</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-muted-foreground">Age</div>
                      <div className="font-medium">{selectedPlayerForDetails.age}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Nationality</div>
                      <div className="font-medium">{selectedPlayerForDetails.nationality}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Club</div>
                      <div className="font-medium">{selectedPlayerForDetails.club}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Contract Expiry</div>
                      <div className="font-medium">
                        {selectedPlayerForDetails.contractExpiry || "N/A"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ratings */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold">Ratings</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedPlayerForDetails.transferroomRating && (
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <span className="text-sm text-muted-foreground">Overall</span>
                        <Badge variant="secondary" className="text-base">
                          {Math.round(selectedPlayerForDetails.transferroomRating)}
                        </Badge>
                      </div>
                    )}
                    {selectedPlayerForDetails.xtvScore && (
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <span className="text-sm text-muted-foreground">XTV</span>
                        <Badge variant="secondary" className="text-base">
                          {Math.round(selectedPlayerForDetails.xtvScore)}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>

                {/* Positions */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold">Positions</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedPlayerForDetails.positions.map((pos) => (
                      <Badge key={pos} variant="outline">
                        {pos}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-4 space-y-2">
                  <Button 
                    className="w-full"
                    onClick={() => handleViewPlayerProfile(selectedPlayerForDetails)}
                  >
                    View Full Profile
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default CompactSquadView;