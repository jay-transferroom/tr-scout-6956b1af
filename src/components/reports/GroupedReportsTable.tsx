
import { useState, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Award, Edit, Eye, Users, User, Trash2, MoreHorizontal, ArrowUp, ArrowDown, ArrowUpDown, UserPlus } from "lucide-react";
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
import { PlayerRecommendationView } from "@/components/PlayerRecommendationView";
import VerdictBadge from "@/components/VerdictBadge";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
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

type SortKey =
  | "player"
  | "club"
  | "reportsCount"
  | "latestDate"
  | "status"
  | "latestRating"
  | "recommendation"
  | "scout";

type SortDir = "asc" | "desc";

const GroupedReportRow = ({ groupedReport, onViewReport, onEditReport, onDeleteReport, onViewAllReports, canEdit }: {
  groupedReport: GroupedReport;
  onViewReport: (reportId: string) => void;
  onEditReport?: (reportId: string) => void;
  onDeleteReport: (reportId: string, playerName: string) => void;
  onViewAllReports: (playerId: string, playerName: string) => void;
  canEdit: boolean;
}) => {
  const navigate = useNavigate();
  const latestReport = groupedReport.allReports[0];
  const isCustomPlayer = typeof groupedReport.playerId === 'string' && groupedReport.playerId.startsWith('custom-');
  const { data: fetchedPlayer, isLoading: fetchedLoading, error: playerError } =
    useReportPlayerData(isCustomPlayer ? undefined : groupedReport.playerId);
  const playerData = isCustomPlayer ? ((latestReport.player as any) || null) : fetchedPlayer;
  const playerLoading = isCustomPlayer ? false : fetchedLoading;
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

  const isDisabled = playerLoading || !!playerError || isCustomPlayer;

  return (
    <TableRow
      key={`${groupedReport.playerId}-grouped`}
      className={cn(
        isCustomPlayer && "bg-info/5 hover:bg-info/10 border-l-4 border-l-info"
      )}
    >
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="relative">
            <PlayerAvatar
              playerName={playerName}
              avatarUrl={playerData?.image}
              size="sm"
            />
            {isCustomPlayer && (
              <span
                className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-info text-info-foreground ring-2 ring-background"
                title="Custom player"
              >
                <UserPlus className="h-2.5 w-2.5" />
              </span>
            )}
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-medium text-grey-900 text-sm">{playerName}</span>
              <PlayerRecommendationView playerId={groupedReport.playerId} fallback={null} />
            </div>
            {isCustomPlayer && (
              <span className="text-[10px] uppercase tracking-wide font-semibold text-info">
                Custom player
              </span>
            )}
          </div>
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
        {groupedReport.latestRating !== null && groupedReport.latestRating !== undefined ? (
          <ScoutingGrade grade={groupedReport.latestRating} displayFormat={groupedReport.displayFormat} />
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

const SortableHead = ({
  label,
  sortKey,
  currentKey,
  currentDir,
  onSort,
  icon,
  className,
}: {
  label: string;
  sortKey: SortKey;
  currentKey: SortKey | null;
  currentDir: SortDir;
  onSort: (k: SortKey) => void;
  icon?: React.ReactNode;
  className?: string;
}) => {
  const active = currentKey === sortKey;
  const Icon = active ? (currentDir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
  return (
    <TableHead className={className}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={cn(
          "inline-flex items-center gap-1 -ml-1 px-1 py-0.5 rounded hover:bg-muted transition-colors",
          active ? "text-foreground font-semibold" : "text-muted-foreground"
        )}
      >
        {icon}
        <span>{label}</span>
        <Icon className={cn("h-3 w-3", active ? "opacity-100" : "opacity-50")} />
      </button>
    </TableHead>
  );
};

const GroupedReportsTable = ({ reports, onViewReport, onEditReport, onDeleteReport, onViewAllReports }: GroupedReportsTableProps) => {
  const { user } = useAuth();
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const groupedReports = useMemo(() => groupReportsByPlayer(reports), [reports]);

  const sortedGroupedReports = useMemo(() => {
    if (!sortKey) return groupedReports;
    const arr = [...groupedReports];
    const dir = sortDir === "asc" ? 1 : -1;
    const getVal = (g: GroupedReport): string | number => {
      const latest = g.allReports[0];
      switch (sortKey) {
        case "player": return (latest.player?.name || "").toLowerCase();
        case "club": return (latest.player?.club || "").toLowerCase();
        case "reportsCount": return g.reportCount;
        case "latestDate": return new Date(latest.createdAt).getTime();
        case "status": return latest.status || "";
        case "latestRating": return g.latestRating ?? g.avgRating ?? -Infinity;
        case "recommendation": return (getRecommendation(latest) || "").toLowerCase();
        case "scout": {
          const p = latest.scoutProfile;
          return `${p?.first_name || ""} ${p?.last_name || ""}`.trim().toLowerCase();
        }
        default: return 0;
      }
    };
    arr.sort((a, b) => {
      const va = getVal(a);
      const vb = getVal(b);
      if (va < vb) return -1 * dir;
      if (va > vb) return 1 * dir;
      return 0;
    });
    return arr;
  }, [groupedReports, sortKey, sortDir]);

  return (
    <div className="overflow-x-auto">
      <Table>
      <TableHeader>
        <TableRow>
          <SortableHead label="Player" sortKey="player" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
          <SortableHead label="Club" sortKey="club" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
          <TableHead>Positions</TableHead>
          <SortableHead label="Reports Count" sortKey="reportsCount" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
          <SortableHead label="Latest Report" sortKey="latestDate" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
          <SortableHead label="Status" sortKey="status" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} className="w-[100px]" />
          <SortableHead
            label="Latest Rating"
            sortKey="latestRating"
            currentKey={sortKey}
            currentDir={sortDir}
            onSort={handleSort}
            icon={<Award size={14} />}
          />
          <SortableHead label="Recommendation" sortKey="recommendation" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
          <SortableHead label="Scout" sortKey="scout" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
          <TableHead className="w-[80px] text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedGroupedReports.length > 0 ? (
          sortedGroupedReports.map((groupedReport: GroupedReport) => {
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
