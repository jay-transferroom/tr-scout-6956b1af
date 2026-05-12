import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useFixtureAssignments } from "@/hooks/useFixtureAssignments";
import { getFixtureId } from "@/types/fixtureAssignment";
import { ASSIGNMENT_VISUALS } from "@/utils/assignmentVisuals";
import { useAuth } from "@/contexts/AuthContext";
import AssignScoutToMatchDialog, {
  type FixtureForAssignment,
} from "@/components/AssignScoutToMatchDialog";

const initialsFor = (firstName?: string, lastName?: string, email?: string) => {
  if (firstName && lastName) return `${firstName[0]}${lastName[0]}`.toUpperCase();
  if (firstName) return firstName.slice(0, 2).toUpperCase();
  if (email) return email.slice(0, 2).toUpperCase();
  return "??";
};

interface Props {
  fixture: FixtureForAssignment;
  /** "compact" for cards/footer, "default" for row action cluster. */
  size?: "compact" | "default";
  /** Stop event bubbling — useful inside clickable rows/cards. */
  stopPropagation?: boolean;
  className?: string;
}

const FixtureAssignScoutControl: React.FC<Props> = ({
  fixture,
  size = "default",
  stopPropagation = true,
  className,
}) => {
  const [open, setOpen] = useState(false);
  const { assignmentsForFixture, resolveScout } = useFixtureAssignments();
  const { profile } = useAuth();
  const visual = ASSIGNMENT_VISUALS.fixture;
  const Icon = visual.icon;

  const fixtureId = getFixtureId(fixture);
  const assignments = assignmentsForFixture(fixtureId);
  const count = assignments.length;

  // Manager-only affordance. Scouts (or unauthenticated) never see the trigger.
  const canAssign = profile?.role === "recruitment" || profile?.role === "director";
  if (!canAssign) return null;

  const handleClick = (e: React.MouseEvent) => {
    if (stopPropagation) e.stopPropagation();
    setOpen(true);
  };

  const compact = size === "compact";

  // Chip mode — at least one scout already assigned
  if (count > 0) {
    const initials = assignments.slice(0, 3).map((a) => {
      const s = resolveScout(a.scoutId);
      return initialsFor(s?.first_name, s?.last_name, s?.email);
    });
    return (
      <>
        <button
          type="button"
          onClick={handleClick}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md border transition-colors shrink-0",
            visual.chipClass,
            "hover:brightness-95",
            compact ? "h-7 px-2 text-xs" : "h-7 px-2 text-xs",
            className
          )}
          aria-label={`${count} scout${count > 1 ? "s" : ""} assigned to match`}
        >
          <Icon className={cn("h-3.5 w-3.5", visual.iconClass)} />
          <span className="flex -space-x-1">
            {initials.map((init, i) => (
              <span
                key={i}
                className="flex h-4 w-4 items-center justify-center rounded-full border border-background bg-background/80 text-[8px] font-semibold text-foreground"
              >
                {init}
              </span>
            ))}
          </span>
          <span className="font-medium">
            {count} scout{count > 1 ? "s" : ""}{compact ? "" : " on match"}
          </span>
        </button>
        <AssignScoutToMatchDialog
          open={open}
          onOpenChange={setOpen}
          fixture={fixture}
        />
      </>
    );
  }

  // Default mode — no assignments yet, render an "Assign Scout" CTA
  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={handleClick}
        className={cn(
          "h-7 gap-1 text-xs shrink-0",
          visual.iconClass,
          "border-amber-500/30 hover:bg-amber-500/10",
          className
        )}
      >
        <Icon className="h-3.5 w-3.5" />
        <span className={compact ? "" : "hidden sm:inline"}>Assign Scout</span>
      </Button>
      <AssignScoutToMatchDialog
        open={open}
        onOpenChange={setOpen}
        fixture={fixture}
      />
    </>
  );
};

export default FixtureAssignScoutControl;
