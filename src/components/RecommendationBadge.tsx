import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useRecommendationsActive } from "@/hooks/useRecommendationsActive";

export interface RecommendationValue {
  label: string;
  colour: string; // hex e.g. "#22C55E"
}

export type RecommendationBadgeVariant = "default" | "compact" | "dot";

interface RecommendationBadgeProps {
  value: RecommendationValue;
  variant?: RecommendationBadgeVariant;
  className?: string;
}

/** Pick black/white text for best contrast on a hex background. */
const getContrastingText = (hex: string): string => {
  const c = hex.replace("#", "");
  const full = c.length === 3 ? c.split("").map((x) => x + x).join("") : c;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  // Relative luminance (sRGB)
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.6 ? "#000000" : "#FFFFFF";
};

const abbreviate = (label: string): string => {
  const words = label.trim().split(/\s+/);
  if (words.length === 1) return label.slice(0, 3).toUpperCase();
  return words.map((w) => w[0]).join("").slice(0, 3).toUpperCase();
};

export const RecommendationBadge = ({
  value,
  variant = "default",
  className,
}: RecommendationBadgeProps) => {
  const recommendationsActive = useRecommendationsActive();
  if (!recommendationsActive) return null;
  const { label, colour } = value;

  if (variant === "dot") {
    return (
      <TooltipProvider delayDuration={150}>
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              role="img"
              aria-label={label}
              className={cn(
                "inline-block h-2.5 w-2.5 rounded-full ring-1 ring-border/40 align-middle",
                className
              )}
              style={{ backgroundColor: colour }}
            />
          </TooltipTrigger>
          <TooltipContent>{label}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (variant === "compact") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-md border border-border/60 bg-muted/40 px-1.5 py-0.5 text-xs font-medium",
          className
        )}
        title={label}
      >
        <span
          className="inline-block h-2 w-2 rounded-full shrink-0"
          style={{ backgroundColor: colour }}
        />
        {abbreviate(label)}
      </span>
    );
  }

  // default
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold",
        className
      )}
      style={{ backgroundColor: colour, color: getContrastingText(colour) }}
    >
      {label}
    </span>
  );
};

export default RecommendationBadge;
