/**
 * Scout-only home dashboard widget: upcoming fixture-level assignments
 * with kickoff countdown and "Open match report" CTA.
 */
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClubBadge } from "@/components/ui/club-badge";
import { ClipboardList } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format, formatDistanceToNowStrict, isPast } from "date-fns";
import { useUnifiedAssignments } from "@/hooks/useUnifiedAssignments";
import { ASSIGNMENT_VISUALS } from "@/utils/assignmentVisuals";
import { cn } from "@/lib/utils";

const MyMatchAssignments = () => {
  const navigate = useNavigate();
  const { items } = useUnifiedAssignments();
  const v = ASSIGNMENT_VISUALS.fixture;
  const Icon = v.icon;

  const upcoming = items
    .filter((i) => i.kind === "fixture" && i.fixture && !isPast(new Date(i.fixture.match_date_utc)))
    .slice(0, 4);

  if (upcoming.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className={cn("flex items-center gap-2 text-base", v.iconClass)}>
          <Icon className="h-4 w-4" />
          My match assignments
          <Badge variant="secondary" className="ml-auto">{upcoming.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {upcoming.map((item) => {
          const fa = item.fixtureAssignment!;
          const f = item.fixture!;
          const kickoff = new Date(f.match_date_utc);
          return (
            <div
              key={item.id}
              className="flex items-center justify-between gap-3 rounded-md border p-3 hover:bg-muted/40 transition-colors"
              style={{ borderLeftColor: "hsl(38 92% 50%)", borderLeftWidth: 4 }}
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <ClubBadge clubName={f.home_team} size="sm" />
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">
                    {f.home_team} vs {f.away_team}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {format(kickoff, "EEE d MMM, HH:mm")} · in {formatDistanceToNowStrict(kickoff)}
                  </div>
                </div>
              </div>
              <Button size="sm" onClick={() => navigate(`/match-report/${fa.id}`)}>
                <ClipboardList className="h-4 w-4 mr-1" />
                Open match report
              </Button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default MyMatchAssignments;
