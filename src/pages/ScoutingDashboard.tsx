import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Users, FileText, Search, Filter, Plus, TrendingUp, Target, Clock, CheckCircle } from "lucide-react";
import { useMyScoutingTasks } from "@/hooks/useMyScoutingTasks";
import { useReports } from "@/hooks/useReports";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";

const ScoutingDashboard = () => {
  const { user, profile } = useAuth();
  const { data: allAssignments = [], isLoading: assignmentsLoading } = useMyScoutingTasks();
  const { reports, loading: reportsLoading } = useReports();
  const [searchTerm, setSearchTerm] = useState("");

  // For Scout Managers, show all reports; for Scouts, show only their reports
  const visibleReports = profile?.role === 'recruitment' 
    ? reports.filter(r => r.status === 'submitted')
    : reports.filter(r => r.scoutId === user?.id);

  const stats = {
    totalAssignments: allAssignments.length,
    pendingReports: allAssignments.filter(a => a.status === 'assigned').length,
    completedReports: allAssignments.filter(a => a.status === 'completed').length,
    totalReports: visibleReports.length,
    activeScouts: new Set(allAssignments.map(a => a.assigned_to_scout_id)).size,
  };

  // Recent activity - show different data based on role
  const recentActivity = profile?.role === 'recruitment' 
    ? [
        { type: 'report', player: 'Marcus Johnson', club: 'Arsenal', scout: 'John Smith', time: '2 hours ago' },
        { type: 'assignment', player: 'David Silva', club: 'Chelsea', scout: 'Sarah Jones', time: '5 hours ago' },
        { type: 'match', event: 'Liverpool vs Manchester City', scout: 'Mike Wilson', time: '1 day ago' },
        { type: 'report', player: 'Kevin De Bruyne', club: 'Manchester City', scout: 'Emma Davis', time: '1 day ago' },
        { type: 'assignment', player: 'Bruno Fernandes', club: 'Manchester United', scout: 'Tom Brown', time: '2 days ago' },
      ]
    : visibleReports.slice(0, 5).map(report => ({
        type: 'report',
        player: report.player?.name || 'Unknown Player',
        club: report.player?.club || 'Unknown Club',
        scout: 'Me',
        time: new Date(report.createdAt).toLocaleDateString()
      }));

  const upcomingTasks = allAssignments.slice(0, 5);

  if (assignmentsLoading) {
    return (
      <div className="container mx-auto py-8 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto pb-8 max-w-7xl px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold">
            {profile?.role === 'recruitment' ? 'Scout Management Dashboard' : 'Scouting Dashboard'}
          </h1>
          <p className="text-muted-foreground mt-2">
            {profile?.role === 'recruitment' 
              ? 'Monitor and manage all scouting activities across your team.'
              : 'Track your assignments and scouting progress.'
            }
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Schedule
          </Button>
          <Link to="/report-builder">
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Report
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Assignments</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-bold">{stats.totalAssignments}</div>
            <p className="text-xs text-muted-foreground">Active tasks</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {profile?.role === 'recruitment' ? 'All Reports' : 'My Reports'}
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-bold">{stats.totalReports}</div>
            <p className="text-xs text-muted-foreground">Submitted reports</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Reports</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-bold text-warning-600">{stats.pendingReports}</div>
            <p className="text-xs text-muted-foreground">Awaiting completion</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {profile?.role === 'recruitment' ? 'Active Scouts' : 'Completed'}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-bold text-success-600">
              {profile?.role === 'recruitment' ? stats.activeScouts : stats.completedReports}
            </div>
            <p className="text-xs text-muted-foreground">
              {profile?.role === 'recruitment' ? 'Currently assigned' : 'This month'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="w-2 h-2 rounded-full bg-success-500"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {activity.type === 'report' && `Report submitted for ${activity.player}`}
                      {activity.type === 'assignment' && `New assignment: ${activity.player}`}
                      {activity.type === 'match' && `Match watched: ${activity.event}`}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {activity.club && <span>{activity.club}</span>}
                      <span>•</span>
                      <span>Scout: {activity.scout}</span>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">{activity.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Assignments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Recent Assignments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingTasks.length > 0 ? (
                upcomingTasks.map((task) => (
                  <div key={task.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{task.players?.name}</p>
                      <p className="text-xs text-muted-foreground">{task.players?.club}</p>
                      <p className="text-xs text-muted-foreground">
                        Scout: {task.assigned_to_scout?.first_name} {task.assigned_to_scout?.last_name}
                      </p>
                    </div>
                    <Badge 
                      variant={task.status === 'assigned' ? 'destructive' : 'secondary'}
                      className={task.status === 'assigned' ? 'bg-warning-100 text-warning-800 border-0' : ''}
                    >
                      {task.status === 'assigned' ? 'Pending' : task.status}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-4">No assignments found</p>
              )}
            </div>
            <div className="mt-4">
              <Link to="/scout-management">
                <Button variant="outline" className="w-full">
                  View All Assignments
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {profile?.role === 'recruitment' && (
                <Link to="/scout-management">
                  <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                    <Users className="h-6 w-6" />
                    Manage Scouts
                  </Button>
                </Link>
              )}
              <Link to="/reports">
                <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                  <FileText className="h-6 w-6" />
                  All Reports
                </Button>
              </Link>
              <Link to="/shortlists">
                <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                  <Target className="h-6 w-6" />
                  Shortlists
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ScoutingDashboard;
