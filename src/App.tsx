
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import Layout from "@/components/Layout";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "@/pages/Index";
import Auth from "@/pages/Auth";
import PlayerProfile from "@/pages/PlayerProfile";
import PrivatePlayerProfile from "@/pages/PrivatePlayerProfile";
import ReportBuilder from "@/pages/ReportBuilder";
import ReportView from "@/pages/ReportView";
import ReportEdit from "@/pages/ReportEdit";
import ReportsList from "@/pages/ReportsList";
import SearchResults from "@/pages/SearchResults";
import Calendar from "@/pages/Calendar";
import Settings from "@/pages/Settings";
import Profile from "@/pages/Profile";
import NotFound from "@/pages/NotFound";
import TemplateAdmin from "@/pages/TemplateAdmin";
import ScoutManagement from "@/pages/ScoutManagement";
import ScoutingDashboard from "@/pages/ScoutingDashboard";
import AssignedPlayers from "@/pages/AssignedPlayers";
import UserManagement from "@/pages/admin/UserManagement";
import NotificationsList from "@/pages/NotificationsList";
import Shortlists from "@/pages/Shortlists";
import SquadView from "@/pages/SquadView";
import TransfersIn from "@/pages/TransfersIn";
import TransfersLayout from "@/pages/transfers/TransfersLayout";
import RequirementsList from "@/pages/transfers/RequirementsList";
import TransfersRequirementDetails from "@/pages/transfers/RequirementDetails";
import RequirementDetailsPage from "@/pages/RequirementDetails";
import ScoutingTasks from "@/pages/transfers/ScoutingTasks";
import UpcomingMatches from "@/pages/transfers/UpcomingMatches";
import PlayerPitches from "@/pages/transfers/PlayerPitches";
import DataImport from "@/pages/transfers/DataImport";
import SavedConversations from "@/pages/SavedChats";
import MatchScouting from "@/pages/MatchScouting";
import AppInitializer from "@/components/AppInitializer";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppInitializer>
          <Router>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route element={<Layout />}>
                <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
                <Route path="/player/:id" element={<ProtectedRoute><PlayerProfile /></ProtectedRoute>} />
                <Route path="/private-player/:id" element={<ProtectedRoute><PrivatePlayerProfile /></ProtectedRoute>} />
                <Route path="/report-builder" element={<ProtectedRoute><ReportBuilder /></ProtectedRoute>} />
                <Route path="/report/:id" element={<ProtectedRoute><ReportView /></ProtectedRoute>} />
                <Route path="/report/:id/edit" element={<ProtectedRoute><ReportEdit /></ProtectedRoute>} />
                <Route path="/reports" element={<ProtectedRoute><ReportsList /></ProtectedRoute>} />
                <Route path="/search" element={<ProtectedRoute><SearchResults /></ProtectedRoute>} />
                <Route path="/calendar" element={<ProtectedRoute><Calendar /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/template-admin" element={<ProtectedRoute><TemplateAdmin /></ProtectedRoute>} />
                <Route path="/scout-management" element={<ProtectedRoute><ScoutManagement /></ProtectedRoute>} />
                <Route path="/scouting-dashboard" element={<ProtectedRoute><ScoutingDashboard /></ProtectedRoute>} />
                <Route path="/assigned-players" element={<ProtectedRoute><AssignedPlayers /></ProtectedRoute>} />
                <Route path="/admin/users" element={<ProtectedRoute><UserManagement /></ProtectedRoute>} />
                <Route path="/notifications" element={<ProtectedRoute><NotificationsList /></ProtectedRoute>} />
                <Route path="/shortlists" element={<ProtectedRoute><Shortlists /></ProtectedRoute>} />
                <Route path="/saved-conversations" element={<ProtectedRoute><SavedConversations /></ProtectedRoute>} />
                <Route path="/match-scouting" element={<ProtectedRoute><MatchScouting /></ProtectedRoute>} />
                <Route path="/squad-view" element={<ProtectedRoute><SquadView /></ProtectedRoute>} />
                <Route path="/transfers-in" element={<ProtectedRoute><TransfersIn /></ProtectedRoute>} />
                <Route path="/transfers-in/requirement/:requirementName" element={<ProtectedRoute><RequirementDetailsPage /></ProtectedRoute>} />
                <Route path="/transfers" element={<ProtectedRoute><TransfersLayout /></ProtectedRoute>}>
                  <Route index element={<RequirementsList />} />
                  <Route path="requirements/:id" element={<TransfersRequirementDetails />} />
                  <Route path="scouting-tasks" element={<ScoutingTasks />} />
                  <Route path="upcoming-matches" element={<UpcomingMatches />} />
                  <Route path="player-pitches" element={<PlayerPitches />} />
                  <Route path="data-import" element={<DataImport />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
            <Toaster />
            <SonnerToaster />
          </Router>
        </AppInitializer>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
