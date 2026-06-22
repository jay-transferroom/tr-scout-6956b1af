import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScoutAvatars } from "@/components/ui/scout-avatars";
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  FileText, 
  UserPlus, 
  Plus, 
  Eye, 
  UserCheck,
  UserMinus,
  PlayCircle,
  MessageSquare,
  Bookmark,
  Check,
  Tag as TagIcon
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { usePlayerAssignments } from "@/hooks/usePlayerAssignments";
import { useShortlists } from "@/hooks/useShortlists";
import { usePlayerNotes } from "@/hooks/usePlayerNotes";
import { usePlayerScouts } from "@/hooks/usePlayerScouts";
import { useAuth } from "@/contexts/AuthContext";
import { ReportWithPlayer } from "@/types/report";
import AssignScoutDialog from "@/components/AssignScoutDialog";
import { PlayerNotes } from "@/components/PlayerNotes";
import { TagPlayerDialog } from "@/components/TagPlayerDialog";
import { usePlayerProfile } from "@/hooks/usePlayerProfile";
import { getOverallRating } from "@/utils/reportDataExtraction";
import { ScoutingGrade } from "@/components/ui/scouting-grade";
import { useToast } from "@/hooks/use-toast";

interface PlayerStatusActionsProps {
  playerId: string;
  playerName: string;
  playerReports: ReportWithPlayer[];
}

const PlayerStatusActions = ({ playerId, playerName, playerReports }: PlayerStatusActionsProps) => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [isTagDialogOpen, setIsTagDialogOpen] = useState(false);
  const [isShortlistDialogOpen, setIsShortlistDialogOpen] = useState(false);
  const [selectedShortlist, setSelectedShortlist] = useState<string>("");

  // Get player data
  const { player } = usePlayerProfile(playerId);
  const { data: scouts = [] } = usePlayerScouts(playerId);

  // Get player data from various hooks
  const { data: assignments = [] } = usePlayerAssignments();
  const { shortlists, getPlayerShortlists, addPlayerToShortlist, addPlayerToScoutingAssignment, removePlayerFromScoutingAssignment } = useShortlists();
  const { notesCount, refetch: refetchNotes } = usePlayerNotes(playerId);

  // Find assignment for this player
  const playerAssignment = assignments.find(assignment => assignment.player_id === playerId);
  
  // Get shortlists this player is in
  const playerShortlists = getPlayerShortlists(playerId);
  
  // Get available shortlists (excluding scouting assignment list and ones player is already in)
  const currentShortlistIds = playerShortlists.map(list => list.id);
  const availableShortlists = shortlists.filter(list => 
    !list.is_scouting_assignment_list && 
    !currentShortlistIds.includes(list.id)
  );
  
  // Check if player is in scouting assignment list, but NOT if they have an active assignment
  const scoutingList = shortlists.find(list => list.is_scouting_assignment_list);
  const isInScoutingList = scoutingList?.playerIds?.includes(playerId) || false;
  
  // Check if player has an active (non-completed) assignment
  const hasActiveAssignment = playerAssignment && playerAssignment.status !== 'completed';
  
  // Player is "assigned for scouting" only if they're in the scouting list AND don't have an active assignment
  const isAssignedForScouting = isInScoutingList && !hasActiveAssignment;

  // Check permissions
  const canAssignScout = profile?.role === 'recruitment' || profile?.role === 'director';
  const canAssignForScouting = profile?.role === 'recruitment' || profile?.role === 'director';

  // Action handlers
  const handleCreateReport = () => {
    navigate('/report-builder', { state: { selectedPlayerId: playerId } });
  };

  const handleViewReports = () => {
    const name = player?.name || playerName;
    navigate(`/reports?playerName=${encodeURIComponent(name)}`);
  };

  const handleAssignScout = () => {
    setIsAssignDialogOpen(true);
  };

  const handleAddToShortlist = () => {
    setIsShortlistDialogOpen(true);
  };

  const handleShortlistSubmit = () => {
    if (!selectedShortlist) return;

    const listName = shortlists.find(list => list.id === selectedShortlist)?.name;
    
    // Add player to the selected shortlist
    addPlayerToShortlist(selectedShortlist, playerId);
    
    toast({
      title: "Player Added to Shortlist",
      description: `${playerName} has been added to ${listName}`,
    });

    setIsShortlistDialogOpen(false);
    setSelectedShortlist("");
  };

  const handleToggleScoutingAssignment = async () => {
    // Check if player already has an active scout assignment
    if (hasActiveAssignment) {
      toast({
        title: "Cannot Mark for Scouting",
        description: `${playerName} already has an active scout assignment. Complete or remove the current assignment first.`,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      if (isAssignedForScouting) {
        await removePlayerFromScoutingAssignment(playerId);
        toast({
          title: "Removed from Scouting List",
          description: `${playerName} has been removed from the scouting assignment list.`,
        });
      } else {
        // When marking for scouting, remove any completed assignments first
        if (playerAssignment && playerAssignment.status === 'completed') {
          console.log('Removing completed assignment before marking for scouting');
          await supabase
            .from('scouting_assignments')
            .delete()
            .eq('player_id', playerId)
            .eq('status', 'completed');
        }
        await addPlayerToScoutingAssignment(playerId);
        toast({
          title: "Marked for Scouting",
          description: `${playerName} has been added to the scouting assignment list.`,
        });
      }
    } catch (error) {
      console.error('Error toggling scouting assignment:', error);
      toast({
        title: "Error",
        description: "Failed to update scouting assignment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotesAction = () => {
    setIsNotesOpen(true);
  };

  const handleNotesClose = () => {
    setIsNotesOpen(false);
    refetchNotes(); // Refresh notes count when closing
  };

  // Status indicators
  const getAssignmentStatus = () => {
    if (!playerAssignment) {
      return {
        icon: <AlertCircle className="w-4 h-4 text-muted-foreground" />,
        text: "Unassigned",
        variant: "secondary" as const,
        priority: null
      };
    }

    const status = playerAssignment.status;
    const priority = playerAssignment.priority;

    switch (status) {
      case 'assigned':
        return {
          icon: <Clock className="w-4 h-4 text-orange-500" />,
          text: `Assigned to ${playerAssignment.assigned_to_scout?.first_name || ''} ${playerAssignment.assigned_to_scout?.last_name || ''}`.trim() || 'Scout',
          variant: "secondary" as const,
          priority
        };
      case 'in_progress':
        return {
          icon: <PlayCircle className="w-4 h-4 text-blue-500" />,
          text: "Report in Progress",
          variant: "default" as const,
          priority
        };
      case 'completed':
        return {
          icon: <CheckCircle className="w-4 h-4 text-green-500" />,
          text: "Report Completed",
          variant: "default" as const,
          priority
        };
      case 'reviewed':
        return {
          icon: <CheckCircle className="w-4 h-4 text-green-600" />,
          text: "Report Reviewed",
          variant: "default" as const,
          priority
        };
      default:
        return {
          icon: <AlertCircle className="w-4 h-4 text-muted-foreground" />,
          text: "Unknown Status",
          variant: "secondary" as const,
          priority
        };
    }
  };

  const assignmentStatus = getAssignmentStatus();
  const reportCount = playerReports.length;

  // Calculate average rating from player reports
  const calculateAverageRating = () => {
    if (reportCount === 0) return null;
    
    const ratings = playerReports
      .map(report => getOverallRating(report))
      .filter(rating => rating !== null && rating !== undefined && typeof rating === "number") as number[];
    
    return ratings.length > 0 
      ? Math.round((ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length) * 10) / 10
      : null;
  };

  const averageRating = calculateAverageRating();

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          {/* Status Section */}
          <div className="flex items-center divide-x divide-border">
            {/* Assigned Scouts Section */}
            {scouts.length > 0 && (
              <div className="flex items-center gap-2 pr-6">
                <ScoutAvatars scouts={scouts} size="sm" />
              </div>
            )}


            {/* Reports Status - only show when there are reports */}
            {reportCount > 0 && (
              <div className="flex items-center gap-2 px-6">
                <Button variant="outline" size="sm" onClick={handleViewReports} className="gap-2">
                  <Eye className="w-4 h-4" />
                  View {reportCount} Report{reportCount !== 1 ? 's' : ''}
                </Button>
                {averageRating !== null && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="px-3 py-2 bg-secondary/50 border border-border rounded-md cursor-help h-9 flex items-center">
                          <ScoutingGrade grade={averageRating} className="text-sm" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Average Scouting Score</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            )}
            
            
          </div>

          {/* Actions Section */}
          <div className="flex items-center gap-2">
            {/* Assignment actions */}
            {canAssignScout && (
              <Button variant="outline" size="sm" onClick={handleAssignScout} className="gap-2">
                <UserPlus className="w-4 h-4" />
                Assign Scout
              </Button>
            )}

            {/* Add to shortlist / View shortlists */}
            {playerShortlists.length > 0 ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" onClick={handleAddToShortlist} className="gap-2">
                      <Eye className="w-4 h-4" />
                      View shortlists ({playerShortlists.length})
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="space-y-1">
                      <p className="font-medium">Shortlists:</p>
                      {playerShortlists.map((list) => (
                        <p key={list.id} className="text-sm">• {list.name}</p>
                      ))}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <Button variant="outline" size="sm" onClick={handleAddToShortlist} className="gap-2">
                <Plus className="w-4 h-4" />
                Add to Shortlist
              </Button>
            )}

            {/* Notes action */}
            <Button variant="outline" size="sm" onClick={handleNotesAction} className="gap-2">
              <MessageSquare className="w-4 h-4" />
              {notesCount > 0 ? `View Notes (${notesCount})` : 'Add Note'}
            </Button>

            {/* Scouting assignment toggle */}
            {canAssignForScouting && !hasActiveAssignment && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleScoutingAssignment}
                disabled={isLoading}
                className={`gap-2 ${isAssignedForScouting ? 'bg-[#E9FBF1] border-[#0E9655] text-[#0E9655] hover:bg-[#E9FBF1]/80' : ''}`}
                style={isAssignedForScouting ? { borderRadius: '8px' } : undefined}
              >
                {isAssignedForScouting ? (
                  <>
                    <Check className="w-4 h-4" />
                    Marked for Scouting
                  </>
                ) : (
                  <>
                    <UserCheck className="w-4 h-4" />
                    Mark for Scouting
                  </>
                )}
              </Button>
            )}

            {/* Create Report - Primary Action (moved to end) */}
            <Button size="sm" onClick={handleCreateReport} className="gap-2">
              <FileText className="w-4 h-4" />
              Create Report
            </Button>
          </div>
        </div>
      </CardContent>

      {/* Assign Scout Dialog */}
      <AssignScoutDialog
        isOpen={isAssignDialogOpen}
        onClose={() => setIsAssignDialogOpen(false)}
        player={player ? {
          id: playerId,
          name: player.name,
          club: player.club || '',
          positions: player.positions || []
        } : null}
      />

      {/* Player Notes Sheet */}
      <PlayerNotes
        playerId={playerId}
        playerName={playerName}
        open={isNotesOpen}
        onOpenChange={handleNotesClose}
      />

      {/* Add to Shortlist Dialog */}
      <Dialog open={isShortlistDialogOpen} onOpenChange={setIsShortlistDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add {playerName} to Shortlist</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Player:</span>
              <span className="font-medium">{playerName}</span>
            </div>

            {playerShortlists.length > 0 && (
              <div>
                <span className="text-sm text-muted-foreground">Currently on:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {playerShortlists.map((list) => (
                    <Badge key={list.id} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      {list.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Shortlist</label>
              {availableShortlists.length > 0 ? (
                <Select value={selectedShortlist} onValueChange={setSelectedShortlist}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a shortlist" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableShortlists.map((list) => (
                      <SelectItem key={list.id} value={list.id}>
                        {list.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="text-sm text-muted-foreground p-2 border rounded">
                  This player is already on all available shortlists
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-4">
              <Button 
                onClick={handleShortlistSubmit} 
                disabled={!selectedShortlist || availableShortlists.length === 0}
                className="flex-1"
              >
                <Bookmark className="h-4 w-4 mr-1" />
                Add to List
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsShortlistDialogOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default PlayerStatusActions;