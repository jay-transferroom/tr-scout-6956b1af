import { useMemo, useState } from "react";
import { ChevronDown, Plus, Trash2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import RecommendationBadge, { RecommendationValue } from "@/components/RecommendationBadge";
import { useRecommendationsActive } from "@/hooks/useRecommendationsActive";
import { useAuth } from "@/contexts/AuthContext";
import {
  usePlayerRecommendations,
  RecommendationHistoryEntry,
} from "@/hooks/usePlayerRecommendations";

const formatHistoryDate = (date: Date): string =>
  date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

const DEFAULT_OPTIONS: RecommendationValue[] = [
  { label: "Sign", colour: "#22C55E" },
  { label: "Monitor", colour: "#EAB308" },
  { label: "Pass", colour: "#EF4444" },
];

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
  playerId,
  options = DEFAULT_OPTIONS,
  currentUserName,
}: PlayerRecommendationControlProps) => {
  const recommendationsActive = useRecommendationsActive();
  const { profile } = useAuth();
  const { value, isLive, attribution, liveHistory, setValue } =
    usePlayerRecommendations(playerId);
  const [historyOpen, setHistoryOpen] = useState(false);

  const signedInName =
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ").trim() ||
    profile?.email ||
    "You";
  const resolvedCurrentName = currentUserName ?? signedInName;

  // Seeded historical entries attributed to the other demo accounts so the
  // demo shows a realistic mix of scouts and a manager having taken actions.
  const seededHistory: RecommendationHistoryEntry[] = useMemo(() => {
    const others = ["Oliver Smith", "Emma Johnson", "Dave Chester"].filter(
      (n) => n !== signedInName
    );
    const pickUser = (i: number) => others[i % others.length] ?? "Oliver Smith";
    return [
      {
        from: { label: "Monitor", colour: "#EAB308" },
        to: { label: "Sign", colour: "#22C55E" },
        user: pickUser(0),
        date: new Date(Date.now() - 1000 * 60 * 60 * 6),
      },
      {
        from: { label: "Pass", colour: "#EF4444" },
        to: { label: "Monitor", colour: "#EAB308" },
        user: pickUser(1),
        date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
      },
      {
        from: null,
        to: { label: "Pass", colour: "#EF4444" },
        user: pickUser(2),
        date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10),
      },
      {
        from: { label: "Monitor", colour: "#EAB308" },
        to: null,
        user: pickUser(3),
        date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 21),
      },
    ];
  }, [signedInName]);

  // Live entries (newest first) on top, seeded mock history below.
  const fullHistory = useMemo(
    () => [...liveHistory, ...seededHistory],
    [liveHistory, seededHistory]
  );

  if (!recommendationsActive) return null;

  const handleSelect = (opt: RecommendationValue) => setValue(opt, resolvedCurrentName);
  const handleClear = () => setValue(null, resolvedCurrentName);

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

      {value && isLive && attribution && (
        <div className="flex flex-col items-start gap-0.5">
          <p className="text-xs text-muted-foreground">
            Set by {attribution.user} · {formatRelative(attribution.date)}
          </p>
          <button
            type="button"
            onClick={() => setHistoryOpen(true)}
            className="text-xs text-muted-foreground underline-offset-2 hover:underline hover:text-foreground focus:outline-none focus-visible:underline"
          >
            View history
          </button>
        </div>
      )}

      {value && !isLive && (
        <button
          type="button"
          onClick={() => setHistoryOpen(true)}
          className="text-xs text-muted-foreground underline-offset-2 hover:underline hover:text-foreground focus:outline-none focus-visible:underline"
        >
          View history
        </button>
      )}

      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Recommendation history</DialogTitle>
          </DialogHeader>
          <ul className="flex flex-col divide-y divide-border">
            {fullHistory.map((entry, idx) => {
              const isLiveEntry = idx < liveHistory.length;
              const dateLabel = isLiveEntry
                ? formatRelative(entry.date)
                : formatHistoryDate(entry.date);
              return (
                <li key={idx} className="py-3 flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-sm">
                    {entry.from ? (
                      <RecommendationBadge value={entry.from} variant="default" />
                    ) : (
                      <span className="text-muted-foreground">Unset</span>
                    )}
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    {entry.to ? (
                      <RecommendationBadge value={entry.to} variant="default" />
                    ) : (
                      <span className="text-muted-foreground">Cleared</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    changed by {entry.user} · {dateLabel}
                  </p>
                </li>
              );
            })}
          </ul>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PlayerRecommendationControl;
