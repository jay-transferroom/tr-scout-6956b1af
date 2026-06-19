
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { ReportWithPlayer } from "@/types/report";
import { useAuth } from "@/contexts/AuthContext";
import ReportRow from "./ReportRow";
import ReportsTableHeader, { IndividualSortKey, IndividualSortDir } from "./ReportsTableHeader";

interface ReportsTableProps {
  reports: ReportWithPlayer[];
  onViewReport: (reportId: string) => void;
  onEditReport?: (reportId: string) => void;
  onDeleteReport: (reportId: string, playerName: string) => void;
  sortKey?: IndividualSortKey | null;
  sortDir?: IndividualSortDir;
  onSort?: (k: IndividualSortKey) => void;
  showRecommendation?: boolean;
}

const ReportsTable = ({ reports, onViewReport, onEditReport, onDeleteReport, sortKey, sortDir, onSort, showRecommendation = true }: ReportsTableProps) => {
  const { user } = useAuth();

  return (
    <div className="overflow-x-auto">
      <Table>
      <ReportsTableHeader sortKey={sortKey} sortDir={sortDir} onSort={onSort} showRecommendation={showRecommendation} />
      <TableBody>
        {reports.length > 0 ? (
          reports.map((report) => {
            const canEdit = user && report.scoutId === user.id;

            return (
              <ReportRow
                key={report.id}
                report={report}
                onViewReport={onViewReport}
                onEditReport={onEditReport}
                onDeleteReport={onDeleteReport}
                canEdit={canEdit}
                showRecommendation={showRecommendation}
              />
            );
          })
        ) : (
          <TableRow>
            <TableCell colSpan={showRecommendation ? 11 : 10} className="text-center py-6 text-muted-foreground">
              No reports found.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
      </Table>
    </div>
  );
};

export default ReportsTable;
