import React, { useState } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
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
import MatchScoutingPanel from "./MatchScoutingPanel";
import { getMatchIdentifier } from "@/hooks/useMatchScoutingReports";
import { loadMatchScoutingDraft } from "@/utils/matchScoutingDrafts";

interface MatchScoutingDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  homeTeam: string;
  awayTeam: string;
  matchDate: string;
  homeScore?: number | null;
  awayScore?: number | null;
}

export const MatchScoutingDrawer: React.FC<MatchScoutingDrawerProps> = ({
  open,
  onOpenChange,
  homeTeam,
  awayTeam,
  matchDate,
  homeScore,
  awayScore,
}) => {
  const [confirmDiscardOpen, setConfirmDiscardOpen] = useState(false);

  const matchIdentifier = getMatchIdentifier(homeTeam, awayTeam, matchDate);

  const hasExistingDraft = () => {
    const draft = loadMatchScoutingDraft(matchIdentifier);
    if (!draft) return false;
    return Object.values(draft.playerDrafts || {}).some(
      (p) => (p?.notes && p.notes.trim().length > 0) || p?.rating !== null
    );
  };

  // Intercept implicit close (overlay click / X / Esc).
  // Explicit close via Save Draft / Submit calls onOpenChange(false) directly through onClose.
  const handleSheetOpenChange = (next: boolean) => {
    if (next) {
      onOpenChange(true);
      return;
    }
    if (hasExistingDraft()) {
      // Silent: preserve the draft.
      onOpenChange(false);
      return;
    }
    // No draft yet — confirm before discarding.
    setConfirmDiscardOpen(true);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={handleSheetOpenChange}>
        <SheetContent side="right" className="w-full p-0 sm:max-w-3xl">
          <MatchScoutingPanel
            homeTeam={homeTeam}
            awayTeam={awayTeam}
            matchDate={matchDate}
            homeScore={homeScore}
            awayScore={awayScore}
            onClose={() => onOpenChange(false)}
            onExpand={() => onOpenChange(false)}
          />
        </SheetContent>
      </Sheet>

      <AlertDialog open={confirmDiscardOpen} onOpenChange={setConfirmDiscardOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard report?</AlertDialogTitle>
            <AlertDialogDescription>
              You haven't saved a draft yet. Closing now will discard any ratings or notes you've entered.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmDiscardOpen(false);
                onOpenChange(false);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default MatchScoutingDrawer;
