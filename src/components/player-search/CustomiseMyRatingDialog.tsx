import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AttributeWeight {
  id: string;
  label: string;
  weight: number; // 0-100
}

export interface CategoryWeights {
  id: string;
  label: string;
  weight: number; // 0-100 importance of the whole category
  attributes: AttributeWeight[];
}

export const DEFAULT_MY_RATING_WEIGHTS: CategoryWeights[] = [
  {
    id: 'technical',
    label: 'Technical',
    weight: 80,
    attributes: [
      { id: 'passing', label: 'Passing', weight: 70 },
      { id: 'dribbling', label: 'Dribbling', weight: 60 },
      { id: 'first_touch', label: 'First Touch', weight: 75 },
      { id: 'crossing', label: 'Crossing', weight: 50 },
      { id: 'finishing', label: 'Finishing', weight: 65 },
    ],
  },
  {
    id: 'physical',
    label: 'Physical',
    weight: 60,
    attributes: [
      { id: 'pace', label: 'Pace', weight: 70 },
      { id: 'strength', label: 'Strength', weight: 55 },
      { id: 'stamina', label: 'Stamina', weight: 60 },
      { id: 'agility', label: 'Agility', weight: 65 },
    ],
  },
  {
    id: 'mental',
    label: 'Mental',
    weight: 75,
    attributes: [
      { id: 'decision_making', label: 'Decision Making', weight: 80 },
      { id: 'positioning', label: 'Positioning', weight: 75 },
      { id: 'work_rate', label: 'Work Rate', weight: 60 },
      { id: 'leadership', label: 'Leadership', weight: 45 },
      { id: 'composure', label: 'Composure', weight: 70 },
    ],
  },
  {
    id: 'defensive',
    label: 'Defending',
    weight: 50,
    attributes: [
      { id: 'tackling', label: 'Tackling', weight: 55 },
      { id: 'marking', label: 'Marking', weight: 50 },
      { id: 'aerial_ability', label: 'Aerial Ability', weight: 45 },
      { id: 'interceptions', label: 'Interceptions', weight: 60 },
    ],
  },
  {
    id: 'potential',
    label: 'Potential & Value',
    weight: 70,
    attributes: [
      { id: 'ceiling', label: 'Ceiling / Upside', weight: 80 },
      { id: 'age_profile', label: 'Age Profile', weight: 65 },
      { id: 'resale_value', label: 'Resale Value', weight: 55 },
    ],
  },
];

/**
 * Compute "My Rating" for a player based on the user's category/attribute weights.
 * Since we don't have granular attribute data, we derive a weighted composite from
 * the player's existing transferroomRating + futureRating + age, influenced by the weights.
 */
export function computeMyRating(
  player: { transferroomRating?: number | null; futureRating?: number | null; age?: number },
  weights: CategoryWeights[]
): number | null {
  const baseRating = player.transferroomRating;
  const potential = player.futureRating;
  if (!baseRating && !potential) return null;

  const base = baseRating || 0;
  const pot = potential || base;

  // Normalise category weights
  const totalCategoryWeight = weights.reduce((sum, c) => sum + c.weight, 0);
  if (totalCategoryWeight === 0) return null;

  // Derive a score influenced by weight distribution
  // Technical/Physical/Mental/Defensive categories bias the base rating
  // Potential & Value category biases toward futureRating & age
  let weightedScore = 0;
  let usedWeight = 0;

  for (const category of weights) {
    if (category.weight === 0) continue;
    const catAvgAttrWeight = category.attributes.length > 0
      ? category.attributes.reduce((s, a) => s + a.weight, 0) / category.attributes.length / 100
      : 0.5;

    let categoryScore: number;
    if (category.id === 'potential') {
      // Blend toward potential rating, with age bonus for younger players
      const ageBonus = player.age ? Math.max(0, (28 - player.age) * 0.5) : 0;
      categoryScore = pot * catAvgAttrWeight + ageBonus;
    } else {
      // All other categories influence the base rating
      categoryScore = base * catAvgAttrWeight;
    }

    weightedScore += categoryScore * category.weight;
    usedWeight += category.weight;
  }

  const result = usedWeight > 0 ? weightedScore / usedWeight : 0;
  return Math.min(100, Math.max(0, Math.round(result * 10) / 10));
}

interface CustomiseMyRatingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  weights: CategoryWeights[];
  onWeightsChange: (weights: CategoryWeights[]) => void;
}

const CustomiseMyRatingDialog = ({
  open,
  onOpenChange,
  weights,
  onWeightsChange,
}: CustomiseMyRatingDialogProps) => {
  const [localWeights, setLocalWeights] = useState<CategoryWeights[]>(weights);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const handleCategoryWeightChange = (categoryId: string, value: number) => {
    setLocalWeights(prev =>
      prev.map(c => c.id === categoryId ? { ...c, weight: value } : c)
    );
  };

  const handleAttributeWeightChange = (categoryId: string, attributeId: string, value: number) => {
    setLocalWeights(prev =>
      prev.map(c =>
        c.id === categoryId
          ? { ...c, attributes: c.attributes.map(a => a.id === attributeId ? { ...a, weight: value } : a) }
          : c
      )
    );
  };

  const handleSave = () => {
    onWeightsChange(localWeights);
    onOpenChange(false);
  };

  const handleReset = () => {
    setLocalWeights(DEFAULT_MY_RATING_WEIGHTS);
  };

  // Sync local state when dialog opens
  const handleOpenChange = (open: boolean) => {
    if (open) setLocalWeights(weights);
    onOpenChange(open);
  };

  const getWeightColor = (weight: number) => {
    if (weight >= 75) return 'text-emerald-600';
    if (weight >= 50) return 'text-primary';
    if (weight >= 25) return 'text-amber-500';
    return 'text-muted-foreground';
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[85vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle>Customise My Rating</DialogTitle>
          <DialogDescription>
            Adjust the importance of each category and attribute to create your personalised player rating.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6">
          <div className="space-y-4 pb-4">
            {localWeights.map(category => (
              <div key={category.id} className="border rounded-lg overflow-hidden">
                {/* Category header */}
                <button
                  type="button"
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors text-left"
                  onClick={() => setExpandedCategory(expandedCategory === category.id ? null : category.id)}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{category.label}</span>
                    <Badge variant="outline" className="text-xs">
                      {category.attributes.length} attributes
                    </Badge>
                  </div>
                  <span className={cn("text-sm font-bold tabular-nums", getWeightColor(category.weight))}>
                    {category.weight}%
                  </span>
                </button>

                {/* Category importance slider */}
                <div className="px-4 pb-3 border-t bg-muted/10">
                  <div className="flex items-center justify-between mt-2 mb-1">
                    <span className="text-xs text-muted-foreground">Category Importance</span>
                    <span className="text-xs font-medium tabular-nums">{category.weight}%</span>
                  </div>
                  <Slider
                    value={[category.weight]}
                    onValueChange={([v]) => handleCategoryWeightChange(category.id, v)}
                    min={0}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                </div>

                {/* Expanded attributes */}
                {expandedCategory === category.id && (
                  <div className="px-4 pb-3 space-y-3 border-t">
                    {category.attributes.map(attr => (
                      <div key={attr.id}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium">{attr.label}</span>
                          <span className={cn("text-xs font-bold tabular-nums", getWeightColor(attr.weight))}>
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
            ))}
          </div>
        </ScrollArea>

        <div className="px-6 py-4 border-t flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={handleReset}>
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
            Reset to defaults
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save Weights</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CustomiseMyRatingDialog;
