import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, MoreHorizontal, Edit2, Trash2, ScrollText, ChevronDown } from "lucide-react";
import { Player } from "@/types/player";
import AddPrivatePlayerDialog from "@/components/AddPrivatePlayerDialog";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface ShortlistsTabsProps {
  shortlists: any[];
  selectedList: string | null;
  onSelectList: (listId: string) => void;
  allPlayers: Player[];
  privatePlayers: any[];
  onCreateShortlist: (name: string, description: string, playerIds: string[]) => Promise<void>;
  onUpdateShortlist: (id: string, name: string, description: string) => Promise<void>;
  onDeleteShortlist: (id: string) => Promise<void>;
}

export const ShortlistsTabs = ({
  shortlists,
  selectedList,
  onSelectList,
  allPlayers,
  privatePlayers,
  onCreateShortlist,
  onUpdateShortlist,
  onDeleteShortlist
}: ShortlistsTabsProps) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newShortlistName, setNewShortlistName] = useState("");
  const [newShortlistDescription, setNewShortlistDescription] = useState("");
  const [editingShortlist, setEditingShortlist] = useState<any>(null);
  const [editShortlistName, setEditShortlistName] = useState("");
  const [editShortlistDescription, setEditShortlistDescription] = useState("");
  const { profile, user } = useAuth();

  // Check if user can manage shortlists (director or recruitment)
  const canManageShortlists = profile?.role === 'director' || profile?.role === 'recruitment';

  // Filter shortlists based on user role (exclude scouting assignment list)
  const filteredShortlists = shortlists.filter(list => {
    // Hide the scouting assignment list
    if (list.is_scouting_assignment_list) {
      return false;
    }
    
    // For other lists, check user permissions
    if (profile?.role === 'director') {
      return true; // Directors can see all lists
    } else if (profile?.role === 'recruitment') {
      return true; // Recruitment can see all lists
    } else {
      return list.user_id === user?.id; // Other users see only their own lists
    }
  });

  const handleCreateShortlist = async () => {
    if (newShortlistName.trim()) {
      await onCreateShortlist(newShortlistName.trim(), newShortlistDescription.trim(), []);
      setNewShortlistName("");
      setNewShortlistDescription("");
      setIsAddDialogOpen(false);
    }
  };

  const handleEditShortlist = (shortlist: any) => {
    setEditingShortlist(shortlist);
    setEditShortlistName(shortlist.name);
    setEditShortlistDescription(shortlist.description || "");
    setIsEditDialogOpen(true);
  };

  const handleUpdateShortlist = async () => {
    if (editShortlistName.trim() && editingShortlist) {
      await onUpdateShortlist(editingShortlist.id, editShortlistName.trim(), editShortlistDescription.trim());
      setEditShortlistName("");
      setEditShortlistDescription("");
      setEditingShortlist(null);
      setIsEditDialogOpen(false);
    }
  };

  const handleDeleteShortlist = async (shortlist: any) => {
    await onDeleteShortlist(shortlist.id);
    if (selectedList === shortlist.id) {
      onSelectList(filteredShortlists.find(s => s.id !== shortlist.id)?.id || "");
    }
  };

  const getPlayerCount = (list: any) => {
    const privatePlayersForList = privatePlayers.filter(player => 
      list.playerIds?.includes(player.id)
    );
    const publicPlayersForList = allPlayers.filter(player =>
      list.playerIds?.includes(player.id.toString())
    );
    return publicPlayersForList.length + privatePlayersForList.length;
  };

  const selectedShortlist = filteredShortlists.find(list => list.id === selectedList);
  const selectedPlayerCount = selectedShortlist ? getPlayerCount(selectedShortlist) : 0;

  return (
    <div className="mb-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2 sm:flex-nowrap">
        {/* Shortlist dropdown selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2 w-full sm:w-auto sm:min-w-[200px] justify-between max-w-full">
              <div className="flex items-center gap-2">
                <ScrollText className="h-4 w-4" />
                <span>{selectedShortlist?.name || "Select Shortlist"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {selectedPlayerCount}
                </Badge>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="bg-background border shadow-md z-50 w-[280px]">
            {filteredShortlists.map((list) => {
              const playerCount = getPlayerCount(list);
              const isSelected = selectedList === list.id;
              
              return (
                <div key={list.id} className="flex items-center gap-1">
                  <DropdownMenuItem
                    onClick={() => onSelectList(list.id)}
                    className={cn(
                      "flex-1 flex items-start justify-between cursor-pointer",
                      isSelected && "bg-accent"
                    )}
                  >
                    <div className="flex flex-col gap-0.5 flex-1">
                      <span className="font-medium">{list.name}</span>
                      {list.description && (
                        <span className="text-xs text-muted-foreground line-clamp-2">
                          {list.description}
                        </span>
                      )}
                    </div>
                    <Badge variant="secondary" className="text-xs ml-2 shrink-0">
                      {playerCount}
                    </Badge>
                  </DropdownMenuItem>
                  
                  {/* Edit/Delete actions for each shortlist */}
                  {canManageShortlists && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-background border shadow-md z-50">
                        <DropdownMenuItem onClick={() => handleEditShortlist(list)}>
                          <Edit2 className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Shortlist</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{list.name}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDeleteShortlist(list)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Create new shortlist button */}
        {canManageShortlists && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-2 whitespace-nowrap w-full sm:w-auto">
                <Plus className="h-4 w-4" />
                Create Shortlist
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Shortlist</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="shortlist-name">Shortlist Name</Label>
                  <Input
                    id="shortlist-name"
                    value={newShortlistName}
                    onChange={(e) => setNewShortlistName(e.target.value)}
                    placeholder="Enter shortlist name..."
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleCreateShortlist()}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shortlist-description">Description (Optional)</Label>
                  <Textarea
                    id="shortlist-description"
                    value={newShortlistDescription}
                    onChange={(e) => setNewShortlistDescription(e.target.value)}
                    placeholder="Enter shortlist description..."
                    rows={3}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateShortlist} disabled={!newShortlistName.trim()}>
                    Create Shortlist
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Add private player button */}
        {canManageShortlists && (
          <AddPrivatePlayerDialog
            trigger={
              <Button variant="outline" size="sm" className="flex items-center gap-2 whitespace-nowrap w-full sm:w-auto">
                <Plus className="h-4 w-4" />
                Add Private Player
              </Button>
            }
          />
        )}
      </div>

      {/* Edit Shortlist Dialog */}
      {canManageShortlists && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Shortlist</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-shortlist-name">Shortlist Name</Label>
                <Input
                  id="edit-shortlist-name"
                  value={editShortlistName}
                  onChange={(e) => setEditShortlistName(e.target.value)}
                  placeholder="Enter shortlist name..."
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleUpdateShortlist()}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-shortlist-description">Description (Optional)</Label>
                <Textarea
                  id="edit-shortlist-description"
                  value={editShortlistDescription}
                  onChange={(e) => setEditShortlistDescription(e.target.value)}
                  placeholder="Enter shortlist description..."
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateShortlist} disabled={!editShortlistName.trim()}>
                  Update
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};