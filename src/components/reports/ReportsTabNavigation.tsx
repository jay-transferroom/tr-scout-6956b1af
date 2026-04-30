
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { File, FileText, BookmarkCheck } from "lucide-react";
import { useReports } from "@/hooks/useReports";
import { useAllMatchScoutingReports } from "@/hooks/useAllMatchScoutingReports";
import { useAuth } from "@/contexts/AuthContext";

interface ReportsTabNavigationProps {
  onTabChange: (value: string) => void;
  activeTab: string;
}

const ReportsTabNavigation = ({ onTabChange, activeTab }: ReportsTabNavigationProps) => {
  const { reports } = useReports();
  const { data: matchReports = [] } = useAllMatchScoutingReports();
  const { user, profile } = useAuth();
  const isManager = profile?.role !== 'scout';

  // Count reports for current user
  const myReports = reports.filter(report => report.scoutId === user?.id);
  const reportDraftCount = myReports.filter(report => report.status === 'draft').length;

  // Match drafts: rows in match_scouting_reports where rating is null and the
  // current user authored them. These are surfaced under Match → My Drafts.
  const matchDraftCount = matchReports.reduce((sum, m) => {
    return (
      sum +
      m.reports.filter((r) => r.scout_id === user?.id && r.rating === null).length
    );
  }, 0);

  const draftCount = reportDraftCount + matchDraftCount;

  const submittedCount = isManager
    ? reports.filter(r => r.status === 'submitted').length
    : myReports.filter(report => report.status === 'submitted').length;
  const allCount = isManager ? reports.length : myReports.length;

  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="mb-6">
      <TabsList className="grid w-full max-w-md grid-cols-3">
        <TabsTrigger value="all-reports" className="flex items-center gap-2">
          <BookmarkCheck className="h-4 w-4" />
          <span>All Reports ({allCount})</span>
        </TabsTrigger>
        <TabsTrigger value="my-reports" className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          <span>Submitted ({submittedCount})</span>
        </TabsTrigger>
        <TabsTrigger value="my-drafts" className="flex items-center gap-2">
          <File className="h-4 w-4" />
          <span>Drafts ({draftCount})</span>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
};

export default ReportsTabNavigation;
