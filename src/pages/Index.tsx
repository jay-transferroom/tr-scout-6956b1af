import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { FileText, Users, Calendar, Target, Plus, TrendingUp, AlertCircle, UserPlus, Search, List, User, Eye, Star, Bookmark, UserCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useReports } from "@/hooks/useReports";
import DirectorDashboard from "./DirectorDashboard";
import { Badge } from "@/components/ui/badge";
import { useShortlists } from "@/hooks/useShortlists";
import { useScoutingAssignments } from "@/hooks/useScoutingAssignments";
import { useScouts } from "@/hooks/useScouts";
import { getOverallRating, getRecommendation } from "@/utils/reportDataExtraction";
import VerdictBadge from "@/components/VerdictBadge";
import { useReportPlayerData } from "@/hooks/useReportPlayerData";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlayerAvatar } from "@/components/ui/player-avatar";
import { ClubBadge } from "@/components/ui/club-badge";
import { ScoutingGrade } from "@/components/ui/scouting-grade";
import { formatDate } from "@/utils/reportFormatting";
import QuickActionsBar from "@/components/QuickActionsBar";
import UpcomingMatches from "@/components/UpcomingMatches";
import AIScoutAssistant from "@/components/AIScoutAssistant";

const Index = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { reports, loading } = useReports();
  const { shortlists, loading: shortlistsLoading } = useShortlists();
  const { data: assignments = [], isLoading: assignmentsLoading } = useScoutingAssignments();
  const { data: scouts = [], isLoading: scoutsLoading } = useScouts();

  // Route to appropriate dashboard based on user role
  if (profile?.role === 'director') {
    return <DirectorDashboard />;
  }

  const myReports = reports.filter(report => report.scoutId === user?.id);
  const draftReports = myReports.filter(report => report.status === 'draft');
  const submittedReports = myReports.filter(report => report.status === 'submitted');

  // For Recent Reports section, show different data based on user role
  const recentReportsToShow = profile?.role === 'recruitment' 
    ? reports.filter(r => r.status === 'submitted').slice(0, 5) // Show all submitted reports for managers
    : myReports.slice(0, 5); // Show user's own reports for scouts

  const quickActions = [
    {
      title: "Create Report",
      description: "New scouting report",
      icon: Plus,
      action: () => navigate("/report-builder"),
      variant: "default" as const,
      primary: true,
    },
    {
      title: "Add Private Player",
      description: "Player not in database",
      icon: UserPlus,
      action: null,
      variant: "outline" as const,
      isDialog: true,
    },
    {
      title: "Player Search",
      description: "Find players to scout",
      icon: Search,
      action: () => navigate("/search"),
      variant: "outline" as const,
    },
    {
      title: "View Reports",
      description: "Browse all reports",
      icon: FileText,
      action: () => navigate("/reports"),
      variant: "outline" as const,
    },
    {
      title: "Shortlists",
      description: "Recruitment targets",
      icon: List,
      action: () => navigate("/shortlists"),
      variant: "outline" as const,
    },
    {
      title: "Calendar",
      description: "Upcoming matches",
      icon: Calendar,
      action: () => navigate("/calendar"),
      variant: "outline" as const,
    },
  ];

  // Calculate dashboard statistics
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
  
  // Reports created in last month
  const reportsLastMonth = (profile?.role === 'recruitment' ? reports : myReports).filter(report => {
    const reportDate = new Date(report.createdAt);
    return reportDate >= lastMonth;
  });
  
  // Total shortlisted players (excluding scouting assignment list)
  const totalShortlistedPlayers = shortlists
    .filter(list => !list.is_scouting_assignment_list)
    .reduce((total, list) => total + (list.playerIds?.length || 0), 0);
  
  // Players added to shortlists in last week
  const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const recentShortlistAdditions = shortlists
    .filter(list => !list.is_scouting_assignment_list && list.updated_at)
    .filter(list => new Date(list.updated_at!) >= lastWeek)
    .reduce((total, list) => total + (list.playerIds?.length || 0), 0);
  
  // Assigned players and scouts with assignments
  const totalAssignedPlayers = assignments.length;
  const scoutsWithAssignments = new Set(assignments.map(a => a.assigned_to_scout_id)).size;
  const scoutsWithoutAssignments = scouts.filter(s => s.role === 'scout').length - scoutsWithAssignments;
  const totalScouts = scouts.filter(s => s.role === 'scout').length;

  // Scout-specific stats
  const myAssignments = assignments.filter(a => a.assigned_to_scout_id === user?.id);
  const myDraftReports = myReports.filter(r => r.status === 'draft');
  const myCompletedReports = myReports.filter(r => r.status === 'submitted');

  const stats = profile?.role === 'recruitment' ? [
    {
      title: "Reports Created Last Month",
      subtitle: "",
      value: loading ? 0 : reportsLastMonth.length,
      description: "New reports this month",
      icon: FileText,
      trend: loading ? "Loading..." : `${reports.length} total reports`,
      route: "/reports?tab=all-reports"
    },
    {
      title: "Shortlisted Players", 
      subtitle: "",
      value: shortlistsLoading ? 0 : totalShortlistedPlayers,
      description: "Players on shortlists",
      icon: Bookmark,
      trend: shortlistsLoading ? "Loading..." : `${recentShortlistAdditions} added recently`,
      route: "/shortlists"
    },
    {
      title: "Assigned Players",
      subtitle: "",
      value: assignmentsLoading ? 0 : totalAssignedPlayers,
      description: "Players with scout assignments",
      icon: UserCheck,
      trend: assignmentsLoading ? "Loading..." : `${scoutsWithAssignments} scouts assigned`,
      route: "/scout-management"
    },
    {
      title: "Scouts Available",
      subtitle: "",
      value: scoutsLoading ? 0 : scoutsWithoutAssignments,
      description: "Scouts without assignments",
      icon: Users,
      trend: scoutsLoading ? "Loading..." : `${totalScouts} total scouts`,
      route: "/scout-management"
    },
  ] : [
    {
      title: "Reports Created",
      subtitle: "",
      value: loading ? 0 : myReports.length,
      description: "Total reports by you",
      icon: FileText,
      trend: loading ? "Loading..." : `${reportsLastMonth.length} this month`,
      route: "/reports"
    },
    {
      title: "Your Assigned Players",
      subtitle: "",
      value: assignmentsLoading ? 0 : myAssignments.length,
      description: "Players assigned to you",
      icon: UserCheck,
      trend: assignmentsLoading ? "Loading..." : `${myAssignments.filter(a => a.status === 'assigned').length} pending`,
      route: "/assigned-players"
    },
    {
      title: "Your Drafts",
      subtitle: "",
      value: loading ? 0 : myDraftReports.length,
      description: "Draft reports",
      icon: FileText,
      trend: loading ? "Loading..." : "Ready to submit",
      route: "/reports?tab=my-reports&status=draft"
    },
    {
      title: "Your Completed Reports",
      subtitle: "",
      value: loading ? 0 : myCompletedReports.length,
      description: "Submitted reports",
      icon: Star,
      trend: loading ? "Loading..." : `${myCompletedReports.filter(r => {
        const reportDate = new Date(r.createdAt);
        return reportDate >= lastMonth;
      }).length} this month`,
      route: "/reports?tab=my-reports&status=submitted"
    },
  ];

  const getUserDisplayName = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    if (profile?.first_name) {
      return profile.first_name;
    }
    return user?.email || 'Scout';
  };

  const getScoutName = (report: any) => {
    if (report.scoutProfile?.first_name && report.scoutProfile?.last_name) {
      return `${report.scoutProfile.first_name} ${report.scoutProfile.last_name}`;
    }
    if (report.scoutProfile?.first_name) {
      return report.scoutProfile.first_name;
    }
    return report.scoutProfile?.email || 'Unknown Scout';
  };

  return (
    <div className="container mx-auto py-8 max-w-7xl">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">
              {profile?.role === 'recruitment' ? 'Scout Management Dashboard' : 'Scout Dashboard'}
            </h1>
            <p className="text-muted-foreground">
              Welcome back, {getUserDisplayName()}. Here's your scouting overview.
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            
            return (
              <Card 
                key={index} 
                className="cursor-pointer hover:bg-accent transition-colors"
                onClick={() => navigate(stat.route)}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="space-y-1">
                    <CardTitle className="text-sm font-medium">
                      {stat.title}
                    </CardTitle>
                    {stat.subtitle && (
                      <p className="text-xs text-muted-foreground font-medium">
                        {stat.subtitle}
                      </p>
                    )}
                  </div>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">
                    {stat.description}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stat.trend}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>


        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Quick Actions Bar */}
            <QuickActionsBar />

            {/* AI Scout Assistant */}
            <AIScoutAssistant />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Upcoming Matches */}
            <UpcomingMatches />
          </div>
        </div>

        {/* Recent Reports - Full width section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold">Recent Reports</h2>
              <p className="text-sm text-muted-foreground">
                {profile?.role === 'recruitment' 
                  ? 'Latest submitted reports from all scouts'
                  : 'Your most recent scouting activity'
                }
              </p>
            </div>
            <Badge variant="secondary">{recentReportsToShow.length} of {profile?.role === 'recruitment' ? reports.length : myReports.length}</Badge>
          </div>
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Loading reports...</p>
          ) : recentReportsToShow.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Player</TableHead>
                    <TableHead>Club</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Verdict</TableHead>
                    <TableHead>Scout</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentReportsToShow.map((report) => (
                    <RecentReportTableRow 
                      key={report.id} 
                      report={report} 
                      profile={profile}
                      navigate={navigate}
                    />
                  ))}
                </TableBody>
              </Table>
              <div className="mt-4">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate("/reports")}
                >
                  View All Reports ({profile?.role === 'recruitment' ? reports.length : myReports.length})
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-6">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No reports yet</p>
              <Button onClick={() => navigate("/report-builder")}>
                Create Your First Report
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Component to display individual report items in table format
const RecentReportTableRow = ({ report, profile, navigate }) => {
  const { data: playerData, isLoading: playerLoading } = useReportPlayerData(report.playerId);
  const rating = getOverallRating(report);
  const verdict = getRecommendation(report);

  const playerName = playerLoading ? 'Loading...' : 
                     playerData?.name || `Player ID: ${report.playerId}`;
  const playerClub = playerLoading ? 'Loading...' : 
                     playerData?.club || 'Unknown Club';

  const getScoutName = (report: any) => {
    if (report.scoutProfile?.first_name && report.scoutProfile?.last_name) {
      return `${report.scoutProfile.first_name} ${report.scoutProfile.last_name}`;
    }
    if (report.scoutProfile?.first_name) {
      return report.scoutProfile.first_name;
    }
    return report.scoutProfile?.email || 'Unknown Scout';
  };

  return (
    <TableRow 
      className="cursor-pointer hover:bg-accent transition-colors"
      onClick={() => navigate(`/report/${report.id}`)}
    >
      <TableCell>
        <div className="flex items-center gap-3">
          <PlayerAvatar 
            playerName={playerName}
            avatarUrl={playerData?.image}
            size="sm"
          />
          <span className="font-medium">{playerName}</span>
        </div>
      </TableCell>
      <TableCell>
        <ClubBadge clubName={playerClub} size="sm" />
      </TableCell>
      <TableCell>
        <div className="text-sm text-muted-foreground">
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
        {rating !== null && rating !== undefined ? (
          <ScoutingGrade grade={rating} />
        ) : (
          <span className="text-muted-foreground text-sm">-</span>
        )}
      </TableCell>
      <TableCell>
        {verdict ? (
          <VerdictBadge verdict={verdict} />
        ) : (
          <span className="text-muted-foreground text-sm">-</span>
        )}
      </TableCell>
      <TableCell>
        <div className="text-sm text-muted-foreground">
          {profile?.role === 'recruitment' ? getScoutName(report) : 'You'}
        </div>
      </TableCell>
      <TableCell className="text-right">
        <Button variant="ghost" size="sm">
          <Eye className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
};

export default Index;
