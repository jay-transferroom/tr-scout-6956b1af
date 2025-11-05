
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Award, Edit, Eye, Users, User, Trash2, MoreHorizontal } from "lucide-react";
import { ReportWithPlayer } from "@/types/report";
import { getRatingColor, formatDate } from "@/utils/reportFormatting";
import { getRecommendation } from "@/utils/reportDataExtraction";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { groupReportsByPlayer, GroupedReport } from "@/utils/reportGrouping";
import { useReportPlayerData } from "@/hooks/useReportPlayerData";
import { PlayerAvatar } from "@/components/ui/player-avatar";
import { ClubBadge } from "@/components/ui/club-badge";
import { ScoutingGrade } from "@/components/ui/scouting-grade";
import VerdictBadge from "@/components/VerdictBadge";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface GroupedReportsTableProps {
  reports: ReportWithPlayer[];
  onViewReport: (reportId: string) => void;
  onEditReport?: (reportId: string) => void;
  onDeleteReport: (reportId: string, playerName: string) => void;
  onViewAllReports: (playerId: string, playerName: string) => void;
}

const GroupedReportRow = ({ groupedReport, onViewReport, onEditReport, onDeleteReport, onViewAllReports, canEdit }: {
  groupedReport: GroupedReport;
  onViewReport: (reportId: string) => void;
  onEditReport?: (reportId: string) => void;
  onDeleteReport: (reportId: string, playerName: string) => void;
  onViewAllReports: (playerId: string, playerName: string) => void;
  canEdit: boolean;
}) => {
  const navigate = useNavigate();
  const { data: playerData, isLoading: playerLoading, error: playerError } = useReportPlayerData(groupedReport.playerId);
  const latestReport = groupedReport.allReports[0];
  const recommendation = getRecommendation(latestReport);

  const playerName = playerLoading ? 'Loading...' : 
                     playerError ? 'Unknown Player' :
                     playerData?.name || 'Unknown Player';
                     
  const playerClub = playerLoading ? 'Loading...' : 
                     playerError ? 'Unknown' :
                     playerData?.club || 'Unknown';
                     
  const playerPositions = playerLoading ? [] : 
                          playerError ? [] :
                          playerData?.positions || [];

  const handleViewPlayerProfile = () => {
    if (playerData) {
      if (playerData.isPrivatePlayer) {
        navigate(`/private-player/${groupedReport.playerId}`);
      } else {
        navigate(`/player/${groupedReport.playerId}`);
      }
    }
  };

  const isDisabled = playerLoading || !!playerError;

  return (
    <TableRow key={`${groupedReport.playerId}-grouped`}>
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
          {playerPositions.map((position, index) => (
            <Badge key={index} variant="neutral" className="text-xs">
              {position}
            </Badge>
          ))}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Users size={14} className="text-muted-foreground" />
          <span className="font-medium">{groupedReport.reportCount}</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="text-sm text-grey-600">
          {formatDate(latestReport.createdAt)}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Badge variant={latestReport.status === "submitted" ? "success" : "neutral"} className="text-xs font-medium">
            {latestReport.status === "draft" ? "Draft" : "Submitted"}
          </Badge>
        </div>
      </TableCell>
      <TableCell>
        {groupedReport.avgRating !== null && groupedReport.avgRating !== undefined ? (
          <ScoutingGrade grade={groupedReport.avgRating} />
        ) : (
          <span className="text-grey-400 text-sm">-</span>
        )}
      </TableCell>
      <TableCell>
        {recommendation ? (
          <VerdictBadge verdict={recommendation} />
        ) : (
          <span className="text-grey-400 text-sm">-</span>
        )}
      </TableCell>
      <TableCell>
        <div className="text-sm text-grey-700">
          {latestReport.scoutProfile?.first_name && latestReport.scoutProfile?.last_name 
            ? `${latestReport.scoutProfile.first_name} ${latestReport.scoutProfile.last_name}`
            : latestReport.scoutProfile?.first_name || "Scout"}
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
            <DropdownMenuItem onClick={() => onViewAllReports(groupedReport.playerId, playerName)}>
              <Eye className="h-4 w-4 mr-2" />
              View all reports ({groupedReport.reportCount})
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onViewReport(latestReport.id)}>
              <Eye className="h-4 w-4 mr-2" />
              View latest report
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleViewPlayerProfile} disabled={isDisabled}>
              <User className="h-4 w-4 mr-2" />
              View player profile
            </DropdownMenuItem>
            {canEdit && onEditReport && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onEditReport(latestReport.id)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit latest report
                </DropdownMenuItem>
              </>
            )}
            {canEdit && (
              <DropdownMenuItem 
                onClick={() => onDeleteReport(latestReport.id, playerName)}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete latest report
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
};

const GroupedReportsTable = ({ reports, onViewReport, onEditReport, onDeleteReport, onViewAllReports }: GroupedReportsTableProps) => {
  const { user } = useAuth();
  const groupedReports = groupReportsByPlayer(reports);

  return (
    <div className="overflow-x-auto">
      <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Player</TableHead>
          <TableHead>Club</TableHead>
          <TableHead>Positions</TableHead>
          <TableHead>Reports Count</TableHead>
          <TableHead>Latest Report</TableHead>
          <TableHead className="w-[100px]">Status</TableHead>
          <TableHead>
            <div className="flex items-center gap-1">
              <Award size={14} />
              <span>Avg Rating</span>
            </div>
          </TableHead>
          <TableHead>Recommendation</TableHead>
          <TableHead>Scout</TableHead>
          <TableHead className="w-[80px] text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {groupedReports.length > 0 ? (
          groupedReports.map((groupedReport: GroupedReport) => {
            const canEdit = user && groupedReport.scoutId === user.id;

            return (
              <GroupedReportRow
                key={`${groupedReport.playerId}-grouped`}
                groupedReport={groupedReport}
                onViewReport={onViewReport}
                onEditReport={onEditReport}
                onDeleteReport={onDeleteReport}
                onViewAllReports={onViewAllReports}
                canEdit={canEdit}
              />
            );
          })
        ) : (
          <TableRow>
            <TableCell colSpan={10} className="text-center py-6 text-muted-foreground">
              No reports found.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
      </Table>
    </div>
  );
};

export default GroupedReportsTable;
