import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { Link, useNavigate } from "react-router-dom";
import NotificationsDropdown from "./NotificationsDropdown";
import UnifiedPlayerSearch from "./UnifiedPlayerSearch";
import { ScoutLogo } from './ScoutLogo';
import { ClubBadge } from "@/components/ui/club-badge";

const Header = () => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { isMobile } = useSidebar();

  const getInitials = () => {
    const firstName = profile?.first_name;
    const lastName = profile?.last_name;
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
  };

  return (
    <div className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-50">
      <div className="flex items-center justify-between h-full px-4">
        {/* Mobile Layout: Hamburger - Logo - Nothing */}
        {isMobile ? (
          <>
            <SidebarTrigger />
            <ScoutLogo size="sm" />
            <div className="w-8" /> {/* Spacer for balance */}
          </>
        ) : (
          <>
            {/* Desktop Layout: Trigger + Logo - Search - Actions */}
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <ScoutLogo size="sm" />
            </div>
            
            {/* Search Bar */}
            <div className="flex-1 max-w-md mx-8">
              <UnifiedPlayerSearch 
                variant="header"
                placeholder="Search players"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <NotificationsDropdown />
              
              <ClubBadge clubName="Chelsea F.C." size="sm" />
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={signOut} className="cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Header;