
import { ReportWithPlayer } from "@/types/report";
import { getOverallRating, getRecommendation } from "./reportDataExtraction";
import { convertRatingToNumeric, detectRatingSystemType } from "./ratingConversion";

export interface GroupedReport extends ReportWithPlayer {
  reportCount: number;
  avgRating: number | null;
  recommendation: string | null;
  allReports: ReportWithPlayer[];
  displayFormat: string;
}

// Helper function to group reports by player
export const groupReportsByPlayer = (reports: ReportWithPlayer[]): GroupedReport[] => {
  const grouped = reports.reduce((acc, report) => {
    const playerId = report.playerId;
    if (!acc[playerId]) {
      acc[playerId] = [];
    }
    acc[playerId].push(report);
    return acc;
  }, {} as Record<string, ReportWithPlayer[]>);

  return Object.values(grouped).map(playerReports => {
    // Sort by most recent first
    const sortedReports = playerReports.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const mostRecentReport = sortedReports[0];
    
    // Detect display format from the most recent report
    const displayFormat = detectRatingSystemType(mostRecentReport.sections);
    
    // Get all ratings for this player, using convertRatingToNumeric for all types
    const ratings = sortedReports
      .map(report => {
        const raw = getOverallRating(report);
        return convertRatingToNumeric(raw);
      })
      .filter((rating): rating is number => rating !== null);

    // Calculate average rating
    const avgRating = ratings.length > 0 
      ? Math.round((ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length) * 10) / 10
      : null;

    // Get the most recent recommendation
    const recommendation = getRecommendation(mostRecentReport);

    return {
      ...mostRecentReport,
      reportCount: sortedReports.length,
      avgRating,
      recommendation,
      allReports: sortedReports,
      displayFormat
    };
  });
};
