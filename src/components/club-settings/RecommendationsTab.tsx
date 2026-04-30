import { useState, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Save, Undo2, Plus, Trash2, GripVertical } from "lucide-react";
import { RatingSystem, RatingOption } from "@/types/report";
import {
  useRecommendationsActive,
  setRecommendationsActive,
} from "@/hooks/useRecommendationsActive";

const DEFAULT_RECOMMENDATIONS: RatingSystem = {
  type: "custom-tags",
  values: [
    { value: "Sign", description: "Strong recommendation to acquire", color: "#22C55E" },
    { value: "Monitor", description: "Continue tracking", color: "#EAB308" },
    { value: "Pass", description: "Not a fit", color: "#EF4444" },
  ],
};

const RecommendationsTab = () => {
  const active = useRecommendationsActive();
  const [recommendations, setRecommendations] = useState<RatingSystem>(DEFAULT_RECOMMENDATIONS);
  const savedSnapshotRef = useRef<string>(JSON.stringify(DEFAULT_RECOMMENDATIONS));
  const [dragSourceIdx, setDragSourceIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const hasChanges = useMemo(
    () => JSON.stringify(recommendations) !== savedSnapshotRef.current,
    [recommendations]
  );

  const handleSave = () => {
    savedSnapshotRef.current = JSON.stringify(recommendations);
    setRecommendations({ ...recommendations });
    toast({ title: "Changes Saved", description: "Your recommendations have been saved." });
  };

  const handleClear = () => {
    setRecommendations(JSON.parse(savedSnapshotRef.current));
  };

  const updateOption = (index: number, field: keyof RatingOption, value: string) => {
    const next = [...recommendations.values];
    next[index] = { ...next[index], [field]: value };
    setRecommendations({ ...recommendations, values: next });
  };

  const deleteOption = (index: number) => {
    if (recommendations.values.length <= 1) return;
    setRecommendations({
      ...recommendations,
      values: recommendations.values.filter((_, i) => i !== index),
    });
  };

  const addOption = () => {
    setRecommendations({
      ...recommendations,
      values: [
        ...recommendations.values,
        { value: "New value", description: "", color: "#8B5CF6" },
      ],
    });
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
    const next = [...recommendations.values];
    const [moved] = next.splice(dragSourceIdx, 1);
    next.splice(targetIdx, 0, moved);
    setRecommendations({ ...recommendations, values: next });
    setDragSourceIdx(null);
    setDragOverIdx(null);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-base">Recommendations</CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                Define the recommendation values scouts can apply to a player. Each value has a
                label and a colour swatch used wherever recommendations appear.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0 pt-1">
              <Label htmlFor="recommendations-active" className="text-sm font-medium">
                Activate Player Recommendations
              </Label>
              <Switch
                id="recommendations-active"
                checked={active}
                onCheckedChange={setRecommendationsActive}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {!active ? (
            <p className="text-sm text-muted-foreground py-4">
              Recommendations are not active. When activated, you'll be able to assign verdicts
              like Sign / Monitor / Pass to players across the Scout product.
            </p>
          ) : (
            <div className="space-y-2">
              <div className="text-xs font-medium text-muted-foreground">
                Recommendation values
              </div>

              <div className="space-y-1.5">
                {recommendations.values.map((option, index) => (
                  <div
                    key={index}
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
                      value={option.value.toString()}
                      onChange={(e) => updateOption(index, "value", e.target.value)}
                      className="w-28 h-8 text-sm"
                    />
                    <Input
                      value={option.description || ""}
                      onChange={(e) => updateOption(index, "description", e.target.value)}
                      placeholder="Description (optional)"
                      className="flex-1 h-8 text-sm"
                    />
                    <label className="relative cursor-pointer block w-7 h-7 shrink-0">
                      <div
                        className="w-7 h-7 rounded border border-border"
                        style={{ backgroundColor: option.color || "#000000" }}
                      />
                      <input
                        type="color"
                        value={option.color || "#000000"}
                        onChange={(e) => updateOption(index, "color", e.target.value)}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                    </label>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`p-0 h-7 w-7 shrink-0 ${
                        recommendations.values.length <= 1
                          ? "opacity-50 cursor-not-allowed"
                          : "text-destructive hover:text-destructive"
                      }`}
                      onClick={() => deleteOption(index)}
                      disabled={recommendations.values.length <= 1}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full h-8 text-xs"
                onClick={addOption}
              >
                <Plus size={14} className="mr-1" />
                Add recommendation value
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {active && (
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
      )}
    </div>
  );
};

export default RecommendationsTab;
