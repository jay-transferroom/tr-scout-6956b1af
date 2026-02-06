import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { GroupedMatchReport } from "@/hooks/useAllMatchScoutingReports";
import { Users, Calendar, Star } from "lucide-react";

interface MatchReportsTableProps {
  matchReports: GroupedMatchReport[];
}

const MatchReportsTable = ({ matchReports }: MatchReportsTableProps) => {
  if (matchReports.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg font-medium mb-1">No match reports yet</p>
        <p className="text-sm">Create match reports from the Calendar page by clicking on a fixture.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Match</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-center">Players Rated</TableHead>
            <TableHead className="text-center">Avg Rating</TableHead>
            <TableHead>Scouts</TableHead>
            <TableHead>Last Updated</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {matchReports.map((match) => {
            const uniqueScouts = new Map<string, string>();
            match.reports.forEach((r) => {
              if (r.scout_profile) {
                const name = `${r.scout_profile.first_name || ""} ${r.scout_profile.last_name || ""}`.trim() || "Scout";
                uniqueScouts.set(r.scout_id, name);
              }
            });

            const latestUpdate = match.reports.reduce(
              (latest, r) => {
                const d = new Date(r.updated_at);
                return d > latest ? d : latest;
              },
              new Date(0)
            );

            return (
              <TableRow key={match.match_identifier}>
                <TableCell>
                  <div className="font-medium">
                    {match.homeTeam} vs {match.awayTeam}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                    <Calendar className="h-3.5 w-3.5" />
                    {match.matchDate
                      ? format(new Date(match.matchDate), "dd MMM yyyy")
                      : "—"}
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="secondary" className="gap-1">
                    <Users className="h-3 w-3" />
                    {match.totalRatings}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  {match.averageRating !== null ? (
                    <Badge variant="default" className="gap-1">
                      <Star className="h-3 w-3" />
                      {match.averageRating.toFixed(1)}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground text-sm">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {Array.from(uniqueScouts.values()).map((name) => (
                      <Badge key={name} variant="outline" className="text-xs">
                        {name}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {format(latestUpdate, "dd MMM yyyy HH:mm")}
                  </span>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default MatchReportsTable;
