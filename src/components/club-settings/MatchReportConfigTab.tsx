import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2, Save, Undo2, GripVertical, Loader2 } from "lucide-react";
import { NamedRatingSystem } from "@/types/report";
import { useMatchReportConfig, useSaveMatchReportConfig } from "@/hooks/useMatchReportConfig";

export interface MatchReportRating {
  id: string;
  name: string;
  ratingSystemId: string;
}

export interface MatchReportConfig {
  ratings: MatchReportRating[];
}

export const createDefaultMatchReportConfig = (): MatchReportConfig => ({
  ratings: [
    { id: 'default-overall', name: 'Overall Rating', ratingSystemId: 'numeric-1-10' },
  ],
});

interface MatchReportConfigTabProps {
  availableRatingSystems: NamedRatingSystem[];
}

const MatchReportConfigTab = ({ availableRatingSystems }: MatchReportConfigTabProps) => {
  const { data: savedConfig, isLoading } = useMatchReportConfig();
  const saveConfigMutation = useSaveMatchReportConfig();
  
  const [config, setConfig] = useState<MatchReportConfig>(createDefaultMatchReportConfig());
  const [savedSnapshot, setSavedSnapshot] = useState<string>("");
  const [dragSourceId, setDragSourceId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  // Hydrate from DB
  useEffect(() => {
    if (savedConfig) {
      setConfig(savedConfig);
      setSavedSnapshot(JSON.stringify(savedConfig));
    }
  }, [savedConfig]);

  const hasChanges = useMemo(() => {
    return savedSnapshot !== "" && JSON.stringify(config) !== savedSnapshot;
  }, [config, savedSnapshot]);

  const handleAddRating = () => {
    if (config.ratings.length >= 8) {
      toast({ title: "Maximum Reached", description: "You can have up to 8 ratings per match report.", variant: "destructive" });
      return;
    }
    const newRating: MatchReportRating = {
      id: `rating-${Date.now()}`,
      name: '',
      ratingSystemId: availableRatingSystems[0]?.id || '',
    };
    setConfig(prev => ({ ...prev, ratings: [...prev.ratings, newRating] }));
  };

  const handleUpdateRating = (id: string, updates: Partial<MatchReportRating>) => {
    setConfig(prev => ({
      ...prev,
      ratings: prev.ratings.map(r => r.id === id ? { ...r, ...updates } : r),
    }));
  };

  const handleDeleteRating = (id: string) => {
    if (id === 'default-overall') return;
    setConfig(prev => ({
      ...prev,
      ratings: prev.ratings.filter(r => r.id !== id),
    }));
  };

  const handleSave = async () => {
    try {
      await saveConfigMutation.mutateAsync(config);
      setSavedSnapshot(JSON.stringify(config));
      toast({ title: "Changes Saved", description: "Your match report configuration has been saved." });
    } catch {
      toast({ title: "Error", description: "Failed to save configuration.", variant: "destructive" });
    }
  };

  const handleClearChanges = () => {
    if (savedSnapshot) {
      setConfig(JSON.parse(savedSnapshot));
    }
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    if (id === 'default-overall') { e.preventDefault(); return; }
    setDragSourceId(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    if (id === 'default-overall') return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverId(id);
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (targetId === 'default-overall' || !dragSourceId || dragSourceId === targetId) {
      setDragSourceId(null);
      setDragOverId(null);
      return;
    }
    const ratings = [...config.ratings];
    const sourceIdx = ratings.findIndex(r => r.id === dragSourceId);
    const targetIdx = ratings.findIndex(r => r.id === targetId);
    if (sourceIdx === -1 || targetIdx === -1) return;
    const [moved] = ratings.splice(sourceIdx, 1);
    ratings.splice(targetIdx, 0, moved);
    setConfig(prev => ({ ...prev, ratings }));
    setDragSourceId(null);
    setDragOverId(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Match Report Configuration</CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                Configure the ratings scouts can apply to each player during match scouting. Each match report includes one notes field and up to 8 rating fields.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddRating}
              disabled={config.ratings.length >= 8}
              className="gap-1 text-xs h-8"
            >
              <Plus size={14} /> Add Rating
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-1.5">
            {/* Notes field (always present, not configurable) */}
            <div className="border rounded-md px-3 py-2.5 bg-muted/30">
              <div className="flex items-center gap-2">
                <div className="w-5" />
                <span className="text-sm font-medium text-muted-foreground">Notes</span>
                <span className="text-xs text-muted-foreground ml-auto">Always included</span>
              </div>
            </div>

            {/* Configurable ratings */}
            {config.ratings.map((rating) => {
              const isOverall = rating.id === 'default-overall';
              return (
                <div
                  key={rating.id}
                  className={`border rounded-md px-3 py-2 transition-all ${
                    isOverall
                      ? 'border-green-500/40 bg-green-500/5'
                      : dragOverId === rating.id
                        ? 'border-primary ring-1 ring-primary/30'
                        : ''
                  }`}
                  draggable={!isOverall}
                  onDragStart={(e) => handleDragStart(e, rating.id)}
                  onDragOver={(e) => handleDragOver(e, rating.id)}
                  onDrop={(e) => handleDrop(e, rating.id)}
                  onDragLeave={() => setDragOverId(null)}
                >
                  <div className="flex items-center gap-2">
                    {isOverall ? (
                      <div className="w-4" />
                    ) : (
                      <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-muted-foreground/50 active:cursor-grabbing" />
                    )}
                    {isOverall ? (
                      <span className="text-sm font-medium text-green-700 dark:text-green-400">Rating</span>
                    ) : (
                      <Input
                        value={rating.name}
                        onChange={(e) => handleUpdateRating(rating.id, { name: e.target.value })}
                        placeholder="Rating name (e.g. Technical Ability)"
                        className="h-7 text-sm flex-1 max-w-[220px]"
                      />
                    )}
                    <Select
                      value={rating.ratingSystemId}
                      onValueChange={(value) => handleUpdateRating(rating.id, { ratingSystemId: value })}
                    >
                      <SelectTrigger className="h-7 text-xs w-[180px]">
                        <SelectValue placeholder="Rating system" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableRatingSystems.map((rs) => (
                          <SelectItem key={rs.id} value={rs.id} className="text-xs">
                            {rs.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {isOverall ? (
                      <span className="text-xs text-muted-foreground ml-auto">Primary rating</span>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteRating(rating.id)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}

            {config.ratings.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-4">
                No ratings configured. Add a rating to get started.
              </p>
            )}

            {config.ratings.length > 0 && (
              <p className="text-xs text-muted-foreground pt-1">
                {config.ratings.length}/8 ratings configured
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-2 justify-end">
        {hasChanges && (
          <Button variant="ghost" size="sm" onClick={handleClearChanges} className="gap-1 text-xs h-8">
            <Undo2 size={14} /> Clear changes
          </Button>
        )}
        <Button
          size="sm"
          onClick={handleSave}
          disabled={!hasChanges || saveConfigMutation.isPending}
          className="gap-1 text-xs h-8"
        >
          {saveConfigMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          Save All Changes
        </Button>
      </div>
    </div>
  );
};

export default MatchReportConfigTab;
