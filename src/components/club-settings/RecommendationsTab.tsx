import { useState, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Save, Undo2 } from "lucide-react";
import { RatingSystem } from "@/types/report";
import RatingOptionsEditor from "@/components/RatingOptionsEditor";

const DEFAULT_RECOMMENDATIONS: RatingSystem = {
  type: "custom-tags",
  values: [
    { value: "Sign", description: "Strong recommendation to acquire", color: "#22C55E" },
    { value: "Monitor", description: "Continue tracking", color: "#EAB308" },
    { value: "Pass", description: "Not a fit", color: "#EF4444" },
  ],
};

const RecommendationsTab = () => {
  const [recommendations, setRecommendations] = useState<RatingSystem>(DEFAULT_RECOMMENDATIONS);
  const savedSnapshotRef = useRef<string>(JSON.stringify(DEFAULT_RECOMMENDATIONS));

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

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Recommendations</CardTitle>
          <p className="text-sm text-muted-foreground mt-0.5">
            Define the recommendation values scouts can apply to a player. Each value has a
            label and a colour swatch used wherever recommendations appear.
          </p>
        </CardHeader>
        <CardContent className="pt-0">
          <RatingOptionsEditor
            ratingSystem={recommendations}
            onUpdate={setRecommendations}
          />
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

export default RecommendationsTab;
