import { useState } from "react";
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import RecommendationBadge, { RecommendationValue } from "@/components/RecommendationBadge";
import { useRecommendationsActive } from "@/hooks/useRecommendationsActive";

const DEFAULT_OPTIONS: RecommendationValue[] = [
  { label: "Sign", colour: "#22C55E" },
  { label: "Monitor", colour: "#EAB308" },
  { label: "Pass", colour: "#EF4444" },
];

interface Attribution {
  user: string;
  date: Date;
}

const formatRelative = (date: Date): string => {
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
};

interface PlayerRecommendationControlProps {
  playerId: string;
  options?: RecommendationValue[];
  currentUserName?: string;
}

export const PlayerRecommendationControl = ({
  options = DEFAULT_OPTIONS,
  currentUserName = "You",
}: PlayerRecommendationControlProps) => {
  const recommendationsActive = useRecommendationsActive();
  const [value, setValue] = useState<RecommendationValue | null>(null);
  const [attribution, setAttribution] = useState<Attribution | null>(null);

  if (!recommendationsActive) return null;

  const handleSelect = (opt: RecommendationValue) => {
    setValue(opt);
    setAttribution({ user: currentUserName, date: new Date() });
  };

  const handleClear = () => {
    setValue(null);
    setAttribution(null);
  };

  return (
    <div className="flex flex-col items-start gap-1">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {value ? (
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-md hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Change recommendation"
            >
              <RecommendationBadge value={value} variant="default" />
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          ) : (
            <Button variant="outline" size="xs" className="gap-1">
              <Plus className="h-3 w-3" />
              Set recommendation
              <ChevronDown className="h-3 w-3 opacity-60" />
            </Button>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          {options.map((opt) => (
            <DropdownMenuItem
              key={opt.label}
              onClick={() => handleSelect(opt)}
              className="gap-2"
            >
              <span
                className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
                style={{ backgroundColor: opt.colour }}
              />
              <span>{opt.label}</span>
            </DropdownMenuItem>
          ))}
          {value && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleClear}
                className="gap-2 text-destructive focus:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Clear recommendation
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {value && attribution && (
        <p className="text-xs text-muted-foreground">
          Set by {attribution.user} · {formatRelative(attribution.date)}
        </p>
      )}
    </div>
  );
};

export default PlayerRecommendationControl;
