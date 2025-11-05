
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Outlet, useLocation } from "react-router-dom";
import MainNavigation from "./MainNavigation";
import Header from "./Header";
import ChatOverlay from "./ChatOverlay";
import { useState, useEffect } from "react";

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
    <SidebarProvider defaultOpen={false}>
      <div className="min-h-screen flex w-full">
        <MainNavigation onAIAssistantClick={openNewChat} />
        <SidebarInset>
          <Header />
          <main className="flex-1 p-2 sm:p-6">
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
