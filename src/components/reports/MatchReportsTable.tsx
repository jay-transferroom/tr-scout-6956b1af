import { useState } from "react";
import { format, differenceInDays } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
import { GroupedMatchReport } from "@/hooks/useAllMatchScoutingReports";
import { useAuth } from "@/contexts/AuthContext";
import { Users, Calendar, Star, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface MatchReportsTableProps {
  matchReports: GroupedMatchReport[];
  onSelectMatch?: (match: GroupedMatchReport) => void;
  onEditMatch?: (match: GroupedMatchReport) => void;
}

const SUBMITTED_EDIT_WINDOW_DAYS = 90;

const MatchReportsTable = ({ matchReports, onSelectMatch, onEditMatch }: MatchReportsTableProps) => {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [pendingDelete, setPendingDelete] = useState<GroupedMatchReport | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const isManager = profile?.role === "recruitment" || profile?.role === "director";

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    setIsDeleting(true);
    const { error } = await supabase
      .from("match_scouting_reports")
      .delete()
      .eq("match_identifier", pendingDelete.match_identifier);
    setIsDeleting(false);
    if (error) {
      toast.error("Failed to delete match report");
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["all-match-scouting-reports"] });
    toast.success("Match report deleted");
    setPendingDelete(null);
  };

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
            <TableHead>League</TableHead>
            <TableHead className="text-center">Players Rated</TableHead>
            <TableHead className="text-center">Avg Rating</TableHead>
            <TableHead>Scouts</TableHead>
            <TableHead>Last Updated</TableHead>
            <TableHead className="w-[60px] text-right">Actions</TableHead>
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

            const isSubmitted = match.reports.some((r) => r.rating !== null);

            // Edit eligibility for the current user.
            // Drafts: always editable by their author.
            // Submitted: editable by author within 90 days from earliest submitted updated_at (proxy for SubmittedAt).
            const myReports = user ? match.reports.filter((r) => r.scout_id === user.id) : [];
            const myDraftReports = myReports.filter((r) => r.rating === null);
            const mySubmittedReports = myReports.filter((r) => r.rating !== null);
            const earliestSubmittedAt = mySubmittedReports.length
              ? mySubmittedReports.reduce((min, r) => {
                  const d = new Date(r.updated_at);
                  return d < min ? d : min;
                }, new Date(mySubmittedReports[0].updated_at))
              : null;
            const submittedWithinWindow = earliestSubmittedAt
              ? differenceInDays(new Date(), earliestSubmittedAt) <= SUBMITTED_EDIT_WINDOW_DAYS
              : false;
            const canEdit = myDraftReports.length > 0 || submittedWithinWindow;
            const editTooltip = myDraftReports.length > 0
              ? "Edit draft"
              : submittedWithinWindow
                ? `Edit submitted report (within ${SUBMITTED_EDIT_WINDOW_DAYS}-day window)`
                : "";

            return (
              <TableRow key={match.match_identifier} className="cursor-pointer hover:bg-muted/50" onClick={() => onSelectMatch?.(match)}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Badge variant={isSubmitted ? "default" : "secondary"} className="text-xs shrink-0">
                      {isSubmitted ? "Submitted" : "Draft"}
                    </Badge>
                    <span className="font-medium">
                      {match.homeTeam} vs {match.awayTeam}
                    </span>
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
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {match.competition || "—"}
                  </span>
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
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1">
                    {canEdit ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => onEditMatch?.(match)}
                              aria-label={editTooltip}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{editTooltip}</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : null}
                    {isManager ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={() => setPendingDelete(match)}
                              aria-label="Delete match report"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Delete match report</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <AlertDialog open={!!pendingDelete} onOpenChange={(open) => !open && !isDeleting && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this match report?</AlertDialogTitle>
            <AlertDialogDescription>
              All player ratings will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleConfirmDelete();
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MatchReportsTable;
