import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useFixtureAssignments } from "@/hooks/useFixtureAssignments";
import { useFixturesData } from "@/hooks/useFixturesData";
import { useScouts } from "@/hooks/useScouts";
import { getFixtureId, type FixtureAssignmentStatus } from "@/types/fixtureAssignment";
import MatchAssignmentCard, { type MatchAssignmentCardData } from "./MatchAssignmentCard";
import MatchAssignmentDetailsSheet from "./MatchAssignmentDetailsSheet";

interface Props {
  selectedScout: string;
  searchTerm: string;
}

const COLUMNS: { id: FixtureAssignmentStatus; title: string; color: string }[] = [
  { id: "pending", title: "Pending", color: "bg-orange-500" },
  { id: "in_progress", title: "In Progress", color: "bg-blue-500" },
  { id: "completed", title: "Completed", color: "bg-green-500" },
];

const MatchAssignmentsBoard = ({ selectedScout, searchTerm }: Props) => {
  const { assignments, updateAssignment, resolveScout, resolvedScoutId } =
    useFixtureAssignments();
  const { data: fixtures = [] } = useFixturesData();
  const { data: scouts = [] } = useScouts();

  const [selected, setSelected] = useState<MatchAssignmentCardData | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const fixtureMap = useMemo(() => {
    const m = new Map<string, (typeof fixtures)[number]>();
    fixtures.forEach((f) => m.set(getFixtureId(f), f));
    return m;
  }, [fixtures]);

  const cards = useMemo<MatchAssignmentCardData[]>(() => {
    const q = searchTerm.toLowerCase().trim();
    return assignments
      .filter((a) => {
        if (selectedScout !== "all" && resolvedScoutId(a) !== selectedScout) return false;
        if (!q) return true;
        const f = fixtureMap.get(a.fixtureId);
        const home = f?.home_team?.toLowerCase() ?? "";
        const away = f?.away_team?.toLowerCase() ?? "";
        return home.includes(q) || away.includes(q);
      })
      .map((a) => ({
        assignment: a,
        fixture: fixtureMap.get(a.fixtureId),
        scout: resolveScout(a.scoutId) ?? scouts.find((s) => s.id === resolvedScoutId(a)),
      }));
  }, [assignments, fixtureMap, resolveScout, resolvedScoutId, scouts, selectedScout, searchTerm]);

  const grouped = useMemo(() => {
    const g: Record<FixtureAssignmentStatus, MatchAssignmentCardData[]> = {
      pending: [],
      in_progress: [],
      completed: [],
    };
    cards.forEach((c) => g[c.assignment.status].push(c));
    return g;
  }, [cards]);

  const handleDrop = (status: FixtureAssignmentStatus) => {
    if (!draggingId) return;
    const current = assignments.find((a) => a.id === draggingId);
    if (current && current.status !== status) {
      updateAssignment(draggingId, { status });
      toast.success(`Moved to ${status.replace("_", " ")}`);
    }
    setDraggingId(null);
  };

  const openCard = (card: MatchAssignmentCardData) => {
    setSelected(card);
    setSheetOpen(true);
  };

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <Badge variant="secondary" className="text-xs">{cards.length} total</Badge>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {COLUMNS.map((col) => (
          <div key={col.id} className="flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-2.5 h-2.5 rounded-full ${col.color}`} />
              <h3 className="font-medium text-sm">{col.title}</h3>
              <Badge variant="secondary" className="text-xs">
                {grouped[col.id].length}
              </Badge>
            </div>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
              }}
              onDrop={(e) => {
                e.preventDefault();
                handleDrop(col.id);
              }}
              className={`flex-1 min-h-[200px] rounded-lg p-2 bg-muted/50 border-2 transition-colors ${
                draggingId ? "border-primary/40" : "border-transparent"
              }`}
            >
              {grouped[col.id].length > 0 ? (
                grouped[col.id].map((card) => (
                  <MatchAssignmentCard
                    key={card.assignment.id}
                    data={card}
                    draggable
                    onDragStart={() => setDraggingId(card.assignment.id)}
                    onClick={() => openCard(card)}
                  />
                ))
              ) : (
                <div className="flex items-center justify-center h-24 text-muted-foreground text-xs border-2 border-dashed border-muted-foreground/20 rounded-lg p-4">
                  No match assignments
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <MatchAssignmentDetailsSheet
        data={selected}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </div>
  );
};

export default MatchAssignmentsBoard;
