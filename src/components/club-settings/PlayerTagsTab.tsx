import { useState, useRef, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Save, Undo2, Plus, Trash2 } from "lucide-react";
import {
  usePlayerTagDefinitions,
  setPlayerTagDefinitions,
  getTagPlayerCounts,
  type PlayerTag,
} from "@/hooks/usePlayerTags";

const PlayerTagsTab = () => {
  const stored = usePlayerTagDefinitions();
  const [tags, setTags] = useState<PlayerTag[]>(stored);
  const savedSnapshotRef = useRef<string>(JSON.stringify(stored));

  // Sync incoming store changes when we don't have local edits in flight.
  useEffect(() => {
    if (JSON.stringify(tags) === savedSnapshotRef.current) {
      setTags(stored);
      savedSnapshotRef.current = JSON.stringify(stored);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stored]);

  const tagCounts = useMemo(() => getTagPlayerCounts(), [stored]);

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
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/40 transition-colors"
                >
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
                  <div className="text-xs text-muted-foreground tabular-nums min-w-[2.5rem] text-right">
                    {tagCounts[tag.id] || 0} player{tagCounts[tag.id] === 1 ? "" : "s"}
                  </div>
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
