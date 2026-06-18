import { useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { AdminGuard } from "@/components/admin/AdminGuard";
import AdminCommandPalette from "@/components/admin/AdminCommandPalette";
import { ADMIN_NAV } from "@/lib/admin-nav";
import { adminNavLabel } from "@/lib/admin-nav";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { cn } from "@/lib/utils";
import {
  ChevronRight, LogOut, Menu, Moon, Search, Shield, Sun, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

function AdminSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { signOut } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [dark, setDark] = useState(true);

  const isActive = (path: string) =>
    path === "/admin" ? pathname === "/admin" || pathname === "/admin/overview" : pathname === path || pathname.startsWith(path + "/");

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth", { replace: true });
  };

  return (
    <div className="flex flex-col h-full relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-32 blur-[50px] pointer-events-none bg-amber-500/8" />

      <div className="p-5 flex items-center gap-3 relative z-10">
        <div className="relative shrink-0">
          <div className="p-2 rounded-xl border border-white/10 bg-white/5 shadow-sm">
            <div className="w-8 h-8 rounded-lg bg-primary grid place-items-center font-black text-primary-foreground text-lg">B</div>
          </div>
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center border-2 border-[#0a0a0f] shadow-lg">
            <Shield className="w-3 h-3 text-white" />
          </div>
        </div>
        <div className="min-w-0">
          <p className="font-black tracking-tight leading-none text-base text-white">
            Admin<span className="text-amber-500">Pro</span>
          </p>
          <p className="text-[10px] font-bold uppercase tracking-widest mt-0.5 text-white/35">Control Center</p>
        </div>
      </div>

      {profile && (
        <div className="mx-4 mb-3 px-3 py-2.5 rounded-xl border border-white/5 bg-white/[0.03] flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-amber-400/15 border border-amber-400/20 flex items-center justify-center shrink-0">
            <Shield className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold truncate text-white/90">{profile.full_name || "Admin"}</p>
            <p className="text-[10px] text-white/35 truncate">Administrator</p>
          </div>
        </div>
      )}

      <nav className="flex-1 px-3 overflow-y-auto py-1 relative z-10 scrollbar-none space-y-4">
        {ADMIN_NAV.map(group => (
          <div key={group.title}>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] px-2 mb-1.5 text-white/25">{group.title}</p>
            <div className="space-y-0.5">
              {group.items.map(item => {
                const active = isActive(item.path);
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onNavigate}
                    className={cn(
                      "group flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all border",
                      active
                        ? "bg-amber-400/10 text-amber-400 border-amber-400/20 shadow-[0_0_12px_rgba(251,191,36,0.04)]"
                        : "text-white/55 hover:text-white hover:bg-white/5 border-transparent",
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <item.icon className={cn("w-4 h-4 shrink-0", active ? "text-amber-500" : "text-white/35 group-hover:text-white/70")} />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {active && <ChevronRight className="w-3.5 h-3.5 shrink-0 text-amber-400/40" />}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-3 relative z-10 space-y-2">
        <button
          type="button"
          onClick={() => setDark(d => !d)}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium border text-white/55 hover:text-white bg-white/[0.03] hover:bg-white/[0.06] border-white/5 transition-all"
        >
          {dark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-gray-500" />}
          <span>{dark ? "Switch to Light Mode" : "Switch to Dark Mode"}</span>
        </button>
        <button
          type="button"
          onClick={handleSignOut}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-bold text-red-500 border border-red-500/20 bg-red-500/10 hover:bg-red-500/15 transition-all"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </div>
  );
}

export default function AdminLayout() {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { pathname } = useLocation();
  const pageTitle = adminNavLabel(pathname);

  return (
    <AdminGuard>
      <div className="min-h-screen flex bg-[#050508] text-white selection:bg-amber-400/30 relative">
        <div className="fixed inset-0 pointer-events-none opacity-20 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent" />

        <AdminCommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />

        <aside className="hidden md:flex w-[280px] flex-col shrink-0 sticky top-0 h-screen p-4 pr-2 relative z-20">
          <div className="flex-1 rounded-[24px] overflow-hidden border border-white/10 bg-[#0a0a0f]/60 backdrop-blur-3xl shadow-2xl flex flex-col">
            <AdminSidebar />
          </div>
        </aside>

        {mobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
            <div className="absolute left-0 top-0 bottom-0 w-[280px] bg-[#0a0a0f] border-r border-white/10 p-4">
              <button type="button" className="absolute top-4 right-4 text-white/50" onClick={() => setMobileOpen(false)}>
                <X className="h-5 w-5" />
              </button>
              <AdminSidebar onNavigate={() => setMobileOpen(false)} />
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col min-w-0 relative z-10">
          <header className="sticky top-0 z-30 flex items-center justify-between gap-4 px-4 md:px-8 py-4 border-b border-white/10 bg-[#050508]/80 backdrop-blur-xl">
            <div className="flex items-center gap-3 min-w-0">
              <Button variant="ghost" size="icon" className="md:hidden text-white" onClick={() => setMobileOpen(true)}>
                <Menu className="h-5 w-5" />
              </Button>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/30">AdminPro</p>
                <h1 className="font-bold text-lg truncate">{pageTitle}</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="hidden sm:flex gap-2 border-white/10 bg-white/5 text-white/70 hover:text-white hover:bg-white/10"
                onClick={() => setPaletteOpen(true)}
              >
                <Search className="h-4 w-4" />
                Search
                <kbd className="text-[10px] border border-white/10 rounded px-1.5 py-0.5 text-white/40">⌘K</kbd>
              </Button>
              <Button variant="ghost" size="icon" className="sm:hidden text-white" onClick={() => setPaletteOpen(true)}>
                <Search className="h-5 w-5" />
              </Button>
            </div>
          </header>

          <main className="flex-1 p-4 md:p-8 max-w-[1600px] w-full mx-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </AdminGuard>
  );
}
