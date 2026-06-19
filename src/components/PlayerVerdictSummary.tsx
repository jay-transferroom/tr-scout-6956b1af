
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ReportWithPlayer } from "@/types/report";
import { getVerdictOption, VERDICT_OPTIONS } from "@/types/verdict";
import { getRecommendation } from "@/utils/reportDataExtraction";
import VerdictBadge from "@/components/VerdictBadge";
import { FileText, Users } from "lucide-react";

interface PlayerVerdictSummaryProps {
  playerReports: ReportWithPlayer[];
  playerName: string;
}

const PlayerVerdictSummary = ({ playerReports, playerName }: PlayerVerdictSummaryProps) => {
  if (!playerReports || playerReports.length === 0) {
    return null;
  }

  // Extract verdicts from all reports
  const verdicts = playerReports
    .map(report => getRecommendation(report))
    .filter(verdict => verdict !== null && verdict !== undefined);

  if (verdicts.length === 0) {
    return null;
  }

  // Count occurrences of each verdict with proper typing
  const verdictCounts = verdicts.reduce((acc, verdict) => {
    const currentCount = acc[verdict] || 0;
    acc[verdict] = currentCount + 1;
    return acc;
  }, {} as Record<string, number>);

  // Get unique verdicts with their counts
  const uniqueVerdicts = Object.entries(verdictCounts).map(([verdict, count]) => ({
    verdict,
    count: count as number, // Ensure count is typed as number
    option: getVerdictOption(verdict)
  }));

  // Sort by count (most common first)
  uniqueVerdicts.sort((a, b) => b.count - a.count);

  const hasConflictingVerdicts = uniqueVerdicts.length > 1;
  const majorityVerdict = uniqueVerdicts[0];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileText className="h-5 w-5" />
          Scout Recommendations for {playerName}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {hasConflictingVerdicts && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-amber-600" />
                <span className="text-sm font-medium text-amber-800">
                  Conflicting Recommendations ({playerReports.length} reports)
                </span>
              </div>
              <p className="text-xs text-amber-700">
                Scouts have different opinions on this player. Review all reports carefully.
              </p>
            </div>
          )}

          <div className="space-y-2">
            {uniqueVerdicts.map(({ verdict, count, option }) => (
              <div key={verdict} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <VerdictBadge verdict={verdict} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {count} scout{count > 1 ? 's' : ''}
                  </span>
                  {count === majorityVerdict.count && hasConflictingVerdicts && (
                    <Badge variant="secondary" className="text-xs">
                      Majority
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>

          {!hasConflictingVerdicts && majorityVerdict.option && (
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-muted-foreground">
                <strong>Consensus:</strong> {majorityVerdict.option.description}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PlayerVerdictSummary;
