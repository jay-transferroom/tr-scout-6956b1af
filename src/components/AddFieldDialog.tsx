
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

interface AddFieldDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (types: Array<"rating" | "text">) => void;
}

const AddFieldDialog = ({ open, onOpenChange, onConfirm }: AddFieldDialogProps) => {
  const [includeRating, setIncludeRating] = useState(true);
  const [includeText, setIncludeText] = useState(true);

  const handleConfirm = () => {
    const types: Array<"rating" | "text"> = [];
    if (includeRating) types.push("rating");
    if (includeText) types.push("text");
    if (types.length > 0) {
      onConfirm(types);
    }
    onOpenChange(false);
    setIncludeRating(true);
    setIncludeText(true);
  };

  const handleCancel = () => {
    onOpenChange(false);
    setIncludeRating(true);
    setIncludeText(true);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Subsection</DialogTitle>
          <p className="text-sm text-muted-foreground">Choose content types</p>
        </DialogHeader>

        <div className="space-y-5 py-4">
          <div className="flex items-center gap-3">
            <Checkbox
              id="add-field-rating"
              checked={includeRating}
              onCheckedChange={(checked) => setIncludeRating(!!checked)}
            />
            <label htmlFor="add-field-rating" className="text-sm font-medium cursor-pointer">
              Rating
            </label>
          </div>

          <div className="flex items-center gap-3">
            <Checkbox
              id="add-field-text"
              checked={includeText}
              onCheckedChange={(checked) => setIncludeText(!!checked)}
            />
            <label htmlFor="add-field-text" className="text-sm font-medium cursor-pointer">
              Text
            </label>
          </div>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-0">
          <Button variant="ghost" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!includeRating && !includeText}
            className="bg-primary text-primary-foreground"
          >
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddFieldDialog;
