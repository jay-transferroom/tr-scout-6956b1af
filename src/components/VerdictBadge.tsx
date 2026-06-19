import { Badge } from "@/components/ui/badge";
import { getVerdictOption } from "@/types/verdict";
import RecommendationBadge, { RecommendationBadgeVariant } from "@/components/RecommendationBadge";

interface VerdictBadgeProps {
  verdict: string | null;
  variant?: RecommendationBadgeVariant;
  className?: string;
}

/**
 * Renders a report's recommendation (legacy: "verdict") using the unified
 * RecommendationBadge presentation so it visually matches recommendations
 * shown elsewhere in the product (shortlists, squad view, calendar, etc.).
 */
const VerdictBadge = ({ verdict, variant = "default", className = "" }: VerdictBadgeProps) => {
  if (!verdict) return null;

  const option = getVerdictOption(verdict);
  if (!option) {
    return <Badge variant="outline" className={className}>{verdict}</Badge>;
  }

  return (
    <RecommendationBadge
      value={{ label: option.label, colour: option.hexColor }}
      variant={variant}
      className={className}
    />
  );
};

export default VerdictBadge;
