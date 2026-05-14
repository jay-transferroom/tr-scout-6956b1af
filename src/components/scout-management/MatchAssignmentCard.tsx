import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tag } from "@/components/ui/tag";
import { ClubBadge } from "@/components/ui/club-badge";
import { format } from "date-fns";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FixtureAssignment } from "@/types/fixtureAssignment";
import type { Fixture } from "@/hooks/useFixturesData";
import type { Scout } from "@/hooks/useScouts";

export interface MatchAssignmentCardData {
  assignment: FixtureAssignment;
  fixture?: Fixture;
  scout?: Scout;
}

interface Props {
  data: MatchAssignmentCardData;
  onClick?: () => void;
  draggable?: boolean;
  onDragStart?: () => void;
}

const initials = (s?: Scout) => {
  if (!s) return "?";
  const a = (s.first_name ?? s.email[0] ?? "?").charAt(0);
  const b = (s.last_name ?? "").charAt(0);
  return (a + b).toUpperCase();
};

const MatchAssignmentCard = ({ data, onClick, draggable, onDragStart }: Props) => {
  const { assignment: a, fixture: f, scout } = data;
  const home = f?.home_team ?? "Home";
  const away = f?.away_team ?? "Away";
  const kickoff = f ? new Date(f.match_date_utc) : null;

  return (
    <Card
      draggable={draggable}
      onDragStart={onDragStart}
      onClick={onClick}
      className={cn(
        "mb-2 cursor-pointer hover:shadow-md transition-all border-l-4"
      )}
      style={{ borderLeftColor: "hsl(38 92% 50%)" }}
    >
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center gap-2">
          <MapPin className="h-3.5 w-3.5 text-info shrink-0" />
          <ClubBadge clubName={home} size="sm" />
          <span className="text-sm font-medium truncate">
            {home} vs {away}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          {kickoff && <span>{format(kickoff, "EEE d MMM, HH:mm")}</span>}
          <Tag priority={a.priority.toLowerCase() as "high" | "medium" | "low"}>{a.priority}</Tag>
        </div>
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarFallback className="text-[10px]">{initials(scout)}</AvatarFallback>
          </Avatar>
          <span className="text-xs truncate">
            {scout ? `${scout.first_name ?? ""} ${scout.last_name ?? ""}`.trim() || scout.email : a.scoutId}
          </span>
        </div>
        {a.notes && (
          <p className="text-xs text-muted-foreground line-clamp-2 border-t pt-2">{a.notes}</p>
        )}
      </CardContent>
    </Card>
  );
};

export default MatchAssignmentCard;
