import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useScouts } from "@/hooks/useScouts";
import { useCreateAssignment } from "@/hooks/useScoutingAssignments";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { usePlayerAssignments } from "@/hooks/usePlayerAssignments";
import PlayerInfoCard from "@/components/assignment/PlayerInfoCard";
import ScoutSelectionForm from "@/components/assignment/ScoutSelectionForm";
import { useQueryClient } from "@tanstack/react-query";

interface Player {
  id: string;
  name: string;
  club: string;
  positions: string[];
}

interface AssignScoutDialogProps {
  isOpen: boolean;
  onClose: () => void;
  player: Player | null;
}

const AssignScoutDialog = ({ isOpen, onClose, player }: AssignScoutDialogProps) => {
  const { user, profile } = useAuth();
  const { data: scouts = [] } = useScouts();
  const { data: playerAssignments = [], refetch: refetchAssignments } = usePlayerAssignments();
  const createAssignment = useCreateAssignment();
  const queryClient = useQueryClient();

  // Find all existing assignments for this player
  const existingAssignments = player ? 
    playerAssignments
      .filter(assignment => assignment.player_id === player.id)
      .map(assignment => ({
        id: assignment.assigned_to_scout_id,
        first_name: assignment.assigned_to_scout?.first_name,
        last_name: assignment.assigned_to_scout?.last_name,
        email: assignment.assigned_to_scout?.email || ''
      })) : 
    [];

  // Combine current user with other scouts for the dropdown
  const allScoutOptions = [
    // Add current user if they have scout or recruitment role
    ...(profile?.role === 'scout' || profile?.role === 'recruitment' ? [{
      id: user?.id || '',
      first_name: profile?.first_name || 'Me',
      last_name: profile?.last_name ? `(${profile.last_name})` : '',
      email: profile?.email || ''
    }] : []),
    // Add other scouts
    ...scouts.filter(scout => scout.id !== user?.id)
  ];

  const handleSubmit = async (formData: {
    selectedScout: string;
    priority: "High" | "Medium" | "Low";
    reportType: string;
    deadline?: Date;
    notes: string;
  }) => {
    if (!player || !user) return;

    try {
      console.log("=== ASSIGNMENT SUBMISSION START ===");
      console.log("Player ID:", player.id, "type:", typeof player.id);
      console.log("Selected Scout ID:", formData.selectedScout);
      console.log("Existing assignments:", existingAssignments);
      
      // Use the players_new ID directly as a string in the assignment
      await createAssignment.mutateAsync({
        player_id: player.id, // This should be the players_new.id as string
        assigned_to_scout_id: formData.selectedScout,
        assigned_by_manager_id: user.id,
        priority: formData.priority,
        status: 'assigned',
        assignment_notes: formData.notes || undefined,
        deadline: formData.deadline ? formData.deadline.toISOString().split('T')[0] : undefined,
        report_type: formData.reportType,
      });

      console.log("=== ASSIGNMENT MUTATION COMPLETED ===");

      // Wait a moment for the mutation to complete, then refresh all data
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log("=== STARTING DATA REFRESH ===");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['player-assignments'] }),
        queryClient.invalidateQueries({ queryKey: ['scouting-assignments'] }),
        queryClient.invalidateQueries({ queryKey: ['my-scouting-tasks'] }),
        queryClient.refetchQueries({ queryKey: ['player-assignments'] }),
        refetchAssignments()
      ]);

      console.log("=== DATA REFRESH COMPLETED ===");

      // Find the selected scout's name for the notification
      const selectedScoutInfo = allScoutOptions.find(scout => scout.id === formData.selectedScout);
      const scoutName = selectedScoutInfo ? 
        `${selectedScoutInfo.first_name} ${selectedScoutInfo.last_name}`.trim() || selectedScoutInfo.email :
        'Unknown Scout';

      toast({
        title: "Assignment Created",
        description: `${player.name} has been assigned to ${scoutName} for scouting.`,
      });

      console.log("=== ASSIGNMENT PROCESS COMPLETED ===");
      // Close dialog after successful assignment and data refresh
      onClose();
    } catch (error) {
      console.error('Error creating assignment:', error);
      toast({
        title: "Error",
        description: "Failed to create assignment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleClose = async () => {
    // Additional cache refresh when dialog closes to ensure UI updates
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['player-assignments'] }),
      refetchAssignments()
    ]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            Assign Scout
          </DialogTitle>
        </DialogHeader>
        
        {player && (
          <div className="space-y-4">
            <PlayerInfoCard 
              player={player} 
              existingAssignments={existingAssignments} 
            />
            
            <ScoutSelectionForm
              allScoutOptions={allScoutOptions}
              existingAssignments={existingAssignments}
              isOpen={isOpen}
              onSubmit={handleSubmit}
              onCancel={handleClose}
              isSubmitting={createAssignment.isPending}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AssignScoutDialog;
