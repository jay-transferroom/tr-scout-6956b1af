import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Outlet, useLocation } from "react-router-dom";
import MainNavigation from "./MainNavigation";
import ChatOverlay from "./ChatOverlay";
import { useState, useEffect } from "react";
import { ClubBadge } from "@/components/ui/club-badge";

const Layout = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatId, setChatId] = useState<string | undefined>();
  const location = useLocation();

  useEffect(() => {
    // Check if we need to open a specific chat from SavedChats navigation
    if (location.state?.openChat) {
      setChatId(location.state.openChat);
      setIsChatOpen(true);
      // Clear the state to prevent reopening on refresh
      window.history.replaceState({}, '', location.pathname);
    }
  }, [location]);

  const openNewChat = () => {
    setChatId(undefined); // Clear any existing chat ID for new chat
    setIsChatOpen(true);
  };
  
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full min-w-0 overflow-x-hidden">
        <MainNavigation onAIAssistantClick={openNewChat} />
        <SidebarInset className="w-full max-w-full min-w-0 overflow-x-hidden">
          {/* Minimal top bar with sidebar trigger and club badge */}
          <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
            <div className="flex items-center justify-between h-14 px-4">
              <SidebarTrigger />
              <ClubBadge clubName="Chelsea F.C." size="md" showLabel />
            </div>
          </div>
          <main className="w-full max-w-full min-w-0 flex-1 overflow-x-hidden">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
      <ChatOverlay 
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        chatId={chatId}
      />
    </SidebarProvider>
  );
};

export default Layout;
