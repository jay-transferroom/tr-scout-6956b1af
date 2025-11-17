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
import { toast } from "@/hooks/use-toast";

interface NewSquadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (name: string, description: string) => Promise<void>;
}

const NewSquadDialog = ({
  open,
  onOpenChange,
  onConfirm,
}: NewSquadDialogProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const handleConfirm = async () => {
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Please enter a name for this squad",
        variant: "destructive"
      });
      return;
    }

    await onConfirm(name.trim(), description.trim());
    setName("");
    setDescription("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Start a New Squad</DialogTitle>
          <DialogDescription>
            Name your new squad configuration. The formation will be cleared so you can build from scratch.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="squad-name">Squad Name</Label>
            <Input
              id="squad-name"
              placeholder="e.g., Starting XI vs Liverpool"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="squad-description">Description (optional)</Label>
            <Textarea
              id="squad-description"
              placeholder="Add notes about this squad configuration..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>
            Start New Squad
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NewSquadDialog;
