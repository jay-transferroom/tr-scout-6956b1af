import React from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import MatchScoutingPanel from "./MatchScoutingPanel";

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
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
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
  );
};

export default MatchScoutingDrawer;
