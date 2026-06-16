import { Outlet, Navigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import AnnouncementPopup from "@/components/notifications/AnnouncementPopup";
import OrderTrackerFab from "@/components/orders/OrderTrackerFab";
import { Button } from "@/components/ui/button";
import { LogOut, Wallet } from "lucide-react";

export default function DashboardLayout() {
  const { user, loading, signOut } = useAuth();
  const { profile } = useProfile();

  if (loading) return <div className="min-h-screen grid place-items-center text-muted-foreground">Loading…</div>;
  if (!user) return <Navigate to="/auth" replace />;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-16 flex items-center justify-between gap-4 px-4 md:px-6 border-b border-border bg-background/80 backdrop-blur sticky top-0 z-30">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="text-foreground" />
              <span className="font-display font-semibold text-lg hidden md:inline">Dashboard</span>
            </div>
            <div className="flex items-center gap-2 md:gap-4">
              <div className="flex items-center gap-2 rounded-full bg-primary/10 border border-primary/30 px-3 py-1.5">
                <Wallet className="h-4 w-4 text-primary" />
                <span className="font-bold text-sm md:text-base">₵{Number(profile?.wallet_balance ?? 0).toFixed(2)}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={signOut} className="gap-2">
                <LogOut className="h-4 w-4" /><span className="hidden md:inline">Logout</span>
              </Button>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
            <Outlet />
          </main>
          <AnnouncementPopup />
          <OrderTrackerFab />
        </div>
      </div>
    </SidebarProvider>
  );
}
