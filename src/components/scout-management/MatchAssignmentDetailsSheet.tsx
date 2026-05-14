import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tag } from "@/components/ui/tag";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { MapPin, Trash2, RefreshCw, FileText } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useFixtureAssignments } from "@/hooks/useFixtureAssignments";
import AssignScoutToMatchDialog, {
  type FixtureForAssignment,
} from "@/components/AssignScoutToMatchDialog";
import type { MatchAssignmentCardData } from "./MatchAssignmentCard";

interface Props {
  data: MatchAssignmentCardData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MatchAssignmentDetailsSheet = ({ data, open, onOpenChange }: Props) => {
  const { removeAssignment } = useFixtureAssignments();
  const navigate = useNavigate();
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [reassignOpen, setReassignOpen] = useState(false);

  if (!data) return null;
  const { assignment: a, fixture: f, scout } = data;
  const home = f?.home_team ?? "Home";
  const away = f?.away_team ?? "Away";
  const kickoff = f ? new Date(f.match_date_utc) : null;

  const fixtureForDialog: FixtureForAssignment | null = f
    ? {
        home_team: f.home_team,
        away_team: f.away_team,
        match_date_utc: f.match_date_utc,
        venue: f.venue,
        competition: f.competition,
      }
    : null;

  const handleRemove = () => {
    removeAssignment(a.id);
    toast.success("Match assignment removed");
    setConfirmRemove(false);
    onOpenChange(false);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-md flex flex-col">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-info" />
              {home} vs {away}
            </SheetTitle>
            <SheetDescription className="flex flex-wrap items-center gap-2 text-xs">
              {kickoff && <span>{format(kickoff, "EEE d MMM yyyy, HH:mm")}</span>}
              {f?.venue && <span>· {f.venue}</span>}
              {f?.competition && (
                <Badge variant="secondary">{f.competition}</Badge>
              )}
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 space-y-4 overflow-y-auto py-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Scout</p>
              <p className="font-medium">
                {scout
                  ? `${scout.first_name ?? ""} ${scout.last_name ?? ""}`.trim() || scout.email
                  : a.scoutId}
              </p>
            </div>
            <div className="flex gap-6">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Status</p>
                <Badge variant="secondary" className="capitalize">
                  {a.status.replace("_", " ")}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Priority</p>
                <Tag priority={a.priority.toLowerCase() as "high" | "medium" | "low"}>{a.priority}</Tag>
              </div>
            </div>
            {a.deadline && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Deadline</p>
                <p>{format(new Date(a.deadline), "MMM dd, yyyy")}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-muted-foreground mb-1">Assigned</p>
              <p>{format(new Date(a.assignedAt), "MMM dd, yyyy")}</p>
            </div>
            {a.notes && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Notes</p>
                <p className="rounded-md bg-muted/50 p-2 text-xs">{a.notes}</p>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 border-t pt-4">
            <Button onClick={() => navigate(`/match-report/${a.id}`)}>
              <FileText className="h-4 w-4 mr-2" />
              {a.status === "completed" ? "View report" : "Open report"}
            </Button>
            <Button
              variant="outline"
              onClick={() => setReassignOpen(true)}
              disabled={!fixtureForDialog}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reassign
            </Button>
            <Button
              variant="outline"
              className="text-destructive hover:text-destructive"
              onClick={() => setConfirmRemove(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Remove
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={confirmRemove} onOpenChange={setConfirmRemove}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this assignment?</AlertDialogTitle>
            <AlertDialogDescription>
              The scout will no longer be assigned to this fixture. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AssignScoutToMatchDialog
        open={reassignOpen}
        onOpenChange={setReassignOpen}
        fixture={fixtureForDialog}
      />
    </>
  );
};

export default MatchAssignmentDetailsSheet;
