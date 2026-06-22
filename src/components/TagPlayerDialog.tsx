import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Tag as TagIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import {
  usePlayerTags,
  setPlayerTagDefinitions,
  type PlayerTag,
} from "@/hooks/usePlayerTags";
import { PlayerTagPill } from "@/components/PlayerTagsView";

interface TagPlayerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  playerId: string;
  playerName: string;
}

const PRESET_COLORS = [
  "#22C55E", "#3B82F6", "#8B5CF6", "#EF4444",
  "#F59E0B", "#EC4899", "#14B8A6", "#6B7280",
];

export const TagPlayerDialog = ({ open, onOpenChange, playerId, playerName }: TagPlayerDialogProps) => {
  const { definitions, tagAssignments, setTags } = usePlayerTags(playerId);

  const initialSelected = useMemo(
    () => tagAssignments.map((a) => a.tagId),
    [tagAssignments, open]
  );

  const [selected, setSelected] = useState<string[]>(initialSelected);
  const [creating, setCreating] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);

  // Reset selection when dialog opens
  useEffect(() => {
    if (open) {
      setSelected(initialSelected);
      setCreating(false);
      setNewLabel("");
      setNewColor(PRESET_COLORS[0]);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = (id: string) => {
    setSelected((cur) =>
      cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]
    );
  };

  const handleCreateTag = () => {
    const label = newLabel.trim();
    if (!label) return;
    const newTag: PlayerTag = {
      id: `tag-${Date.now()}`,
      label,
      color: newColor,
    };
    setPlayerTagDefinitions([...definitions, newTag]);
    setSelected((cur) => [...cur, newTag.id]);
    setNewLabel("");
    setCreating(false);
    toast({ title: "Tag created", description: `"${label}" has been added.` });
  };

  const handleSave = () => {
    setTags(selected);
    toast({
      title: "Tags updated",
      description: `${playerName}'s tags have been updated.`,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tag {playerName}</DialogTitle>
          <DialogDescription>
            Select tags to apply, or create a new one.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Applied tags */}
          <div>
            <div className="text-xs font-semibold text-foreground mb-2">
              Applied tags
            </div>
            {selected.length === 0 ? (
              <p className="text-sm text-muted-foreground py-1">
                No tags applied yet.
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {definitions
                  .filter((t) => selected.includes(t.id))
                  .map((tag) => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggle(tag.id)}
                      className="group inline-flex items-center gap-1 rounded-md pr-1"
                      title={`Remove "${tag.label}"`}
                    >
                      <PlayerTagPill label={tag.label} color={tag.color} />
                      <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-black/20 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="w-2.5 h-2.5" />
                      </span>
                    </button>
                  ))}
              </div>
            )}
          </div>

          {/* Available tags */}
          <div>
            <div className="text-xs font-semibold text-foreground mb-2">
              Available tags
            </div>
            {definitions.filter((t) => !selected.includes(t.id)).length === 0 ? (
              <p className="text-sm text-muted-foreground py-1">
                All tags have been applied.
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {definitions
                  .filter((t) => !selected.includes(t.id))
                  .map((tag) => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggle(tag.id)}
                      className="inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium transition-colors hover:bg-muted"
                      style={{
                        borderColor: `${tag.color}60`,
                        color: tag.color,
                      }}
                      title={`Add "${tag.label}"`}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      {tag.label}
                    </button>
                  ))}
              </div>
            )}
          </div>

          {/* Create new tag */}
          <div className="border-t pt-3">
            {!creating ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCreating(true)}
                className="gap-1 text-xs h-8"
              >
                <Plus className="w-3.5 h-3.5" /> Create new tag
              </Button>
            ) : (
              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground">
                  New tag
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    placeholder="Tag label"
                    className="h-8 text-sm"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleCreateTag();
                    }}
                    autoFocus
                  />
                  <label className="relative cursor-pointer block w-8 h-8 shrink-0">
                    <div
                      className="w-8 h-8 rounded border border-border"
                      style={{ backgroundColor: newColor }}
                    />
                    <input
                      type="color"
                      value={newColor}
                      onChange={(e) => setNewColor(e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                  </label>
                </div>
                <div className="flex flex-wrap gap-1">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewColor(c)}
                      className={cn(
                        "w-5 h-5 rounded border",
                        newColor === c ? "border-foreground" : "border-border"
                      )}
                      style={{ backgroundColor: c }}
                      aria-label={`Pick color ${c}`}
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleCreateTag}
                    disabled={!newLabel.trim()}
                    className="h-8 text-xs"
                  >
                    Add tag
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setCreating(false);
                      setNewLabel("");
                    }}
                    className="h-8 text-xs"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save tags</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TagPlayerDialog;
