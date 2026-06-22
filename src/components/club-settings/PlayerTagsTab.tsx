import { useState, useRef, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Save, Undo2, Plus, Trash2, GripVertical } from "lucide-react";
import {
  usePlayerTagDefinitions,
  setPlayerTagDefinitions,
  type PlayerTag,
} from "@/hooks/usePlayerTags";

const PlayerTagsTab = () => {
  const stored = usePlayerTagDefinitions();
  const [tags, setTags] = useState<PlayerTag[]>(stored);
  const savedSnapshotRef = useRef<string>(JSON.stringify(stored));
  const [dragSourceIdx, setDragSourceIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  // Sync incoming store changes when we don't have local edits in flight.
  useEffect(() => {
    if (JSON.stringify(tags) === savedSnapshotRef.current) {
      setTags(stored);
      savedSnapshotRef.current = JSON.stringify(stored);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stored]);

  const hasChanges = useMemo(
    () => JSON.stringify(tags) !== savedSnapshotRef.current,
    [tags]
  );

  const handleSave = () => {
    setPlayerTagDefinitions(tags);
    savedSnapshotRef.current = JSON.stringify(tags);
    setTags([...tags]);
    toast({ title: "Changes Saved", description: "Your player tags have been saved." });
  };

  const handleClear = () => {
    setTags(JSON.parse(savedSnapshotRef.current));
  };

  const updateTag = (index: number, field: keyof PlayerTag, value: string) => {
    const next = [...tags];
    next[index] = { ...next[index], [field]: value };
    setTags(next);
  };

  const deleteTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  const addTag = () => {
    setTags([
      ...tags,
      {
        id: `tag-${Date.now()}`,
        label: "New tag",
        color: "#8B5CF6",
      },
    ]);
  };

  const handleDragStart = (idx: number) => setDragSourceIdx(idx);
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIdx(idx);
  };
  const handleDrop = (e: React.DragEvent, targetIdx: number) => {
    e.preventDefault();
    if (dragSourceIdx === null || dragSourceIdx === targetIdx) {
      setDragSourceIdx(null);
      setDragOverIdx(null);
      return;
    }
    const next = [...tags];
    const [moved] = next.splice(dragSourceIdx, 1);
    next.splice(targetIdx, 0, moved);
    setTags(next);
    setDragSourceIdx(null);
    setDragOverIdx(null);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-base">Player Tags</CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                Define custom tags scouts can attach to players (e.g. "Youth Prospect",
                "Poor Temperament"). Tags appear next to a player's name across the product.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={addTag} className="gap-1 text-xs h-8 shrink-0">
              <Plus size={14} /> Add Tag
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {tags.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">
              No tags configured. Add a tag to get started.
            </p>
          ) : (
            <div className="space-y-1.5">
              {tags.map((tag, index) => (
                <div
                  key={tag.id}
                  className={`flex items-center gap-2 border rounded-md px-2 py-1.5 transition-all ${
                    dragOverIdx === index ? "border-primary ring-1 ring-primary/30" : ""
                  }`}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragLeave={() => setDragOverIdx(null)}
                >
                  <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-muted-foreground/50 active:cursor-grabbing" />
                  <Input
                    value={tag.label}
                    onChange={(e) => updateTag(index, "label", e.target.value)}
                    placeholder="Tag label"
                    className="flex-1 h-8 text-sm"
                  />
                  <label className="relative cursor-pointer block w-7 h-7 shrink-0">
                    <div
                      className="w-7 h-7 rounded border border-border"
                      style={{ backgroundColor: tag.color || "#000000" }}
                    />
                    <input
                      type="color"
                      value={tag.color || "#000000"}
                      onChange={(e) => updateTag(index, "color", e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                  </label>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-0 h-7 w-7 shrink-0 text-destructive hover:text-destructive"
                    onClick={() => deleteTag(index)}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center gap-2 justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClear}
          disabled={!hasChanges}
          className="gap-1 text-xs h-8"
        >
          <Undo2 size={14} /> Clear changes
        </Button>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={!hasChanges}
          className="gap-1 text-xs h-8"
        >
          <Save size={14} /> Save All Changes
        </Button>
      </div>
    </div>
  );
};

export default PlayerTagsTab;
