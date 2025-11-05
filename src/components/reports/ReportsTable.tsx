
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { ReportWithPlayer } from "@/types/report";
import { useAuth } from "@/contexts/AuthContext";
import ReportRow from "./ReportRow";
import ReportsTableHeader from "./ReportsTableHeader";

interface ReportsTableProps {
  reports: ReportWithPlayer[];
  onViewReport: (reportId: string) => void;
  onEditReport?: (reportId: string) => void;
  onDeleteReport: (reportId: string, playerName: string) => void;
}

const ReportsTable = ({ reports, onViewReport, onEditReport, onDeleteReport }: ReportsTableProps) => {
  const { user } = useAuth();

  return (
    <div className="overflow-x-auto">
      <Table>
      <ReportsTableHeader />
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
              />
            );
          })
        ) : (
          <TableRow>
            <TableCell colSpan={9} className="text-center py-6 text-muted-foreground">
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
