import { Outlet, Navigate, Link } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useIsAgent } from "@/hooks/useIsAgent";
import AnnouncementPopup from "@/components/notifications/AnnouncementPopup";
import PlatformBanners from "@/components/platform/PlatformBanners";
import OrderTrackerFab from "@/components/orders/OrderTrackerFab";
import WelcomeOnboarding from "@/components/auth/WelcomeOnboarding";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogOut, Wallet, Trophy, Bell, ArrowUpRight } from "lucide-react";

export default function DashboardLayout() {
  const { user, loading, signOut } = useAuth();
  const { profile } = useProfile();
  const { isAgent } = useIsAgent();

  if (loading) return <div className="min-h-screen grid place-items-center text-muted-foreground">Loading…</div>;
  if (!user) return <Navigate to="/auth" replace />;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-[#050508]">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-16 flex items-center justify-between gap-3 px-4 md:px-6 border-b border-white/10 bg-black/40 backdrop-blur-xl sticky top-0 z-30">
            <div className="flex items-center gap-3 min-w-0">
              <SidebarTrigger className="text-foreground shrink-0" />
              <div className="hidden md:block min-w-0">
                <span className="font-display font-bold text-base">Dashboard</span>
                <Badge variant="outline" className="ml-2 text-[10px] font-black uppercase border-primary/30 text-primary">
                  {isAgent ? "Agent" : "User"}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to="/dashboard/notifications"
                className="h-9 w-9 rounded-xl bg-white/5 border border-white/10 grid place-items-center hover:bg-white/10 transition-colors"
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4 text-muted-foreground" />
              </Link>
              <Link
                to="/dashboard/rewards"
                className="hidden sm:flex items-center gap-2 rounded-xl bg-amber-500/10 border border-amber-500/25 px-3 py-1.5 hover:bg-amber-500/15 transition-colors"
              >
                <Trophy className="h-4 w-4 text-amber-400" />
                <span className="font-black text-sm">{Number(profile?.points_balance ?? 0)}</span>
              </Link>
              <Link
                to="/dashboard/wallet"
                className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-2 sm:px-3 py-1.5 hover:bg-white/10 transition-colors"
              >
                <Wallet className="h-4 w-4 text-primary shrink-0" />
                <span className="font-black text-sm">₵{Number(profile?.wallet_balance ?? 0).toFixed(2)}</span>
                <span className="hidden lg:inline-flex items-center gap-0.5 text-[9px] font-black uppercase bg-indigo-500 hover:bg-indigo-400 text-white px-2 py-1 rounded-lg ml-1">
                  Top Up <ArrowUpRight className="h-3 w-3" />
                </span>
              </Link>
              <Button variant="ghost" size="sm" onClick={signOut} className="gap-1.5 text-muted-foreground hover:text-foreground">
                <LogOut className="h-4 w-4" /><span className="hidden md:inline text-xs font-bold">Sign Out</span>
              </Button>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto overflow-x-hidden">
            <PlatformBanners />
            <Outlet />
          </main>
          <AnnouncementPopup />
          <OrderTrackerFab />
          <WelcomeOnboarding />
        </div>
      </div>
    </SidebarProvider>
  );
}
