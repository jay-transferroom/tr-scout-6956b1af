
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Eye, User, Trash2, MoreHorizontal } from "lucide-react";
import { ReportWithPlayer } from "@/types/report";
import { getRatingColor, formatDate } from "@/utils/reportFormatting";
import { getOverallRating, getRecommendation } from "@/utils/reportDataExtraction";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useReportPlayerData } from "@/hooks/useReportPlayerData";
import VerdictBadge from "@/components/VerdictBadge";
import { useNavigate } from "react-router-dom";
import { PlayerAvatar } from "@/components/ui/player-avatar";
import { ClubBadge } from "@/components/ui/club-badge";
import { ScoutingGrade } from "@/components/ui/scouting-grade";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface ReportRowProps {
  report: ReportWithPlayer;
  onViewReport: (reportId: string) => void;
  onEditReport?: (reportId: string) => void;
  onDeleteReport: (reportId: string, playerName: string) => void;
  canEdit: boolean;
}

const ReportRow = ({ report, onViewReport, onEditReport, onDeleteReport, canEdit }: ReportRowProps) => {
  const { data: playerData, isLoading: playerLoading, error: playerError } = useReportPlayerData(report.playerId);
  const navigate = useNavigate();
  const { profile } = useAuth();
  const overallRating = getOverallRating(report);
  const verdict = getRecommendation(report);

  // Display loading state while fetching player data
  const playerName = playerLoading ? 'Loading...' : 
                     playerError ? `Error loading player` :
                     playerData?.name || `Player ID: ${report.playerId}`;
                     
  const playerClub = playerLoading ? 'Loading...' : 
                     playerError ? 'Unknown' :
                     playerData?.club || 'Unknown';
                     
  const playerPositions = playerLoading ? 'Loading...' : 
                          playerError ? 'Unknown' :
                          playerData?.positions?.join(", ") || 'Unknown';

  const handleViewPlayerProfile = () => {
    if (playerData) {
      // Check if it's a private player by looking for the isPrivatePlayer flag
      if (playerData.isPrivatePlayer) {
        navigate(`/private-player/${report.playerId}`);
      } else {
        navigate(`/player/${report.playerId}`);
      }
    }
  };

  // Convert error to boolean for disabled prop
  const isDisabled = playerLoading || !!playerError;

  return (
    <TableRow key={report.id}>
      <TableCell>
        <div className="flex items-center gap-3">
          <PlayerAvatar 
            playerName={playerName}
            avatarUrl={playerData?.image}
            size="sm"
          />
          <span className="font-medium text-grey-900 text-sm">{playerName}</span>
        </div>
      </TableCell>
      <TableCell>
        <ClubBadge 
          clubName={playerClub}
          size="sm"
        />
      </TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-1">
          {playerPositions.split(", ").map((position, index) => (
            <Badge key={index} variant="neutral" className="text-xs">
              {position}
            </Badge>
          ))}
        </div>
      </TableCell>
      <TableCell>
        {report.matchContext ? (
          <div className="text-sm text-grey-700">
            <div className="font-medium">{report.matchContext.opposition}</div>
            <div className="text-xs text-grey-500">{report.matchContext.competition}</div>
          </div>
        ) : (
          <span className="text-grey-400 text-sm">-</span>
        )}
      </TableCell>
      <TableCell>
        <div className="text-sm text-grey-600">
          {formatDate(report.createdAt)}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Badge variant={report.status === "submitted" ? "success" : "neutral"} className="text-xs font-medium">
            {report.status === "draft" ? "Draft" : "Submitted"}
          </Badge>
        </div>
      </TableCell>
      <TableCell>
        {overallRating !== null && overallRating !== undefined ? (
          <ScoutingGrade grade={overallRating} />
        ) : (
          <span className="text-grey-400 text-sm">-</span>
        )}
      </TableCell>
      <TableCell>
        {verdict ? (
          <VerdictBadge verdict={verdict} />
        ) : (
          <span className="text-grey-400 text-sm">-</span>
        )}
      </TableCell>
      <TableCell>
        <div className="text-sm text-grey-700">
          {report.scoutProfile?.first_name && report.scoutProfile?.last_name 
            ? `${report.scoutProfile.first_name} ${report.scoutProfile.last_name}`
            : report.scoutProfile?.first_name || "Scout"}
        </div>
      </TableCell>
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              size="sm"
              className="border-grey-300 text-grey-700 hover:bg-grey-50"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-white border border-grey-200 shadow-lg z-50">
            <DropdownMenuItem onClick={() => onViewReport(report.id)}>
              <Eye className="h-4 w-4 mr-2" />
              View report
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleViewPlayerProfile} disabled={isDisabled}>
              <User className="h-4 w-4 mr-2" />
              View player profile
            </DropdownMenuItem>
            {canEdit && onEditReport && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onEditReport(report.id)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit report
                </DropdownMenuItem>
              </>
            )}
            {canEdit && (
              <DropdownMenuItem 
                onClick={() => onDeleteReport(report.id, playerName)}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete report
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
};

export default ReportRow;
