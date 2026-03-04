import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Search, Plus, X, FolderPlus } from "lucide-react";
import { usePlayersData } from "@/hooks/usePlayersData";
import { usePrivatePlayers } from "@/hooks/usePrivatePlayers";

interface PlayerSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddPlayers: (playerIds: string[]) => void;
  onCreateShortlistWithPlayers?: (name: string, description: string, playerIds: string[]) => Promise<void>;
  excludePlayerIds?: string[];
}

export const PlayerSearchDialog = ({
  open,
  onOpenChange,
  onAddPlayers,
  onCreateShortlistWithPlayers,
  excludePlayerIds = []
}: PlayerSearchDialogProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [addToNewList, setAddToNewList] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [newListDescription, setNewListDescription] = useState("");
  
  const { data: allPlayers = [] } = usePlayersData();
  const { privatePlayers } = usePrivatePlayers();

  const allAvailablePlayers = useMemo(() => {
    const publicPlayers = allPlayers.map(player => ({
      ...player,
      id: player.id.toString(),
      isPrivate: false
    }));
    
    const privatePlayersFormatted = privatePlayers.map(player => ({
      ...player,
      isPrivate: true
    }));
    
    return [...publicPlayers, ...privatePlayersFormatted];
  }, [allPlayers, privatePlayers]);

  const filteredPlayers = useMemo(() => {
    if (!searchTerm.trim()) return [];
    
    return allAvailablePlayers
      .filter(player => {
        if (excludePlayerIds.includes(player.id)) return false;
        
        const searchLower = searchTerm.toLowerCase();
        return (
          player.name.toLowerCase().includes(searchLower) ||
          player.club?.toLowerCase().includes(searchLower) ||
          player.positions?.some((pos: string) => pos?.toLowerCase().includes(searchLower))
        );
      })
      .slice(0, 20);
  }, [allAvailablePlayers, searchTerm, excludePlayerIds]);

  const togglePlayerSelection = (playerId: string) => {
    setSelectedPlayerIds(prev => 
      prev.includes(playerId) 
        ? prev.filter(id => id !== playerId)
        : [...prev, playerId]
    );
  };

  const handleAddSelected = async () => {
    if (selectedPlayerIds.length === 0) return;

    if (addToNewList && onCreateShortlistWithPlayers && newListName.trim()) {
      await onCreateShortlistWithPlayers(newListName.trim(), newListDescription.trim(), selectedPlayerIds);
    } else if (!addToNewList) {
      onAddPlayers(selectedPlayerIds);
    }

    resetAndClose();
  };

  const resetAndClose = () => {
    setSelectedPlayerIds([]);
    setSearchTerm("");
    setAddToNewList(false);
    setNewListName("");
    setNewListDescription("");
    onOpenChange(false);
  };

  const canSubmit = selectedPlayerIds.length > 0 && (!addToNewList || newListName.trim().length > 0);

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Add Players to Shortlist</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search players by name, club, or position..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Selected Players Count */}
          {selectedPlayerIds.length > 0 && (
            <div className="flex items-center justify-between p-2 bg-muted rounded-lg">
              <span className="text-sm">
                {selectedPlayerIds.length} player{selectedPlayerIds.length > 1 ? 's' : ''} selected
              </span>
              <Button
                size="sm"
                onClick={() => setSelectedPlayerIds([])}
                variant="ghost"
              >
                <X className="h-3 w-3 mr-1" />
                Clear
              </Button>
            </div>
          )}

          {/* Search Results */}
          <div className="max-h-[300px] overflow-y-auto space-y-2">
            {searchTerm.trim() === "" ? (
              <div className="text-center text-muted-foreground py-8">
                Start typing to search for players
              </div>
            ) : filteredPlayers.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No players found matching "{searchTerm}"
              </div>
            ) : (
              filteredPlayers.map((player) => {
                const isSelected = selectedPlayerIds.includes(player.id);
                
                return (
                  <div
                    key={player.id}
                    className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                      isSelected 
                        ? 'bg-primary/10 border-primary' 
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => togglePlayerSelection(player.id)}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={(player as any).image_url} alt={player.name} />
                        <AvatarFallback>
                          {player.name.split(' ').map((n: string) => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          {player.name}
                          {player.isPrivate && (
                            <Badge variant="secondary" className="text-xs">Private</Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {player.club} • Age {player.age}
                        </div>
                        <div className="flex gap-1 mt-1">
                          {player.positions?.slice(0, 2).map((pos: string, idx: number) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {pos}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {(player as any).transferroomRating && (
                        <Badge variant="secondary" className="text-xs">
                          {(player as any).transferroomRating.toFixed(1)}
                        </Badge>
                      )}
                      <Button
                        size="sm"
                        variant={isSelected ? "default" : "outline"}
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePlayerSelection(player.id);
                        }}
                      >
                        {isSelected ? (
                          <>
                            <X className="h-3 w-3 mr-1" />
                            Remove
                          </>
                        ) : (
                          <>
                            <Plus className="h-3 w-3 mr-1" />
                            Add
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Add to new shortlist toggle */}
          {onCreateShortlistWithPlayers && selectedPlayerIds.length > 0 && (
            <div className="border rounded-lg p-3 space-y-3">
              <Button
                variant={addToNewList ? "default" : "outline"}
                size="sm"
                className="gap-2"
                onClick={() => setAddToNewList(!addToNewList)}
              >
                <FolderPlus className="h-4 w-4" />
                {addToNewList ? "Adding to new shortlist" : "Add to a new shortlist instead?"}
              </Button>

              {addToNewList && (
                <div className="space-y-3 pt-1">
                  <div className="space-y-1">
                    <Label htmlFor="new-list-name" className="text-sm">Shortlist Name</Label>
                    <Input
                      id="new-list-name"
                      placeholder="e.g. Summer Transfer Targets"
                      value={newListName}
                      onChange={(e) => setNewListName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="new-list-desc" className="text-sm">Description (optional)</Label>
                    <Textarea
                      id="new-list-desc"
                      placeholder="Brief description..."
                      value={newListDescription}
                      onChange={(e) => setNewListDescription(e.target.value)}
                      rows={2}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4 border-t">
            <Button
              onClick={handleAddSelected}
              disabled={!canSubmit}
              className="flex-1"
            >
              <Plus className="h-4 w-4 mr-2" />
              {addToNewList
                ? `Create List & Add ${selectedPlayerIds.length} Player${selectedPlayerIds.length !== 1 ? 's' : ''}`
                : `Add ${selectedPlayerIds.length} Player${selectedPlayerIds.length !== 1 ? 's' : ''}`
              }
            </Button>
            <Button
              variant="outline"
              onClick={resetAndClose}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
