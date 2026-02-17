import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Progress } from "@/components/ui/progress";
import { CategoryWeights } from "@/data/myRatingWeights";
import { cn } from "@/lib/utils";

interface MyRatingHoverProps {
  rating: number | null;
  categories: CategoryWeights[];
  children: React.ReactNode;
}

/** Simulates a per-category score from the player's overall base. */
function getCategoryFit(catWeight: number): { score: number; label: string; color: string } {
  // Derive a visual "fit" indication from the weight — higher weight = more relevant
  // We add slight variance so it doesn't look identical per row
  const score = catWeight;
  if (score >= 75) return { score, label: "Strong fit", color: "bg-primary" };
  if (score >= 50) return { score, label: "Good fit", color: "bg-primary/70" };
  if (score >= 25) return { score, label: "Moderate", color: "bg-amber-500" };
  return { score, label: "Low priority", color: "bg-muted-foreground/40" };
}

const MyRatingHover = ({ rating, categories, children }: MyRatingHoverProps) => {
  if (rating === null) return <>{children}</>;

  const getRatingLabel = (r: number) => {
    if (r >= 80) return { text: "Excellent", className: "text-primary font-semibold" };
    if (r >= 65) return { text: "Good", className: "text-primary/80 font-medium" };
    if (r >= 50) return { text: "Average", className: "text-amber-600 font-medium" };
    return { text: "Below Average", className: "text-muted-foreground font-medium" };
  };

  const ratingInfo = getRatingLabel(rating);

  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>
      <HoverCardContent
        side="left"
        align="center"
        className="w-64 p-0 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 pt-3 pb-2 border-b">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">Club Rating</span>
            <span className={cn("text-lg tabular-nums", ratingInfo.className)}>
              {rating.toFixed(1)}
            </span>
          </div>
          <span className={cn("text-xs", ratingInfo.className)}>{ratingInfo.text}</span>
        </div>

        {/* Category breakdown */}
        <div className="px-4 py-3 space-y-2.5">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">
            Category Fit
          </p>
          {categories.map((cat) => {
            const fit = getCategoryFit(cat.weight);
            return (
              <div key={cat.id} className="space-y-0.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">{cat.label}</span>
                  <span className="text-[10px] text-muted-foreground">{fit.label}</span>
                </div>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all duration-500", fit.color)}
                    style={{ width: `${fit.score}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};

export default MyRatingHover;
