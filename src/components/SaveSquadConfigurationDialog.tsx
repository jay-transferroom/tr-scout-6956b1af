import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSaveSquadConfiguration } from "@/hooks/useSquadConfigurations";
import { toast } from "@/hooks/use-toast";

interface SaveSquadConfigurationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clubName: string;
  formation: string;
  squadType: string;
  positionAssignments: Array<{
    position: string;
    player_id: string;
  }>;
  allPlayers?: any[];
}

const SaveSquadConfigurationDialog = ({
  open,
  onOpenChange,
  clubName,
  formation,
  squadType,
  positionAssignments,
  allPlayers = [],
}: SaveSquadConfigurationDialogProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const saveConfiguration = useSaveSquadConfiguration();

  const handleSave = async () => {
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Please enter a name for this configuration",
        variant: "destructive"
      });
      return;
    }

    try {
      await saveConfiguration.mutateAsync({
        club_name: clubName,
        name: name.trim(),
        formation,
        squad_type: squadType,
        position_assignments: positionAssignments,
        description: description.trim() || undefined,
        allPlayers,
      });

      toast({
        title: "Configuration saved",
        description: `${name} has been saved successfully`,
      });

      setName("");
      setDescription("");
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save configuration",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save Squad Configuration</DialogTitle>
          <DialogDescription>
            Save the current squad setup including formation and player positions for future reference.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Configuration Name</Label>
            <Input
              id="name"
              placeholder="e.g., Starting XI vs Liverpool"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="Add notes about this configuration..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Formation:</span>
              <span className="font-medium">{formation}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Squad Type:</span>
              <span className="font-medium">{squadType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Positions Filled:</span>
              <span className="font-medium">{positionAssignments.length}</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saveConfiguration.isPending}>
            {saveConfiguration.isPending ? "Saving..." : "Save Configuration"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SaveSquadConfigurationDialog;
