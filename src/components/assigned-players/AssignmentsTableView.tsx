import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tag } from "@/components/ui/tag";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { ClubBadge } from "@/components/ui/club-badge";
import { Eye, FileText, Play, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { UnifiedAssignment } from "@/hooks/useUnifiedAssignments";
import { useFixtureAssignments } from "@/hooks/useFixtureAssignments";
import { ASSIGNMENT_VISUALS } from "@/utils/assignmentVisuals";
import { toast } from "sonner";

interface AssignmentsTableViewProps {
  assignments: UnifiedAssignment[];
}

const statusBadge = (status: string) => {
  const cfg: Record<string, { label: string; variant: "secondary" | "default" }> = {
    pending: { label: "Pending", variant: "secondary" },
    assigned: { label: "Pending", variant: "secondary" },
    in_progress: { label: "In Progress", variant: "default" },
    completed: { label: "Completed", variant: "default" },
    reviewed: { label: "Reviewed", variant: "default" },
  };
  const c = cfg[status];
  return c ? <Badge variant={c.variant}>{c.label}</Badge> : <Badge variant="secondary">{status}</Badge>;
};

const priorityTag = (p?: string) =>
  p ? <Tag priority={p.toLowerCase() as "high" | "medium" | "low"}>{p}</Tag> : null;

const AssignmentsTableView = ({ assignments }: AssignmentsTableViewProps) => {
  const navigate = useNavigate();
  const { updateAssignment } = useFixtureAssignments();
  const fixtureVisual = ASSIGNMENT_VISUALS.fixture;
  const FixtureIcon = fixtureVisual.icon;

  const handleStartFixture = (id: string) => {
    updateAssignment(id, { status: "in_progress" });
    toast.success("Match assignment started");
  };

  return (
    <div className="border rounded-lg overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Assignment</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Deadline / Kickoff</TableHead>
            <TableHead>Assigned</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {assignments.map((item) => {
            if (item.kind === "player") {
              const a = item.player!;
              return (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={a.players?.imageUrl} alt={a.players?.name} />
                        <AvatarFallback>
                          {a.players?.name.split(" ").map((n) => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="font-medium truncate">{a.players?.name}</div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <ClubBadge clubName={a.players?.club || ""} size="sm" />
                          <span>{a.players?.positions?.join(", ")}</span>
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{statusBadge(a.status)}</TableCell>
                  <TableCell>{priorityTag(a.priority)}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {a.deadline ? format(new Date(a.deadline), "MMM dd, yyyy") : "—"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{format(new Date(a.created_at), "MMM dd, yyyy")}</div>
                      {a.assigned_by_manager && (
                        <div className="text-muted-foreground text-xs">
                          by {a.assigned_by_manager.first_name} {a.assigned_by_manager.last_name}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => navigate(`/player/${a.player_id}`)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      {a.status === "assigned" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            navigate("/report-builder", {
                              state: { selectedPlayerId: a.player_id, assignmentId: a.id },
                            })
                          }
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                      )}
                      {(a.status === "in_progress" || a.status === "assigned") && (
                        <Button
                          size="sm"
                          onClick={() =>
                            navigate("/report-builder", {
                              state: { selectedPlayerId: a.player_id, assignmentId: a.id },
                            })
                          }
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            }

            // Fixture row
            const fa = item.fixtureAssignment!;
            const f = item.fixture;
            const home = f?.home_team ?? "Home";
            const away = f?.away_team ?? "Away";
            const kickoff = f ? new Date(f.match_date_utc) : null;
            return (
              <TableRow
                key={item.id}
                className={cn("relative")}
                style={{ boxShadow: "inset 3px 0 0 0 hsl(38 92% 50%)" }}
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <FixtureIcon className={cn("h-5 w-5 shrink-0", fixtureVisual.iconClass)} />
                    <ClubBadge clubName={home} size="sm" />
                    <div className="min-w-0">
                      <div className="font-medium truncate">
                        {home} vs {away}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {kickoff && <span>{format(kickoff, "EEE d MMM, HH:mm")}</span>}
                        {f?.competition && (
                          <Badge variant="secondary" className="text-[10px] py-0">
                            {f.competition}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{statusBadge(fa.status)}</TableCell>
                <TableCell>{priorityTag(fa.priority)}</TableCell>
                <TableCell>
                  <div className="text-sm">
                    {fa.deadline
                      ? format(new Date(fa.deadline), "MMM dd, yyyy")
                      : kickoff
                      ? format(kickoff, "MMM dd, yyyy")
                      : "—"}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {format(new Date(fa.assignedAt), "MMM dd, yyyy")}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate("/calendar")}
                      title="View fixture"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {fa.status === "pending" && (
                      <Button variant="outline" size="sm" onClick={() => handleStartFixture(fa.id)}>
                        <Play className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      onClick={() => navigate(`/match-report/${fa.id}`)}
                      title="Open match report"
                    >
                      <MapPin className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {assignments.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No assignments found matching your filters.
        </div>
      )}
    </div>
  );
};

export default AssignmentsTableView;
