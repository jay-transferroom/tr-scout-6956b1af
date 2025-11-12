
import { FileText, Star, Award, User, Plus, UserCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ReportWithPlayer } from "@/types/report";
import { getOverallRating, getRecommendation } from "@/utils/reportDataExtraction";
import { formatDate, getRatingColor } from "@/utils/reportFormatting";
import { useNavigate } from "react-router-dom";
import PlayerVerdictSummary from "@/components/PlayerVerdictSummary";
import VerdictBadge from "@/components/VerdictBadge";
import { useAuth } from "@/contexts/AuthContext";

interface PlayerReportsProps {
  playerReports: ReportWithPlayer[];
  reportsLoading: boolean;
  onViewReport: (reportId: string) => void;
  playerId?: string;
  playerName?: string;
}

export const PlayerReports = ({ 
  playerReports, 
  reportsLoading, 
  onViewReport,
  playerId,
  playerName 
}: PlayerReportsProps) => {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const handleCreateReport = () => {
    if (playerId && playerName) {
      // Check if we have a private player by looking at the playerReports data
      const isPrivatePlayer = playerReports && playerReports.length > 0 && 
                             playerReports[0].player?.isPrivatePlayer;
      
      if (isPrivatePlayer) {
        // For private players
        navigate('/report-builder', { 
          state: { selectedPrivatePlayer: playerReports[0].player } 
        });
      } else {
        // For public players  
        navigate('/report-builder', { 
          state: { selectedPlayer: { id: playerId, name: playerName } } 
        });
      }
    } else {
      navigate('/report-builder');
    }
  };

  const handleScoutManagerVerdict = () => {
    // This functionality would be handled on the player profile page
    console.log('Scout manager verdict for player:', playerName);
  };

  // Only show scout manager verdict button for recruitment users
  const canAddVerdict = profile?.role === 'recruitment';

  return (
    <div className="space-y-4">
      {/* Verdict Summary */}
      {playerReports && playerReports.length > 0 && (
        <PlayerVerdictSummary 
          playerReports={playerReports} 
          playerName={playerReports[0]?.player?.name || playerName || "This Player"} 
        />
      )}

      {/* Reports List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Scouting Reports ({playerReports?.length || 0})
              </CardTitle>
              <CardDescription>
                All scouting reports for this player
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleCreateReport}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Report
              </Button>
              {canAddVerdict && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleScoutManagerVerdict}
                >
                  <UserCheck className="h-4 w-4 mr-2" />
                  Add Verdict
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reportsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading reports...</p>
              </div>
            ) : playerReports && playerReports.length > 0 ? (
              playerReports.map((report) => {
                const rating = getOverallRating(report);
                const verdict = getRecommendation(report);
                
                return (
                  <div key={report.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge variant="outline" className="capitalize">
                            {report.status}
                          </Badge>
                          <span className="text-sm text-gray-600">
                            {formatDate(report.createdAt)}
                          </span>
                          {report.scoutProfile && (
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <User className="h-3 w-3" />
                              <span>
                                {report.scoutProfile.first_name} {report.scoutProfile.last_name}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {/* Match Context and Watch Method */}
                        {(report.matchContext || report.watchMethod) && (
                          <div className="flex items-center gap-2 mb-2">
                            {report.matchContext && (
                              <div className="text-sm text-muted-foreground">
                                <span className="font-medium">{report.matchContext.opposition}</span>
                                <span className="text-xs ml-1">({report.matchContext.competition})</span>
                              </div>
                            )}
                            {report.watchMethod && (
                              <Badge variant="outline" className="text-xs">
                                {report.watchMethod}
                              </Badge>
                            )}
                          </div>
                        )}
                        
                        <div className="flex items-center gap-4">
                          {rating !== null && (
                            <div className="flex items-center gap-2">
                              <Star className="h-4 w-4 text-yellow-500" />
                              <span className={`font-medium ${getRatingColor(rating)}`}>
                                Rating: {rating}
                              </span>
                            </div>
                          )}
                          
                          {verdict && (
                            <div className="flex items-center gap-2">
                              <Award className="h-4 w-4 text-blue-500" />
                              <VerdictBadge verdict={verdict} />
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => onViewReport(report.id)}
                        >
                          View Report
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={handleCreateReport}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          New Report
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-900 mb-2">No reports yet</p>
                <p className="text-muted-foreground">
                  This player doesn't have any scouting reports yet.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
