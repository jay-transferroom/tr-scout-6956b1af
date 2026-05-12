import { format } from "date-fns";
import { Calendar, MapPin, Star, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useFixtureAssignments } from "@/hooks/useFixtureAssignments";
import { useFixturesData } from "@/hooks/useFixturesData";
import { getFixtureId } from "@/types/fixtureAssignment";
import { useNavigate } from "react-router-dom";
import { useMemo } from "react";

interface Props {
  scoutId?: string;
}

const FixtureMatchReportsTable = ({ scoutId }: Props) => {
  const navigate = useNavigate();
  const { reports, assignments, resolveScout } = useFixtureAssignments();
  const { data: fixtures = [] } = useFixturesData();

  const fixtureMap = useMemo(() => {
    const m = new Map<string, (typeof fixtures)[number]>();
    fixtures.forEach((f) => m.set(getFixtureId(f), f));
    return m;
  }, [fixtures]);

  const rows = useMemo(() => {
    return reports
      .filter((r) => r.status === "submitted")
      .filter((r) => {
        if (!scoutId) return true;
        const a = assignments.find((x) => x.id === r.fixtureAssignmentId);
        if (!a) return true;
        const resolved = resolveScout(a.scoutId);
        return (resolved?.id ?? a.scoutId) === scoutId;
      })
      .map((r) => {
        const f = fixtureMap.get(r.fixtureId);
        const ratings = r.playerObservations.filter((o) => o.rating > 0).map((o) => o.rating);
        const avg =
          ratings.length > 0
            ? ratings.reduce((a, b) => a + b, 0) / ratings.length
            : null;
        return {
          report: r,
          fixture: f,
          playerCount: r.playerObservations.length,
          avg,
        };
      })
      .sort((a, b) => {
        const ax = a.report.submittedAt ?? a.report.updatedAt ?? "";
        const bx = b.report.submittedAt ?? b.report.updatedAt ?? "";
        return bx.localeCompare(ax);
      });
  }, [reports, assignments, fixtureMap, resolveScout, scoutId]);

  if (rows.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm">
        <MapPin className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
        <span className="font-medium">Match Reports</span>
        <Badge variant="secondary" className="text-xs">{rows.length}</Badge>
      </div>
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Match</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-center">Players Scouted</TableHead>
              <TableHead className="text-center">Avg Rating</TableHead>
              <TableHead>Submitted</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(({ report: r, fixture: f, playerCount, avg }) => {
              const home = f?.home_team ?? "Home";
              const away = f?.away_team ?? "Away";
              const submitted = r.submittedAt ?? r.updatedAt;
              return (
                <TableRow
                  key={r.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate(`/match-report/${r.fixtureAssignmentId}`)}
                  style={{ boxShadow: "inset 3px 0 0 0 hsl(38 92% 50%)" }}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-amber-500/15 text-amber-700 border-amber-500/30 dark:text-amber-400 hover:bg-amber-500/20 text-xs shrink-0 gap-1">
                        <MapPin className="h-3 w-3" /> Match Report
                      </Badge>
                      <span className="font-medium">
                        {home} vs {away}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                      <Calendar className="h-3.5 w-3.5" />
                      {f?.match_date_utc ? format(new Date(f.match_date_utc), "dd MMM yyyy") : "—"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {f?.competition || "—"}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary" className="gap-1">
                      <Users className="h-3 w-3" /> {playerCount}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {avg !== null ? (
                      <Badge variant="default" className="gap-1">
                        <Star className="h-3 w-3" /> {avg.toFixed(1)}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {submitted ? format(new Date(submitted), "dd MMM yyyy HH:mm") : "—"}
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default FixtureMatchReportsTable;
