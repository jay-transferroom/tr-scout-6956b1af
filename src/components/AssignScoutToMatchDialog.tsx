import { useMemo, useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, Check, MapPin, Search, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import { useAuth } from "@/contexts/AuthContext";
import { useScouts, type Scout } from "@/hooks/useScouts";
import { useFixtureAssignments } from "@/hooks/useFixtureAssignments";
import { getFixtureId } from "@/types/fixtureAssignment";
import type { FixtureAssignmentPriority } from "@/types/fixtureAssignment";
import { ASSIGNMENT_VISUALS } from "@/utils/assignmentVisuals";

export interface FixtureForAssignment {
  home_team: string;
  away_team: string;
  match_date_utc: string;
  venue?: string | null;
  competition?: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fixture: FixtureForAssignment | null;
}

const scoutLabel = (s: { first_name?: string; last_name?: string; email: string }) =>
  `${s.first_name ?? ""} ${s.last_name ?? ""}`.trim() || s.email;

const initials = (s: { first_name?: string; last_name?: string; email: string }) => {
  const a = (s.first_name ?? s.email[0] ?? "?").charAt(0);
  const b = (s.last_name ?? "").charAt(0);
  return (a + b).toUpperCase();
};

const AssignScoutToMatchDialog = ({ open, onOpenChange, fixture }: Props) => {
  const { user } = useAuth();
  const { data: scouts = [] } = useScouts();
  const { createForFixture, assignedScoutIdsFor } = useFixtureAssignments();
  const fixtureVisual = ASSIGNMENT_VISUALS.fixture;
  const StadiumIcon = fixtureVisual.icon;

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [priority, setPriority] = useState<FixtureAssignmentPriority>("medium");
  const [deadline, setDeadline] = useState<Date | undefined>();
  const [notes, setNotes] = useState("");
  const [search, setSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fixtureId = fixture ? getFixtureId(fixture) : "";
  const alreadyAssignedIds = useMemo(
    () => (fixtureId ? assignedScoutIdsFor(fixtureId) : []),
    [fixtureId, assignedScoutIdsFor]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return scouts;
    return scouts.filter((s) =>
      `${scoutLabel(s)} ${s.email} ${s.role}`.toLowerCase().includes(q)
    );
  }, [scouts, search]);

  const reset = () => {
    setSelectedIds([]);
    setPriority("medium");
    setDeadline(undefined);
    setNotes("");
    setSearch("");
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const toggle = (s: Scout) => {
    if (alreadyAssignedIds.includes(s.id)) return;
    setSelectedIds((prev) =>
      prev.includes(s.id) ? prev.filter((x) => x !== s.id) : [...prev, s.id]
    );
  };

  const handleSubmit = async () => {
    if (!fixture || !user || selectedIds.length === 0) return;
    setSubmitting(true);
    try {
      createForFixture({
        fixtureId,
        scoutIds: selectedIds,
        priority,
        notes: notes.trim() || undefined,
        deadline: deadline ? deadline.toISOString().slice(0, 10) : undefined,
        assignedById: user.id,
      });
      toast.success(
        `Assigned ${selectedIds.length} scout${selectedIds.length > 1 ? "s" : ""} to ${fixture.home_team} vs ${fixture.away_team}`
      );
      handleOpenChange(false);
    } catch (e) {
      console.error(e);
      toast.error("Failed to assign scouts. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!fixture) return null;

  const kickoff = new Date(fixture.match_date_utc);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <StadiumIcon className={cn("h-4 w-4", fixtureVisual.iconClass)} />
            Assign scout to {fixture.home_team} vs {fixture.away_team}
          </DialogTitle>
          <DialogDescription className="flex flex-wrap items-center gap-2 text-xs">
            <span>{format(kickoff, "EEE d MMM, HH:mm")}</span>
            {fixture.venue && <span>· {fixture.venue}</span>}
            {fixture.competition && (
              <Badge variant="secondary" className="ml-1">
                {fixture.competition}
              </Badge>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Scout multi-select */}
          <div className="space-y-2">
            <Label>Scouts</Label>
            {selectedIds.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {selectedIds.map((id) => {
                  const s = scouts.find((x) => x.id === id);
                  if (!s) return null;
                  return (
                    <Badge key={id} variant="secondary" className="gap-1 pr-1">
                      {scoutLabel(s)}
                      <button
                        type="button"
                        onClick={() => toggle(s)}
                        className="rounded-sm hover:bg-muted-foreground/20"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  );
                })}
              </div>
            )}
            <div className="rounded-md border">
              <div className="flex items-center gap-2 border-b px-2">
                <Search className="h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search scouts…"
                  className="h-8 border-0 px-0 shadow-none focus-visible:ring-0"
                />
              </div>
              <div className="max-h-48 overflow-y-auto p-1">
                {filtered.length === 0 && (
                  <p className="px-2 py-3 text-center text-xs text-muted-foreground">
                    No scouts found.
                  </p>
                )}
                {filtered.map((s) => {
                  const already = alreadyAssignedIds.includes(s.id);
                  const checked = selectedIds.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      disabled={already}
                      onClick={() => toggle(s)}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm",
                        already
                          ? "cursor-not-allowed opacity-60"
                          : "hover:bg-accent",
                        checked && "bg-accent"
                      )}
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold">
                        {initials(s)}
                      </span>
                      <span className="flex-1 truncate">
                        <span className="block truncate font-medium leading-tight">
                          {scoutLabel(s)}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground capitalize">
                          {s.role}
                        </span>
                      </span>
                      {already ? (
                        <Badge variant="outline" className="text-[10px]">
                          Already assigned
                        </Badge>
                      ) : checked ? (
                        <Check className="h-4 w-4 text-primary" />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label>Priority</Label>
            <RadioGroup
              value={priority}
              onValueChange={(v) => setPriority(v as FixtureAssignmentPriority)}
              className="flex gap-4"
            >
              {(["low", "medium", "high"] as const).map((p) => (
                <label
                  key={p}
                  className="flex cursor-pointer items-center gap-2 text-sm capitalize"
                >
                  <RadioGroupItem value={p} />
                  {p}
                </label>
              ))}
            </RadioGroup>
          </div>

          {/* Deadline */}
          <div className="space-y-2">
            <Label>Deadline (optional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !deadline && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {deadline ? format(deadline, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={deadline}
                  onSelect={setDeadline}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="focus-notes">Focus / notes (optional)</Label>
            <Textarea
              id="focus-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What should the scout focus on?"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={selectedIds.length === 0 || submitting}
          >
            <MapPin className="mr-1.5 h-4 w-4" />
            Assign{selectedIds.length > 0 ? ` (${selectedIds.length})` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AssignScoutToMatchDialog;
