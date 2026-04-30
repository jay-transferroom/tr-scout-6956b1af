import { usePlayerRecommendations } from "@/hooks/usePlayerRecommendations";
import { RecommendationBadge } from "@/components/RecommendationBadge";
import { useRecommendationsActive } from "@/hooks/useRecommendationsActive";
import { cn } from "@/lib/utils";

interface PlayerRecommendationViewProps {
  playerId: string;
  variant?: "default" | "compact" | "dot";
  className?: string;
  /** Render this when there is no recommendation. Defaults to a muted dash. */
  fallback?: React.ReactNode;
  /** When true, returns null entirely if recommendations are globally disabled. */
  hideWhenInactive?: boolean;
}

/**
 * Read-only display of a player's effective recommendation (live → mock).
 * Use this in any list/table column. For the interactive control, use
 * `PlayerRecommendationControl` instead.
 */
export const PlayerRecommendationView = ({
  playerId,
  variant = "compact",
  className,
  fallback,
  hideWhenInactive = true,
}: PlayerRecommendationViewProps) => {
  const recommendationsActive = useRecommendationsActive();
  const { value } = usePlayerRecommendations(playerId);

  if (hideWhenInactive && !recommendationsActive) return null;

  if (!value) {
    return (
      <span className={cn("text-xs text-muted-foreground", className)}>
        {fallback ?? "—"}
      </span>
    );
  }

  return (
    <span className={className}>
      <RecommendationBadge value={value} variant={variant} />
    </span>
  );
};

export default PlayerRecommendationView;
