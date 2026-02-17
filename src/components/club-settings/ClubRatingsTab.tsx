import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RotateCcw, Save, Info, ChevronDown, ChevronRight, HelpCircle, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  CategoryWeights,
  PositionKey,
  POSITION_LABELS,
  DEFAULT_POSITION_WEIGHTS,
  clonePositionWeights,
} from "@/data/myRatingWeights";
import { toast } from "@/hooks/use-toast";

const POSITIONS: PositionKey[] = ['GK', 'CB', 'RB', 'LB', 'DM', 'CM', 'AM', 'W', 'F'];

const ClubRatingsTab = () => {
  const [weights, setWeights] = useState<Record<PositionKey, CategoryWeights[]>>(() => clonePositionWeights(DEFAULT_POSITION_WEIGHTS));
  const [leagueAdjustments, setLeagueAdjustments] = useState(true);
  const [selectedPosition, setSelectedPosition] = useState<PositionKey>('CM');
  const [advanced, setAdvanced] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const currentCategories = weights[selectedPosition];

  const toggleCategory = (catId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      return next;
    });
  };

  const handleCategoryWeightChange = (categoryId: string, value: number) => {
    setWeights(prev => ({
      ...prev,
      [selectedPosition]: prev[selectedPosition].map(c =>
        c.id === categoryId ? { ...c, weight: value } : c
      ),
    }));
  };

  const handleAttributeWeightChange = (categoryId: string, attributeId: string, value: number) => {
    setWeights(prev => ({
      ...prev,
      [selectedPosition]: prev[selectedPosition].map(c =>
        c.id === categoryId
          ? { ...c, attributes: c.attributes.map(a => a.id === attributeId ? { ...a, weight: value } : a) }
          : c
      ),
    }));
  };

  const handleSave = () => {
    toast({ title: "Ratings saved", description: "Your club rating weights have been updated." });
  };

  const handleResetPosition = () => {
    setWeights(prev => ({
      ...prev,
      [selectedPosition]: JSON.parse(JSON.stringify(DEFAULT_POSITION_WEIGHTS[selectedPosition])),
    }));
  };

  const handleResetAll = () => {
    setWeights(clonePositionWeights(DEFAULT_POSITION_WEIGHTS));
    setLeagueAdjustments(true);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5 text-primary" />
            <CardTitle>Game Model Weights</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Advanced</span>
            <Switch checked={advanced} onCheckedChange={setAdvanced} />
          </div>
        </div>
        <CardDescription>
          Set the importance of each attribute category per position to generate your club's custom player ratings.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* League adjustments */}
        <div className="flex items-center gap-2">
          <Checkbox id="league-adj" checked={leagueAdjustments} onCheckedChange={(v) => setLeagueAdjustments(!!v)} />
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

        {/* Position tabs */}
        <div className="flex border rounded-lg overflow-hidden">
          {POSITIONS.map(pos => (
            <button
              key={pos}
              type="button"
              onClick={() => { setSelectedPosition(pos); setExpandedCategories(new Set()); }}
              className={cn(
                "flex-1 py-2.5 text-xs font-medium transition-colors border-r last:border-r-0",
                selectedPosition === pos
                  ? "bg-secondary text-secondary-foreground"
                  : "bg-background text-muted-foreground hover:bg-muted/50"
              )}
            >
              {POSITION_LABELS[pos]}
            </button>
          ))}
        </div>

        {/* Categories */}
        <div className="space-y-5">
          {currentCategories.map(category => {
            const isExpanded = expandedCategories.has(category.id);
            return (
              <div key={category.id}>
                <button type="button" className="w-full flex items-center gap-1.5 mb-2 group" onClick={() => advanced && toggleCategory(category.id)}>
                  {advanced && (isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />)}
                  <span className="font-semibold text-sm">{category.label}</span>
                  {category.tooltip && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild><HelpCircle className="h-3.5 w-3.5 text-muted-foreground" /></TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs"><p className="text-xs">{category.tooltip}</p></TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  <span className="ml-auto text-sm font-bold text-primary tabular-nums">{category.weight}</span>
                </button>
                <Slider value={[category.weight]} onValueChange={([v]) => handleCategoryWeightChange(category.id, v)} min={0} max={100} step={5} className="w-full" />
                {advanced && isExpanded && (
                  <div className="mt-3 ml-1 border rounded-lg p-4 bg-muted/20 space-y-3">
                    <p className="text-xs text-muted-foreground mb-2">Data point weights (relative contribution to {category.label})</p>
                    {category.attributes.map(attr => (
                      <div key={attr.id}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium">{attr.label}</span>
                          <span className="text-xs font-bold text-primary tabular-nums">{attr.weight}%</span>
                        </div>
                        <Slider value={[attr.weight]} onValueChange={([v]) => handleAttributeWeightChange(category.id, attr.id, v)} min={0} max={100} step={5} className="w-full" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          <button type="button" onClick={handleResetPosition} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors pt-2">
            <RotateCcw className="h-3.5 w-3.5" />
            Reset {selectedPosition} to defaults
          </button>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-center gap-3 pt-4 border-t">
          <Button variant="outline" onClick={handleResetAll}>
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
            Reset All
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-3.5 w-3.5 mr-1.5" />
            Save Changes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ClubRatingsTab;
