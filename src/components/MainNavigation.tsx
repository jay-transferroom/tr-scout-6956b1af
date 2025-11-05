
import { Link, useLocation, NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { 
  Home, 
  Users, 
  Search, 
  FileText, 
  Calendar, 
  Settings, 
  PlusCircle, 
  TrendingUp, 
  User,
  Sparkles,
  MessageSquare,
  Kanban,
  UserCheck,
  Bookmark,
  Bell,
  LogOut
} from "lucide-react";
import { useMyPermissions } from "@/hooks/useUserPermissions";
import { useAuth } from "@/contexts/AuthContext";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import UnifiedPlayerSearch from "./UnifiedPlayerSearch";
import { ClubBadge } from "@/components/ui/club-badge";
import NotificationsDropdown from "./NotificationsDropdown";
import { useNotifications } from "@/hooks/useNotifications";
import { Badge } from "@/components/ui/badge";

const MainNavigation = ({ onAIAssistantClick }: { onAIAssistantClick?: () => void }) => {
  const location = useLocation();
  const { profile, signOut } = useAuth();
  const { data: permissions } = useMyPermissions();
  const { isMobile, setOpen } = useSidebar();
  const { data: notifications = [] } = useNotifications();
  const unreadCount = notifications.filter(n => !n.read).length;
  
  const handleNavClick = () => {
    if (isMobile) {
      setOpen(false);
    }
  };
  
  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };

  const hasPermission = (permission: string) => {
    return permissions?.[permission] !== false;
  };

  const mainItems = [
    {
      title: "Home",
      url: "/",
      icon: Home,
      permission: "dashboard"
    },
    {
      title: "Transfers In",
      url: "/transfers-in",
      icon: UserCheck,
      permission: "dashboard",
      allowedRoles: ['director'] // Only for director
    },
    {
      title: "Scout Management",
      url: "/scout-management",
      icon: Kanban,
      permission: "user_management",
      allowedRoles: ['recruitment'] // Only for recruitment
    },
    {
      title: "Squad View",
      url: "/squad-view",
      icon: Users,
      permission: "dashboard",
      allowedRoles: ['recruitment', 'director'] // For recruitment and director
    },
    {
      title: "Calendar",
      url: "/calendar",
      icon: Calendar,
      permission: "dashboard",
      allowedRoles: ['scout', 'recruitment'] // Not for director
    },
    {
      title: "Your Assignments",
      url: "/assigned-players",
      icon: UserCheck,
      permission: "dashboard",
      allowedRoles: ['scout', 'recruitment'] // Not for director
    },
    {
      title: "Shortlists",
      url: "/shortlists",
      icon: Bookmark,
      permission: "dashboard",
      allowedRoles: ['recruitment', 'director'] // For recruitment and director
    },
    {
      title: "Reports",
      url: "/reports",
      icon: FileText,
      permission: "reports",
      allowedRoles: ['scout', 'recruitment', 'director'] // For all roles
    }
  ];

  const accountItems = [
    {
      title: "Profile",
      url: "/profile",
      icon: User,
    },
    {
      title: "Settings",
      url: "/settings",
      icon: Settings,
    }
  ];

  const getInitials = () => {
    const firstName = profile?.first_name;
    const lastName = profile?.last_name;
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
  };
  
  return (
    <Sidebar collapsible="icon" className="border-r z-40">
      <SidebarContent className={cn("pt-20 pb-4", isMobile && "pt-4")}>
        {/* Mobile-only: Search, Club, User Profile Section at Top */}
        {isMobile && (
          <>
            <SidebarGroup>
              <SidebarGroupContent className="px-2">
                {/* User Profile */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 mb-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>{getInitials()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">
                      {profile?.first_name} {profile?.last_name}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {profile?.email}
                    </div>
                  </div>
                </div>

                {/* Club Badge */}
                <div className="mb-3">
                  <ClubBadge clubName="Chelsea F.C." size="md" />
                </div>

                {/* Search */}
                <div className="mb-3">
                  <UnifiedPlayerSearch 
                    variant="header"
                    placeholder="Search players..."
                  />
                </div>

                {/* Notifications */}
                <Link to="/notifications" className="block" onClick={handleNavClick}>
                  <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <Bell className="h-5 w-5" />
                      <span className="text-sm font-medium">Notifications</span>
                    </div>
                    {unreadCount > 0 && (
                      <Badge variant="destructive" className="h-5 min-w-5 flex items-center justify-center text-xs px-1.5">
                        {unreadCount}
                      </Badge>
                    )}
                  </div>
                </Link>
              </SidebarGroupContent>
            </SidebarGroup>
            <Separator className="my-2" />
          </>
        )}

        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems
                .filter(item => {
                  // Check if user's role is allowed for this item
                  if (item.allowedRoles && profile?.role) {
                    if (!item.allowedRoles.includes(profile.role)) {
                      console.log(`Filtering out ${item.title} - user role: ${profile.role}, allowed: ${item.allowedRoles}`);
                      return false;
                    }
                  }
                  return hasPermission(item.permission);
                })
                .map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                    <Link to={item.url} onClick={handleNavClick} className={cn(isMobile && "text-base py-3")}>
                      <item.icon className={cn("h-4 w-4", isMobile && "h-5 w-5")} />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Account</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {accountItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                    <Link to={item.url} onClick={handleNavClick} className={cn(isMobile && "text-base py-3")}>
                      <item.icon className={cn("h-4 w-4", isMobile && "h-5 w-5")} />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {/* Mobile-only: Sign Out */}
              {isMobile && (
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={signOut} tooltip="Sign out" className="text-base py-3">
                    <LogOut className="h-5 w-5" />
                    <span>Sign out</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      {/* AI Assistant and Saved Chats at the very bottom */}
      <div className="mt-auto border-t">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild
                  tooltip="Saved Conversations"
                >
                  <NavLink 
                    to="/saved-conversations"
                    onClick={handleNavClick}
                    className={({ isActive }) => 
                      cn(
                        isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "",
                        isMobile && "text-base py-3"
                      )
                    }
                  >
                    <MessageSquare className={cn("h-4 w-4", isMobile && "h-5 w-5")} />
                    <span>Saved Conversations</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  tooltip="AI Scout Assistant"
                  onClick={() => {
                    onAIAssistantClick?.();
                    handleNavClick();
                  }}
                  className={cn("w-full", isMobile && "text-base py-3")}
                >
                  <Sparkles className={cn("h-4 w-4 text-blue-600", isMobile && "h-5 w-5")} />
                  <span>AI Scout Assistant</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </div>
    </Sidebar>
  );
};

export default MainNavigation;
