import { useMemo, useState } from "react";
import { format } from "date-fns";
import { ChevronDown, Calendar as CalendarIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ClubBadge } from "@/components/ui/club-badge";
import { Table, TableBody } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { ReportWithPlayer } from "@/types/report";
import ReportRow from "./ReportRow";
import ReportsTableHeader from "./ReportsTableHeader";
import { DEMO_MATCH_REPORTS } from "@/utils/matchViewDemoData";

interface MatchReportsTableProps {
  reports: ReportWithPlayer[];
  onViewReport: (id: string) => void;
  onEditReport?: (id: string) => void;
  onDeleteReport: (id: string, name: string) => void;
  showRecommendation?: boolean;
}

interface FixtureGroup {
  key: string;
  homeTeam: string;
  awayTeam: string;
  date: string | null;
  competition?: string;
  reports: ReportWithPlayer[];
  isDemo?: boolean;
}

const getFixtureForReport = (
  r: ReportWithPlayer
): Omit<FixtureGroup, "reports"> | null => {
  const mc = r.matchContext;
  if (!mc) return null;
  const date = mc.date || null;
  const home = mc.isManual ? mc.homeTeam || "" : r.player?.club || "";
  const away = mc.isManual ? mc.awayTeam || "" : mc.opposition || "";
  if (!home || !away) return null;
  const dateKey = date ? format(new Date(date), "yyyy-MM-dd") : "no-date";
  return {
    key: `${home}|${away}|${dateKey}`,
    homeTeam: home,
    awayTeam: away,
    date,
    competition: mc.competition,
  };
};

const MatchReportsTable = ({
  reports = [],
  onViewReport,
  onEditReport,
  onDeleteReport,
}: MatchReportsTableProps) => {
  const { user } = useAuth();

  const groups = useMemo<FixtureGroup[]>(() => {
    const map = new Map<string, FixtureGroup>();

    // Seed with demo fixture (Brighton vs Man Utd)
    const demoMeta = getFixtureForReport(DEMO_MATCH_REPORTS[0]);
    if (demoMeta) {
      map.set(demoMeta.key, {
        ...demoMeta,
        reports: [...DEMO_MATCH_REPORTS],
        isDemo: true,
      });
    }

    reports.forEach((r) => {
      const meta = getFixtureForReport(r);
      if (!meta) return;
      const existing = map.get(meta.key);
      if (existing) {
        existing.reports.push(r);
        existing.isDemo = false;
      } else {
        map.set(meta.key, { ...meta, reports: [r] });
      }
    });

    return Array.from(map.values()).sort((a, b) => {
      const ta = a.date ? new Date(a.date).getTime() : 0;
      const tb = b.date ? new Date(b.date).getTime() : 0;
      return tb - ta;
    });
  }, [reports]);

  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    // Default-expand the first (most recent) group so the populated state is visible
    return groups.length > 0 ? { [groups[0].key]: true } : {};
  });

  const toggle = (key: string) =>
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

  if (groups.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg font-medium mb-1">No match reports yet</p>
        <p className="text-sm">
          Create match reports from the Calendar page by clicking on a fixture.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {groups.map((group) => {
        const isOpen = !!expanded[group.key];
        return (
          <div
            key={group.key}
            className="rounded-md border bg-card overflow-hidden"
          >
            <button
              type="button"
              onClick={() => toggle(group.key)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40",
                isOpen && "bg-muted/30"
              )}
              aria-expanded={isOpen}
            >
              <ChevronDown
                className={cn(
                  "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                  isOpen && "rotate-180"
                )}
              />

              <div className="flex items-center gap-2 min-w-0 flex-1">
                <ClubBadge clubName={group.homeTeam} size="sm" />
                <span className="text-sm font-semibold truncate">
                  {group.homeTeam}
                </span>
                <span className="text-xs text-muted-foreground px-1">vs</span>
                <span className="text-sm font-semibold truncate">
                  {group.awayTeam}
                </span>
                <ClubBadge clubName={group.awayTeam} size="sm" />
              </div>

              {group.date && (
                <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
                  <CalendarIcon className="h-3.5 w-3.5" />
                  {format(new Date(group.date), "d MMM yyyy")}
                </div>
              )}

              {group.competition && (
                <Badge
                  variant="outline"
                  className="hidden md:inline-flex text-[10px] py-0 px-1.5 shrink-0"
                >
                  {group.competition}
                </Badge>
              )}

              <Badge variant="secondary" className="text-xs shrink-0">
                {group.reports.length}{" "}
                {group.reports.length === 1 ? "report" : "reports"}
              </Badge>

              {group.isDemo && (
                <Badge
                  variant="outline"
                  className="shrink-0 border-info/30 bg-info/10 text-info text-[10px] px-1.5 py-0 h-4 font-medium"
                >
                  Demo
                </Badge>
              )}
            </button>

            {isOpen && (
              <div className="border-t overflow-x-auto">
                <Table>
                  <ReportsTableHeader />
                  <TableBody>
                    {group.reports.map((report) => (
                      <ReportRow
                        key={report.id}
                        report={report}
                        onViewReport={onViewReport}
                        onEditReport={onEditReport}
                        onDeleteReport={onDeleteReport}
                        canEdit={!!user && report.scoutId === user.id}
                      />
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default MatchReportsTable;
