import { ArrowLeft } from "lucide-react";
import { useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import MatchScoutingPanel from "@/components/match-scouting/MatchScoutingPanel";
import { Button } from "@/components/ui/button";

const parseNullableNumber = (value: string | null) => {
  if (value === null) return null;

  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : null;
};

const MatchScoutingReport = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const matchData = useMemo(() => {
    const homeTeam = searchParams.get("homeTeam");
    const awayTeam = searchParams.get("awayTeam");
    const matchDate = searchParams.get("matchDate");

    if (!homeTeam || !awayTeam || !matchDate) {
      return null;
    }

    return {
      homeTeam,
      awayTeam,
      matchDate,
      homeScore: parseNullableNumber(searchParams.get("homeScore")),
      awayScore: parseNullableNumber(searchParams.get("awayScore")),
    };
  }, [searchParams]);

  if (!matchData) {
    return (
      <div className="container mx-auto max-w-5xl px-6 py-10">
        <Button variant="ghost" onClick={() => navigate("/calendar")} className="mb-6 gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to calendar
        </Button>
        <p className="text-muted-foreground">Missing match details for this scouting report.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <div className="mb-4">
        <Button variant="ghost" onClick={() => navigate("/calendar")} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to calendar
        </Button>
      </div>

      <MatchScoutingPanel
        homeTeam={matchData.homeTeam}
        awayTeam={matchData.awayTeam}
        matchDate={matchData.matchDate}
        homeScore={matchData.homeScore}
        awayScore={matchData.awayScore}
      />
    </div>
  );
};

export default MatchScoutingReport;
