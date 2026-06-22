import { usePlayerTags, type PlayerTag } from "@/hooks/usePlayerTags";
import { cn } from "@/lib/utils";

interface PlayerTagsViewProps {
  playerId: string;
  /** Maximum number of tags to render inline before showing a "+N" overflow chip. */
  max?: number;
  className?: string;
  /** When true, renders nothing if the player has no tags. Defaults to true. */
  hideWhenEmpty?: boolean;
}

/** Pick black/white text for best contrast on a hex background. */
const getContrastingText = (hex: string): string => {
  const c = hex.replace("#", "");
  const full = c.length === 3 ? c.split("").map((x) => x + x).join("") : c;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.6 ? "#000000" : "#FFFFFF";
};

export const PlayerTagPill = ({ tag, className }: { tag: PlayerTag; className?: string }) => (
  <span
    className={cn(
      "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium whitespace-nowrap",
      className
    )}
    style={{ backgroundColor: tag.color, color: getContrastingText(tag.color) }}
    title={tag.label}
  >
    {tag.label}
  </span>
);

/**
 * Read-only display of a player's tags. Use anywhere a player name appears.
 */
export const PlayerTagsView = ({
  playerId,
  max,
  className,
  hideWhenEmpty = true,
}: PlayerTagsViewProps) => {
  const { tags } = usePlayerTags(playerId);

  if (tags.length === 0) {
    if (hideWhenEmpty) return null;
    return <span className={cn("text-xs text-muted-foreground", className)}>—</span>;
  }

  const visible = typeof max === "number" ? tags.slice(0, max) : tags;
  const overflow = tags.length - visible.length;

  return (
    <span className={cn("inline-flex items-center gap-1 flex-wrap", className)}>
      {visible.map((tag) => (
        <PlayerTagPill key={tag.id} tag={tag} />
      ))}
      {overflow > 0 && (
        <span
          className="inline-flex items-center rounded-md border border-border/60 bg-muted/40 px-1 py-0.5 text-[10px] font-medium leading-none text-muted-foreground"
          title={tags.slice(visible.length).map((t) => t.label).join(", ")}
        >
          +{overflow}
        </span>
      )}
    </span>
  );
};

export default PlayerTagsView;
