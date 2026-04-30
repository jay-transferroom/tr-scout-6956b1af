
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { File, FileText, BookmarkCheck } from "lucide-react";
import { useReports } from "@/hooks/useReports";
import { useAuth } from "@/contexts/AuthContext";

interface ReportsTabNavigationProps {
  onTabChange: (value: string) => void;
  activeTab: string;
}

const ReportsTabNavigation = ({ onTabChange, activeTab }: ReportsTabNavigationProps) => {
  const { reports } = useReports();
  const { user, profile } = useAuth();
  const isManager = profile?.role !== 'scout';

  // `useReports` already merges match_scouting_reports into its result and
  // assigns them status 'draft' or 'submitted' based on whether the primary
  // rating has been filled. Derive all counts from the unified list so a
  // single saved match draft doesn't double-count against another source.
  const myReports = reports.filter(report => report.scoutId === user?.id);
  const draftCount = myReports.filter(report => report.status === 'draft').length;

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
