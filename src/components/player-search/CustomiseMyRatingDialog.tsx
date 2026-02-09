import { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { RotateCcw, SlidersHorizontal, Save, Info, ChevronDown, ChevronRight, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  CategoryWeights,
  PositionKey,
  POSITION_LABELS,
  DEFAULT_POSITION_WEIGHTS,
  clonePositionWeights,
} from "@/data/myRatingWeights";

// Re-export for consumers
export { computeMyRating } from "@/data/myRatingWeights";
export type { CategoryWeights, PositionKey } from "@/data/myRatingWeights";
export { DEFAULT_POSITION_WEIGHTS } from "@/data/myRatingWeights";

interface CustomiseMyRatingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  weights: Record<PositionKey, CategoryWeights[]>;
  onWeightsChange: (weights: Record<PositionKey, CategoryWeights[]>) => void;
  leagueAdjustments: boolean;
  onLeagueAdjustmentsChange: (v: boolean) => void;
}

const POSITIONS: PositionKey[] = ['GK', 'CB', 'RB', 'LB', 'DM', 'CM', 'AM', 'W', 'F'];

const CustomiseMyRatingDialog = ({
  open,
  onOpenChange,
  weights,
  onWeightsChange,
  leagueAdjustments,
  onLeagueAdjustmentsChange,
}: CustomiseMyRatingDialogProps) => {
  const [localWeights, setLocalWeights] = useState<Record<PositionKey, CategoryWeights[]>>(weights);
  const [localLeague, setLocalLeague] = useState(leagueAdjustments);
  const [selectedPosition, setSelectedPosition] = useState<PositionKey>('CM');
  const [advanced, setAdvanced] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const currentCategories = localWeights[selectedPosition];

  const toggleCategory = useCallback((catId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      return next;
    });
  }, []);

  const handleCategoryWeightChange = (categoryId: string, value: number) => {
    setLocalWeights(prev => ({
      ...prev,
      [selectedPosition]: prev[selectedPosition].map(c =>
        c.id === categoryId ? { ...c, weight: value } : c
      ),
    }));
  };

  const handleAttributeWeightChange = (categoryId: string, attributeId: string, value: number) => {
    setLocalWeights(prev => ({
      ...prev,
      [selectedPosition]: prev[selectedPosition].map(c =>
        c.id === categoryId
          ? { ...c, attributes: c.attributes.map(a => a.id === attributeId ? { ...a, weight: value } : a) }
          : c
      ),
    }));
  };

  const handleSave = () => {
    onWeightsChange(localWeights);
    onLeagueAdjustmentsChange(localLeague);
    onOpenChange(false);
  };

  const handleResetPosition = () => {
    setLocalWeights(prev => ({
      ...prev,
      [selectedPosition]: JSON.parse(JSON.stringify(DEFAULT_POSITION_WEIGHTS[selectedPosition])),
    }));
  };

  const handleResetAll = () => {
    setLocalWeights(clonePositionWeights(DEFAULT_POSITION_WEIGHTS));
    setLocalLeague(true);
  };

  const handleOpenChange = (open: boolean) => {
    if (open) {
      setLocalWeights(JSON.parse(JSON.stringify(weights)));
      setLocalLeague(leagueAdjustments);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 space-y-1.5">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5 text-primary" />
            <DialogTitle className="text-lg">Edit Game Model Weights</DialogTitle>
          </div>
          <DialogDescription>
            Customize how "My Rating" is calculated for each position by adjusting attribute weights.
          </DialogDescription>
        </DialogHeader>

        {/* Controls row */}
        <div className="px-6 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Checkbox
              id="league-adj"
              checked={localLeague}
              onCheckedChange={(v) => setLocalLeague(!!v)}
            />
            <label htmlFor="league-adj" className="text-sm font-medium cursor-pointer select-none">
              Use league strength adjustments
            </label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <p className="text-xs">When enabled, player ratings are adjusted based on the relative strength of the league they play in.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Advanced</span>
            <Switch checked={advanced} onCheckedChange={setAdvanced} />
          </div>
        </div>

        {/* Position tabs */}
        <div className="px-6 pb-3">
          <div className="flex border rounded-lg overflow-hidden">
            {POSITIONS.map(pos => (
              <button
                key={pos}
                type="button"
                onClick={() => {
                  setSelectedPosition(pos);
                  setExpandedCategories(new Set());
                }}
                className={cn(
                  "flex-1 py-2 text-xs font-medium transition-colors border-r last:border-r-0",
                  selectedPosition === pos
                    ? "bg-secondary text-secondary-foreground"
                    : "bg-background text-muted-foreground hover:bg-muted/50"
                )}
              >
                {POSITION_LABELS[pos]}
              </button>
            ))}
          </div>
        </div>

        {/* Categories */}
        <ScrollArea className="flex-1 px-6">
          <div className="space-y-4 pb-4">
            {currentCategories.map(category => {
              const isExpanded = expandedCategories.has(category.id);
              return (
                <div key={category.id}>
                  {/* Category header row */}
                  <button
                    type="button"
                    className="w-full flex items-center gap-1.5 mb-2 group"
                    onClick={() => advanced && toggleCategory(category.id)}
                  >
                    {advanced && (
                      isExpanded
                        ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        : <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="font-semibold text-sm">{category.label}</span>
                    {category.tooltip && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs">
                            <p className="text-xs">{category.tooltip}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    <span className="ml-auto text-sm font-bold text-primary tabular-nums">
                      {category.weight}
                    </span>
                  </button>

                  {/* Category slider */}
                  <Slider
                    value={[category.weight]}
                    onValueChange={([v]) => handleCategoryWeightChange(category.id, v)}
                    min={0}
                    max={100}
                    step={5}
                    className="w-full"
                  />

                  {/* Subcategories (advanced mode, expanded) */}
                  {advanced && isExpanded && (
                    <div className="mt-3 ml-1 border rounded-lg p-4 bg-muted/20 space-y-3">
                      <p className="text-xs text-muted-foreground mb-2">
                        Data point weights (relative contribution to {category.label})
                      </p>
                      {category.attributes.map(attr => (
                        <div key={attr.id}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium">{attr.label}</span>
                            <span className="text-xs font-bold text-primary tabular-nums">
                              {attr.weight}%
                            </span>
                          </div>
                          <Slider
                            value={[attr.weight]}
                            onValueChange={([v]) => handleAttributeWeightChange(category.id, attr.id, v)}
                            min={0}
                            max={100}
                            step={5}
                            className="w-full"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Reset position link */}
            <button
              type="button"
              onClick={handleResetPosition}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors pt-2"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset {selectedPosition} to defaults
            </button>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex items-center justify-center gap-3">
          <Button variant="outline" onClick={handleResetAll}>
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
            Reset All
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-3.5 w-3.5 mr-1.5" />
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CustomiseMyRatingDialog;
