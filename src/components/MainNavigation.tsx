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
  FileText, 
  Calendar, 
  Settings, 
  Sparkles,
  MessageSquare,
  Kanban,
  UserCheck,
  Bookmark,
  LogOut,
  MoreVertical
} from "lucide-react";
import { useMyPermissions } from "@/hooks/useUserPermissions";
import { useAuth } from "@/contexts/AuthContext";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import UnifiedPlayerSearch from "./UnifiedPlayerSearch";
import { ScoutLogo } from "./ScoutLogo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const MainNavigation = ({ onAIAssistantClick }: { onAIAssistantClick?: () => void }) => {
  const location = useLocation();
  const { profile, signOut } = useAuth();
  const { data: permissions } = useMyPermissions();
  const { isMobile, setOpenMobile, state } = useSidebar();
  const isCollapsed = state === "collapsed";
  
  const handleNavClick = () => {
    if (isMobile) {
      setOpenMobile(false);
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
      permission: "dashboard",
      exact: true
    },
    {
      title: "Scout Management",
      url: "/scout-management",
      icon: Kanban,
      permission: "user_management",
      allowedRoles: ['recruitment']
    },
    {
      title: "Squad View",
      url: "/squad-view",
      icon: Users,
      permission: "dashboard",
      allowedRoles: ['recruitment', 'director']
    },
    {
      title: "Calendar",
      url: "/calendar",
      icon: Calendar,
      permission: "dashboard",
      allowedRoles: ['scout', 'recruitment']
    },
    {
      title: "Your Assignments",
      url: "/assigned-players",
      icon: UserCheck,
      permission: "dashboard",
      allowedRoles: ['scout', 'recruitment']
    },
    {
      title: "Shortlists",
      url: "/shortlists",
      icon: Bookmark,
      permission: "dashboard",
      allowedRoles: ['recruitment', 'director']
    },
    {
      title: "Reports",
      url: "/reports",
      icon: FileText,
      permission: "reports",
      allowedRoles: ['scout', 'recruitment', 'director']
    }
  ];

  const getInitials = () => {
    const firstName = profile?.first_name;
    const lastName = profile?.last_name;
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
  };

  const getFullName = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    return profile?.first_name || profile?.email || "User";
  };
  
  return (
    <Sidebar collapsible="icon" className="border-r z-40">
      <SidebarContent className="py-4 flex flex-col h-full">
        {/* Logo Section */}
        <div className={cn("px-3 mb-4", isCollapsed && "px-2")}>
          <Link to="/" onClick={handleNavClick}>
            <ScoutLogo size={isCollapsed ? "sm" : "md"} showText={!isCollapsed} />
          </Link>
        </div>

        {/* Search - Hidden when collapsed */}
        {!isCollapsed && (
          <div className="px-3 mb-4">
            <UnifiedPlayerSearch 
              variant="header"
              placeholder="Search..."
            />
          </div>
        )}

        <Separator className="mb-4" />

        {/* Main Navigation */}
        <SidebarGroup className="flex-1">
          <SidebarGroupLabel>MAIN</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems
                .filter(item => {
                  if (item.allowedRoles && profile?.role) {
                    if (!item.allowedRoles.includes(profile.role)) {
                      return false;
                    }
                  }
                  return hasPermission(item.permission);
                })
                .map((item) => {
                  const active = item.exact 
                    ? location.pathname === item.url 
                    : isActive(item.url);
                  
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild 
                        isActive={active} 
                        tooltip={item.title}
                      >
                        <Link 
                          to={item.url} 
                          onClick={handleNavClick}
                          className={cn(
                            "flex items-center gap-3",
                            active && "font-medium"
                          )}
                        >
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Bottom Section */}
        <div className="mt-auto">
          <Separator className="mb-4" />
          
          {/* Settings */}
          <SidebarMenu className="px-2 mb-2">
            <SidebarMenuItem>
              <SidebarMenuButton 
                asChild 
                isActive={isActive("/settings")} 
                tooltip="Settings"
              >
                <Link to="/settings" onClick={handleNavClick}>
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>

          {/* AI Assistant & Saved Chats */}
          <SidebarMenu className="px-2 mb-4">
            <SidebarMenuItem>
              <SidebarMenuButton 
                asChild
                tooltip="Saved Conversations"
              >
                <NavLink 
                  to="/saved-conversations"
                  onClick={handleNavClick}
                >
                  <MessageSquare className="h-4 w-4" />
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
                className="w-full"
              >
                <Sparkles className="h-4 w-4 text-blue-600" />
                <span>AI Scout Assistant</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>

          <Separator className="mb-4" />

          {/* User Profile Section */}
          <div className={cn(
            "px-3",
            isCollapsed && "px-2"
          )}>
            <div className={cn(
              "flex items-center gap-3 py-2",
              isCollapsed && "justify-center"
            )}>
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className="text-xs bg-muted">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              
              {!isCollapsed && (
                <>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {getFullName()}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {profile?.email}
                    </p>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-1 rounded hover:bg-muted transition-colors">
                        <MoreVertical className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem asChild>
                        <Link to="/profile">Profile Settings</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={signOut}>
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}
            </div>
          </div>
        </div>
      </SidebarContent>
    </Sidebar>
  );
};

export default MainNavigation;
