
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ReportWithPlayer } from "@/types/report";
import { formatDate, getRatingColor } from "@/utils/reportFormatting";
import { getOverallRating, getRecommendation } from "@/utils/reportDataExtraction";
import { Eye, Edit, Trash2, Download } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useReportPlayerData } from "@/hooks/useReportPlayerData";
import { useTemplates } from "@/hooks/useTemplates";
import { exportPlayerReportsPdf } from "@/utils/reportExport";
import { toast } from "sonner";

interface PlayerReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerName: string;
  reports: ReportWithPlayer[];
  onViewReport: (reportId: string) => void;
  onEditReport?: (reportId: string) => void;
  onDeleteReport: (reportId: string, playerName: string) => void;
}

const ReportItem = ({ report, onViewReport, onEditReport, onDeleteReport, canEdit }: {
  report: ReportWithPlayer;
  onViewReport: (reportId: string) => void;
  onEditReport?: (reportId: string) => void;
  onDeleteReport: (reportId: string, playerName: string) => void;
  canEdit: boolean;
}) => {
  const isCustomPlayer = typeof report.playerId === 'string' && report.playerId.startsWith('custom-');
  const { data: fetchedPlayer, isLoading: fetchedLoading, error: playerError } = useReportPlayerData(isCustomPlayer ? undefined : report.playerId);
  const playerData = isCustomPlayer ? report.player : fetchedPlayer;
  const playerLoading = isCustomPlayer ? false : fetchedLoading;
  const overallRating = getOverallRating(report);
  const recommendation = getRecommendation(report);

  const playerName = playerLoading ? 'Loading...' : 
                     playerError ? 'Unknown Player' :
                      playerData?.name || report.player?.name || 'Unknown Player';

  return (
    <div key={report.id} className="border rounded-lg p-4 bg-card">
      <div className="flex justify-between items-start mb-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant={report.status === "submitted" ? "secondary" : "outline"}>
              {report.status === "draft" ? "Draft" : "Submitted"}
            </Badge>
            {isCustomPlayer && (
              <Badge variant="outline" className="border-info/30 bg-info/10 text-info text-[10px] px-1.5 py-0 h-4 font-medium">
                Custom
              </Badge>
            )}
            <span className="text-sm text-muted-foreground">
              {formatDate(report.createdAt)}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Scout: {report.scoutProfile?.first_name || "Unknown"}
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {overallRating !== null && overallRating !== undefined && (
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Rating</p>
              <span className={`font-semibold text-lg ${getRatingColor(overallRating)}`}>
                {overallRating}
              </span>
            </div>
          )}
          
          {recommendation && (
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Recommendation</p>
              <span className={`font-medium ${getRatingColor(recommendation)}`}>
                {recommendation}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2 justify-end">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => {
            onViewReport(report.id);
          }}
          title="View report"
        >
          <Eye className="h-4 w-4 mr-1" />
          View
        </Button>
        {canEdit && onEditReport && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              onEditReport(report.id);
            }}
            title="Edit report"
          >
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
        )}
        {canEdit && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              onDeleteReport(report.id, playerName);
            }}
            title="Delete report"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
        )}
      </div>
    </div>
  );
};

const PlayerReportsModal = ({ 
  isOpen, 
  onClose, 
  playerName, 
  reports, 
  onViewReport, 
  onEditReport, 
  onDeleteReport 
}: PlayerReportsModalProps) => {
  const { user } = useAuth();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>All Reports for {playerName} ({reports.length})</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {reports.map((report) => {
            const canEdit = user && report.scoutId === user.id;

            return (
              <ReportItem
                key={report.id}
                report={report}
                onViewReport={onViewReport}
                onEditReport={onEditReport}
                onDeleteReport={onDeleteReport}
                canEdit={canEdit}
              />
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PlayerReportsModal;
