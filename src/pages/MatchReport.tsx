import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { format } from "date-fns";
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Check,
  MapPin,
  Plus,
  Search,
  Trash2,
  Users,
  Eye,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ClubBadge } from "@/components/ui/club-badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

import { useAuth } from "@/contexts/AuthContext";
import { useFixtureAssignments } from "@/hooks/useFixtureAssignments";
import { useFixturesData } from "@/hooks/useFixturesData";
import { useUnifiedPlayersData } from "@/hooks/useUnifiedPlayersData";
import { useShortlists } from "@/hooks/useShortlists";
import { newId } from "@/utils/mockFixtureAssignments";
import { getFixtureId, type MatchReport, type PlayerObservation } from "@/types/fixtureAssignment";
import type { Player } from "@/types/player";

const MAX_PLAYERS = 11;

interface DraftReport {
  overallNotes: string;
  homeScore: string;
  awayScore: string;
  weather: string;
  attendance: string;
  observations: PlayerObservation[];
}

const emptyDraft: DraftReport = {
  overallNotes: "",
  homeScore: "",
  awayScore: "",
  weather: "",
  attendance: "",
  observations: [],
};

const toDraft = (r?: MatchReport): DraftReport =>
  r
    ? {
        overallNotes: r.overallNotes ?? "",
        homeScore: r.homeScore != null ? String(r.homeScore) : "",
        awayScore: r.awayScore != null ? String(r.awayScore) : "",
        weather: r.weather ?? "",
        attendance: r.attendance != null ? String(r.attendance) : "",
        observations: r.playerObservations ?? [],
      }
    : { ...emptyDraft };

const playerToObservation = (p: Player, rating = 0, notes = ""): PlayerObservation => ({
  playerId: String(p.id),
  playerName: p.name,
  playerClub: p.club,
  playerPositions: p.positions,
  playerImage: p.image,
  rating,
  notes,
});

const MatchReportPage = () => {
  const { fixtureAssignmentId = "" } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const {
    getAssignment,
    getReportByAssignmentId,
    upsertReport,
    updateAssignment,
  } = useFixtureAssignments();
  const { data: fixtures = [] } = useFixturesData();
  const { data: players = [] } = useUnifiedPlayersData();
  const { shortlists } = useShortlists();

  const assignment = getAssignment(fixtureAssignmentId);
  const existingReport = getReportByAssignmentId(fixtureAssignmentId);

  const fixture = useMemo(
    () => (assignment ? fixtures.find((f) => getFixtureId(f) === assignment.fixtureId) : undefined),
    [assignment, fixtures]
  );

  const [draft, setDraft] = useState<DraftReport>(() => toDraft(existingReport));
  const [editing, setEditing] = useState(() => existingReport?.status !== "submitted");
  const [savedAt, setSavedAt] = useState<Date | null>(
    existingReport?.updatedAt ? new Date(existingReport.updatedAt) : null
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerSearch, setPickerSearch] = useState("");
  const reportIdRef = useRef<string>(existingReport?.id ?? newId("mr"));
  const initializedRef = useRef(false);
  const dirtyRef = useRef(false);

  // Re-sync when an assignment+report appears (data loaded async).
  useEffect(() => {
    if (initializedRef.current) return;
    if (existingReport) {
      setDraft(toDraft(existingReport));
      reportIdRef.current = existingReport.id;
      setEditing(existingReport.status !== "submitted");
      setSavedAt(existingReport.updatedAt ? new Date(existingReport.updatedAt) : null);
      initializedRef.current = true;
    } else if (assignment) {
      initializedRef.current = true;
    }
  }, [existingReport, assignment]);

  // Fixture players helper
  const homeAwayClubs = useMemo(() => {
    if (!fixture) return new Set<string>();
    return new Set([fixture.home_team, fixture.away_team]);
  }, [fixture]);

  const shortlistedForFixture = useMemo(() => {
    if (!fixture || !players.length) return [];
    const ids = new Set<string>();
    shortlists.forEach((sl) => sl.playerIds.forEach((pid) => ids.add(String(pid))));
    return players.filter(
      (p) => ids.has(String(p.id)) && (p.club === fixture.home_team || p.club === fixture.away_team)
    );
  }, [shortlists, players, fixture]);

  const availablePlayers = useMemo(() => {
    const taken = new Set(draft.observations.map((o) => o.playerId));
    const q = pickerSearch.trim().toLowerCase();
    return players
      .filter((p) => !taken.has(String(p.id)))
      .filter((p) => {
        if (!q) return true;
        return (
          p.name.toLowerCase().includes(q) ||
          (p.club ?? "").toLowerCase().includes(q) ||
          (p.positions ?? []).join(" ").toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        const aHA = homeAwayClubs.has(a.club) ? 0 : 1;
        const bHA = homeAwayClubs.has(b.club) ? 0 : 1;
        if (aHA !== bHA) return aHA - bHA;
        return a.name.localeCompare(b.name);
      })
      .slice(0, 50);
  }, [players, draft.observations, pickerSearch, homeAwayClubs]);

  const persist = (next: DraftReport, options?: { submit?: boolean }) => {
    if (!assignment || !user) return;
    const submitting = options?.submit === true;
    const now = new Date().toISOString();
    const report: MatchReport = {
      id: reportIdRef.current,
      fixtureAssignmentId: assignment.id,
      fixtureId: assignment.fixtureId,
      scoutId: user.id,
      overallNotes: next.overallNotes,
      homeScore: next.homeScore === "" ? null : Number(next.homeScore),
      awayScore: next.awayScore === "" ? null : Number(next.awayScore),
      weather: next.weather || undefined,
      attendance: next.attendance === "" ? null : Number(next.attendance),
      playerObservations: next.observations,
      status: submitting ? "submitted" : "draft",
      updatedAt: now,
      submittedAt: submitting ? now : existingReport?.submittedAt,
    };
    upsertReport(report);
    setSavedAt(new Date(now));
    // Mark in_progress on first edit
    if (!submitting && assignment.status === "pending") {
      updateAssignment(assignment.id, { status: "in_progress" });
    }
  };

  // Auto-save (debounced) on draft changes
  useEffect(() => {
    if (!dirtyRef.current) return;
    if (!editing) return;
    const t = setTimeout(() => persist(draft), 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, editing]);

  const update = <K extends keyof DraftReport>(key: K, value: DraftReport[K]) => {
    dirtyRef.current = true;
    setDraft((d) => ({ ...d, [key]: value }));
  };

  const updateObservation = (playerId: string, patch: Partial<PlayerObservation>) => {
    dirtyRef.current = true;
    setDraft((d) => ({
      ...d,
      observations: d.observations.map((o) => (o.playerId === playerId ? { ...o, ...patch } : o)),
    }));
  };

  const addPlayer = (p: Player) => {
    if (draft.observations.length >= MAX_PLAYERS) {
      toast.error(`You can add up to ${MAX_PLAYERS} players per report`);
      return;
    }
    if (draft.observations.some((o) => o.playerId === String(p.id))) return;
    dirtyRef.current = true;
    setDraft((d) => ({ ...d, observations: [...d.observations, playerToObservation(p)] }));
  };

  const removePlayer = (playerId: string) => {
    dirtyRef.current = true;
    setDraft((d) => ({
      ...d,
      observations: d.observations.filter((o) => o.playerId !== playerId),
    }));
  };

  const addAllShortlisted = () => {
    const remaining = MAX_PLAYERS - draft.observations.length;
    const toAdd = shortlistedForFixture
      .filter((p) => !draft.observations.some((o) => o.playerId === String(p.id)))
      .slice(0, remaining);
    if (toAdd.length === 0) return;
    dirtyRef.current = true;
    setDraft((d) => ({
      ...d,
      observations: [...d.observations, ...toAdd.map((p) => playerToObservation(p))],
    }));
    toast.success(`Added ${toAdd.length} shortlisted player${toAdd.length > 1 ? "s" : ""}`);
  };

  const canSubmit = useMemo(() => {
    if (!draft.overallNotes.trim()) return false;
    return draft.observations.some((o) => o.rating > 0 && o.notes.trim().length > 0);
  }, [draft]);

  const handleSubmit = () => {
    if (!canSubmit || !assignment) return;
    persist(draft, { submit: true });
    updateAssignment(assignment.id, {
      status: "completed",
      matchReportId: reportIdRef.current,
    });
    toast.success("Match report submitted");
    navigate("/assigned-players");
  };

  const handleSaveDraft = () => {
    persist(draft);
    toast.success("Draft saved");
  };

  const handleReopen = () => {
    if (!assignment) return;
    updateAssignment(assignment.id, { status: "in_progress" });
    setEditing(true);
    setDraft(toDraft(existingReport));
    toast.success("Report re-opened");
  };

  if (!assignment) {
    return (
      <div className="container mx-auto py-8 max-w-3xl px-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Match assignment not found.
          </CardContent>
        </Card>
      </div>
    );
  }

  const home = fixture?.home_team ?? "Home";
  const away = fixture?.away_team ?? "Away";
  const kickoff = fixture ? new Date(fixture.match_date_utc) : null;
  const isSubmitted = !editing && existingReport?.status === "submitted";
  const scoutName =
    `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim() || user?.email || "Scout";

  return (
    <div className="container mx-auto py-4 sm:py-8 max-w-4xl px-2 sm:px-4">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-3">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back
      </Button>

      {/* Header strip */}
      <Card className="mb-6 border-l-4" style={{ borderLeftColor: "hsl(38 92% 50%)" }}>
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 text-xs text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                Match report
              </div>
              <div className="flex items-center gap-3 mb-2">
                <ClubBadge clubName={home} size="md" />
                <h1 className="text-xl sm:text-2xl font-bold">
                  {home} <span className="text-muted-foreground">vs</span> {away}
                </h1>
                <ClubBadge clubName={away} size="md" />
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                {kickoff && (
                  <span className="inline-flex items-center gap-1">
                    <CalendarIcon className="h-3 w-3" /> {format(kickoff, "EEE d MMM yyyy, HH:mm")}
                  </span>
                )}
                {fixture?.venue && <span>· {fixture.venue}</span>}
                {fixture?.competition && (
                  <Badge variant="secondary" className="ml-1 text-[10px]">
                    {fixture.competition}
                  </Badge>
                )}
              </div>
              <div className="mt-3 text-sm">
                <span className="text-muted-foreground">Scout: </span>
                <span className="font-medium">{scoutName}</span>
              </div>
              {assignment.notes && (
                <blockquote className="mt-3 border-l-2 border-amber-500/40 bg-amber-500/5 px-3 py-2 text-xs italic text-muted-foreground rounded-sm">
                  <span className="font-medium not-italic text-foreground">Manager's focus: </span>
                  {assignment.notes}
                </blockquote>
              )}
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge
                variant={isSubmitted ? "default" : "secondary"}
                className={cn("uppercase text-[10px]", isSubmitted && "bg-green-600 hover:bg-green-600")}
              >
                {isSubmitted ? "Submitted" : "Draft"}
              </Badge>
              {isSubmitted && (
                <Button size="sm" variant="outline" onClick={handleReopen}>
                  <Pencil className="h-3.5 w-3.5 mr-1" /> Re-open
                </Button>
              )}
              {editing && savedAt && (
                <span className="text-[11px] text-muted-foreground">
                  Draft saved {format(savedAt, "HH:mm:ss")}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <fieldset disabled={!editing} className={cn(!editing && "opacity-95")}>
        {/* Match Overview */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <h2 className="text-lg font-semibold">Match Overview</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="overall">
                Overall observations <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="overall"
                rows={5}
                placeholder="Tactics, conditions, key moments, surprises…"
                value={draft.overallNotes}
                onChange={(e) => update("overallNotes", e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="hs">Home score</Label>
                <Input
                  id="hs"
                  type="number"
                  min={0}
                  value={draft.homeScore}
                  onChange={(e) => update("homeScore", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="as">Away score</Label>
                <Input
                  id="as"
                  type="number"
                  min={0}
                  value={draft.awayScore}
                  onChange={(e) => update("awayScore", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="weather">Weather</Label>
                <Input
                  id="weather"
                  placeholder="e.g. Light rain"
                  value={draft.weather}
                  onChange={(e) => update("weather", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="attendance">Attendance</Label>
                <Input
                  id="attendance"
                  type="number"
                  min={0}
                  value={draft.attendance}
                  onChange={(e) => update("attendance", e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Player Observations */}
        <Card className="mb-6">
          <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
            <div>
              <h2 className="text-lg font-semibold">Player Observations</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {draft.observations.length}/{MAX_PLAYERS} players
              </p>
            </div>
            {editing && (
              <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    size="sm"
                    disabled={draft.observations.length >= MAX_PLAYERS}
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add player
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[360px] p-0" align="end">
                  <Command shouldFilter={false}>
                    <div className="flex items-center border-b px-2">
                      <Search className="h-3.5 w-3.5 text-muted-foreground" />
                      <CommandInput
                        value={pickerSearch}
                        onValueChange={setPickerSearch}
                        placeholder="Search players who appeared…"
                        className="border-0 focus:ring-0"
                      />
                    </div>
                    <CommandList className="max-h-72">
                      <CommandEmpty>No players found.</CommandEmpty>
                      <CommandGroup>
                        {availablePlayers.map((p) => (
                          <CommandItem
                            key={String(p.id)}
                            onSelect={() => {
                              addPlayer(p);
                              setPickerSearch("");
                            }}
                            className="gap-2"
                          >
                            <Avatar className="h-7 w-7">
                              <AvatarImage src={p.image} />
                              <AvatarFallback className="text-[10px]">
                                {p.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium truncate">{p.name}</div>
                              <div className="text-[11px] text-muted-foreground truncate">
                                {p.club} · {p.positions?.join(", ")}
                              </div>
                            </div>
                            {homeAwayClubs.has(p.club) && (
                              <Badge variant="secondary" className="text-[10px]">
                                In match
                              </Badge>
                            )}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            {editing && shortlistedForFixture.length > 0 && (
              <div className="flex items-center justify-between rounded-md border bg-muted/40 px-3 py-2">
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {shortlistedForFixture.length} shortlisted player
                    {shortlistedForFixture.length > 1 ? "s" : ""} for this fixture
                  </span>
                </div>
                <Button size="sm" variant="outline" onClick={addAllShortlisted}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add all
                </Button>
              </div>
            )}

            {draft.observations.length === 0 ? (
              <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
                No players added yet. Use "Add player" to start capturing observations.
              </div>
            ) : (
              draft.observations.map((o) => (
                <div key={o.playerId} className="rounded-md border bg-muted/30 p-3">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={o.playerImage} />
                      <AvatarFallback className="text-xs">
                        {(o.playerName ?? "?").split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0">
                          <div className="font-medium truncate">{o.playerName}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            {o.playerClub} · {o.playerPositions?.join(", ")}
                          </div>
                        </div>
                        {editing && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                            onClick={() => removePlayer(o.playerId)}
                            aria-label="Remove player"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      <div className="mt-3 space-y-3">
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <Label className="text-xs text-muted-foreground">Rating</Label>
                            <Badge variant="rating" className="text-xs">
                              {o.rating || "—"}/10
                            </Badge>
                          </div>
                          <Slider
                            min={0}
                            max={10}
                            step={1}
                            value={[o.rating]}
                            onValueChange={(v) => updateObservation(o.playerId, { rating: v[0] })}
                            disabled={!editing}
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">
                            Notes {o.rating > 0 && <span className="text-destructive">*</span>}
                          </Label>
                          <Textarea
                            rows={2}
                            placeholder="What stood out?"
                            value={o.notes}
                            onChange={(e) => updateObservation(o.playerId, { notes: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </fieldset>

      {/* Footer actions */}
      {editing ? (
        <div className="sticky bottom-2 z-10">
          <div className="rounded-lg border bg-background/95 backdrop-blur p-3 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1 text-xs text-muted-foreground">
              {savedAt
                ? `Auto-saved ${format(savedAt, "HH:mm:ss")}`
                : "Changes are saved automatically as a draft."}
            </div>
            <Button variant="outline" onClick={handleSaveDraft}>
              Save draft
            </Button>
            <Button onClick={handleSubmit} disabled={!canSubmit}>
              <Check className="h-4 w-4 mr-1" /> Submit Report
            </Button>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground flex items-center gap-2">
          <Eye className="h-4 w-4" />
          Read-only view. Re-open the report to make changes.
        </div>
      )}
    </div>
  );
};

export default MatchReportPage;
