import { useState, useEffect } from "react";
import { SquadConfigurationAssignment } from "@/hooks/useSquadConfigurations";
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
import { Checkbox } from "@/components/ui/checkbox";
import { useSaveSquadConfiguration, useUpdateSquadConfiguration, useSquadConfigurations, SquadConfiguration } from "@/hooks/useSquadConfigurations";
import { toast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SaveSquadConfigurationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clubName: string;
  formation: string;
  squadType: string;
  positionAssignments: SquadConfigurationAssignment[];
  allPlayers?: any[];
  currentConfiguration?: SquadConfiguration | null;
}

const SaveSquadConfigurationDialog = ({
  open,
  onOpenChange,
  clubName,
  formation,
  squadType,
  positionAssignments,
  allPlayers = [],
  currentConfiguration,
}: SaveSquadConfigurationDialogProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [showOverrideDialog, setShowOverrideDialog] = useState(false);
  
  const saveConfiguration = useSaveSquadConfiguration();
  const updateConfiguration = useUpdateSquadConfiguration();
  const { data: existingConfigs = [] } = useSquadConfigurations(clubName);

  useEffect(() => {
    if (open && currentConfiguration) {
      setName(currentConfiguration.name);
      setDescription(currentConfiguration.description || "");
      setIsDefault(currentConfiguration.is_default || false);
    } else if (open) {
      setName("");
      setDescription("");
      setIsDefault(false);
    }
  }, [open, currentConfiguration]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Please enter a name for this configuration",
        variant: "destructive"
      });
      return;
    }

    // Check if 11 players are selected
    const selectedPlayers = positionAssignments.filter(p => p.player_id && p.player_id.trim() !== '');
    if (selectedPlayers.length < 11) {
      toast({
        title: "Incomplete Squad",
        description: `You need to select 11 players to save the squad. Currently selected: ${selectedPlayers.length}/11`,
        variant: "destructive"
      });
      return;
    }

    if (currentConfiguration) {
      await handleUpdate();
    } else {
      const existingConfig = existingConfigs.find(
        c => c.name.toLowerCase() === name.trim().toLowerCase()
      );
      
      if (existingConfig) {
        setShowOverrideDialog(true);
      } else {
        await handleCreate();
      }
    }
  };

  const handleCreate = async () => {
    try {
      await saveConfiguration.mutateAsync({
        club_name: clubName,
        name: name.trim(),
        formation,
        squad_type: squadType,
        position_assignments: positionAssignments,
        description: description.trim() || undefined,
        is_default: isDefault,
        allPlayers,
      });

      toast({
        title: "Configuration saved",
        description: `${name} has been saved successfully`,
      });

      resetAndClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save configuration",
        variant: "destructive"
      });
    }
  };

  const handleUpdate = async () => {
    if (!currentConfiguration) return;

    try {
      await updateConfiguration.mutateAsync({
        id: currentConfiguration.id,
        name: name.trim(),
        formation,
        squad_type: squadType,
        position_assignments: positionAssignments,
        description: description.trim() || undefined,
        is_default: isDefault,
        club_name: clubName,
      });

      toast({
        title: "Configuration updated",
        description: `${name} has been updated successfully`,
      });

      resetAndClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update configuration",
        variant: "destructive"
      });
    }
  };

  const handleOverride = async () => {
    const existingConfig = existingConfigs.find(
      c => c.name.toLowerCase() === name.trim().toLowerCase()
    );
    
    if (!existingConfig) return;

    try {
      await updateConfiguration.mutateAsync({
        id: existingConfig.id,
        name: name.trim(),
        formation,
        squad_type: squadType,
        position_assignments: positionAssignments,
        description: description.trim() || undefined,
        is_default: isDefault,
        club_name: clubName,
      });

      toast({
        title: "Configuration overridden",
        description: `${name} has been updated successfully`,
      });

      setShowOverrideDialog(false);
      resetAndClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to override configuration",
        variant: "destructive"
      });
    }
  };

  const resetAndClose = () => {
    setName("");
    setDescription("");
    setIsDefault(false);
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {currentConfiguration ? 'Update' : 'Save'} Squad Configuration
            </DialogTitle>
            <DialogDescription>
              {currentConfiguration 
                ? 'Update the current squad configuration.'
                : 'Save the current squad setup for future reference.'}
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

            <div className="flex items-center space-x-2">
              <Checkbox
                id="default"
                checked={isDefault}
                onCheckedChange={(checked) => setIsDefault(checked as boolean)}
              />
              <label
                htmlFor="default"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Set as default configuration
              </label>
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
            <Button 
              onClick={handleSave} 
              disabled={saveConfiguration.isPending || updateConfiguration.isPending}
            >
              {(saveConfiguration.isPending || updateConfiguration.isPending) 
                ? "Saving..." 
                : currentConfiguration ? "Update Configuration" : "Save Configuration"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showOverrideDialog} onOpenChange={setShowOverrideDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Configuration Already Exists</AlertDialogTitle>
            <AlertDialogDescription>
              A configuration named "{name}" already exists. Would you like to override it or save as a new configuration?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button variant="outline" onClick={() => {
              setShowOverrideDialog(false);
              setName(`${name} (Copy)`);
            }}>
              Save as New
            </Button>
            <AlertDialogAction onClick={handleOverride}>
              Override Existing
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default SaveSquadConfigurationDialog;
