import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Users, MoreHorizontal, Edit2, Trash2 } from "lucide-react";
import { Player } from "@/types/player";
import AddPrivatePlayerDialog from "@/components/AddPrivatePlayerDialog";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ShortlistsSidebarProps {
  shortlists: any[];
  selectedList: string | null;
  onSelectList: (listId: string) => void;
  allPlayers: Player[];
  privatePlayers: any[];
  onCreateShortlist: (name: string, description: string, playerIds: string[]) => Promise<void>;
  onUpdateShortlist: (id: string, name: string, description: string) => Promise<void>;
  onDeleteShortlist: (id: string) => Promise<void>;
}

export const ShortlistsSidebar = ({
  shortlists,
  selectedList,
  onSelectList,
  allPlayers,
  privatePlayers,
  onCreateShortlist,
  onUpdateShortlist,
  onDeleteShortlist
}: ShortlistsSidebarProps) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newShortlistName, setNewShortlistName] = useState("");
  const [newShortlistDescription, setNewShortlistDescription] = useState("");
  const [editingShortlist, setEditingShortlist] = useState<any>(null);
  const [editShortlistName, setEditShortlistName] = useState("");
  const [editShortlistDescription, setEditShortlistDescription] = useState("");
  const navigate = useNavigate();
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

  const handlePlayerClick = (player: Player) => {
    console.log('ShortlistsSidebar - Player clicked:', player);
    
    if (player.isPrivatePlayer && player.privatePlayerData) {
      console.log('ShortlistsSidebar - Navigating to private player:', player.privatePlayerData.id);
      navigate(`/private-player/${player.privatePlayerData.id}`);
    } else {
      console.log('ShortlistsSidebar - Navigating to public player:', player.id);
      navigate(`/player/${player.id}`);
    }
  };

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

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">Shortlists</CardTitle>
            {canManageShortlists && (
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Create
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
          </div>
        </CardHeader>
      </Card>
      
      <div className="space-y-2">
        {filteredShortlists.map((list) => {
          const privatePlayersForList = privatePlayers.filter(player => 
            list.playerIds?.includes(player.id)
          );
          const publicPlayersForList = allPlayers.filter(player =>
            list.playerIds?.includes(player.id.toString())
          );
          const totalPlayers = publicPlayersForList.length + privatePlayersForList.length;
          
          return (
            <Card
              key={list.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedList === list.id ? "ring-2 ring-blue-500 bg-blue-50/50" : "hover:bg-muted/20"
              }`}
              onClick={() => onSelectList(list.id)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-sm font-medium">
                      {list.name}
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge variant="secondary" className="text-xs">
                      {totalPlayers}
                    </Badge>
                    {canManageShortlists && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 w-6 p-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-background border shadow-md z-50">
                          <DropdownMenuItem 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditShortlist(list);
                            }}
                          >
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
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-xs text-muted-foreground">
                  {totalPlayers} {totalPlayers === 1 ? 'player' : 'players'}
                </div>
              </CardContent>
            </Card>
          );
        })}
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
              <div className="flex justify-between items-center">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete "{editingShortlist?.name}". This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>No</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={async () => {
                          if (editingShortlist) {
                            await handleDeleteShortlist(editingShortlist);
                            setIsEditDialogOpen(false);
                            setEditingShortlist(null);
                          }
                        }}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Yes
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <div className="flex space-x-2">
                  <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpdateShortlist} disabled={!editShortlistName.trim()}>
                    Update
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {canManageShortlists && (
        <AddPrivatePlayerDialog
          trigger={
            <Button variant="outline" className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Add Private Player
            </Button>
          }
        />
      )}
    </div>
  );
};