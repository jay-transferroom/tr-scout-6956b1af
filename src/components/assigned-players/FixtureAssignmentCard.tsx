import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tag } from "@/components/ui/tag";
import { Badge } from "@/components/ui/badge";
import { ClubBadge } from "@/components/ui/club-badge";
import { Calendar, Eye, Play, MapPin } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ASSIGNMENT_VISUALS } from "@/utils/assignmentVisuals";
import { useFixtureAssignments } from "@/hooks/useFixtureAssignments";
import type { UnifiedAssignment } from "@/hooks/useUnifiedAssignments";
import { cn } from "@/lib/utils";

interface Props {
  item: UnifiedAssignment;
}

const FixtureAssignmentCard = ({ item }: Props) => {
  const fa = item.fixtureAssignment!;
  const f = item.fixture;
  const home = f?.home_team ?? "Home";
  const away = f?.away_team ?? "Away";
  const kickoff = f ? new Date(f.match_date_utc) : null;
  const v = ASSIGNMENT_VISUALS.fixture;
  const Icon = v.icon;
  const navigate = useNavigate();
  const { updateAssignment } = useFixtureAssignments();

  const start = () => {
    updateAssignment(fa.id, { status: "in_progress" });
    toast.success("Match assignment started");
  };

  return (
    <Card
      className={cn("p-4 sm:p-6 border-l-4")}
      style={{ borderLeftColor: "hsl(38 92% 50%)" }}
    >
      <div className="flex items-start gap-3 mb-3">
        <Icon className={cn("h-5 w-5 mt-0.5 shrink-0", v.iconClass)} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <ClubBadge clubName={home} size="sm" />
            <h3 className="font-semibold text-base truncate">
              {home} vs {away}
            </h3>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {kickoff && <span>{format(kickoff, "EEE d MMM, HH:mm")}</span>}
            {f?.competition && (
              <Badge variant="secondary" className="text-[10px] py-0">
                {f.competition}
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-2 mb-4 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Priority:</span>
          <Tag priority={fa.priority.toLowerCase() as "high" | "medium" | "low"}>{fa.priority}</Tag>
        </div>
        {fa.deadline && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Deadline:</span>
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{format(new Date(fa.deadline), "MMM dd, yyyy")}</span>
            </div>
          </div>
        )}
        {fa.notes && (
          <div className="text-xs bg-muted/50 rounded p-2 text-muted-foreground">{fa.notes}</div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <Button size="sm" className="flex-1" onClick={() => navigate(`/match-report/${fa.id}`)}>
          <MapPin className="h-4 w-4 mr-1" />
          Match Report
        </Button>
        {fa.status === "pending" && (
          <Button size="sm" variant="outline" onClick={start}>
            <Play className="h-4 w-4 mr-1" />
            Start
          </Button>
        )}
        <Button size="sm" variant="outline" onClick={() => navigate("/calendar")}>
          <Eye className="h-4 w-4 mr-1" />
          View
        </Button>
      </div>
    </Card>
  );
};

export default FixtureAssignmentCard;
