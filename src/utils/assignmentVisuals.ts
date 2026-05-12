/**
 * Shared visual tokens for assignment types.
 *
 * Player assignments keep the existing person/green styling.
 * Fixture assignments use a stadium pin in amber to differentiate at a glance.
 */
import { MapPin, User, type LucideIcon } from "lucide-react";

export type AssignmentKind = "player" | "fixture";

export interface AssignmentVisualToken {
  label: string;
  icon: LucideIcon;
  /** Tailwind classes for a small pill/chip background + text. */
  chipClass: string;
  /** Tailwind classes for a solo icon (matches the chip hue). */
  iconClass: string;
  /** Raw HSL accent for inline styles when Tailwind classes won't compose. */
  accentVar: string;
}

export const ASSIGNMENT_VISUALS: Record<AssignmentKind, AssignmentVisualToken> = {
  player: {
    label: "Player assignment",
    icon: User,
    chipClass: "bg-primary/10 text-primary border-primary/20",
    iconClass: "text-primary",
    accentVar: "var(--primary)",
  },
  fixture: {
    label: "Fixture assignment",
    icon: MapPin,
    chipClass: "bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-400",
    iconClass: "text-amber-600 dark:text-amber-400",
    accentVar: "38 92% 50%",
  },
};
