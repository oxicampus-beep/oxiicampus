import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, useSidebar,
} from "@/components/ui/sidebar";
import { useIsAdmin } from "@/hooks/useRoles";
import { useIsAgent } from "@/hooks/useIsAgent";
import { dashboardNavGroups, isNavActive, type DashboardNavItem } from "@/lib/dashboard-nav";
import { Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

function NavBadge({ badge }: { badge?: "new" | "hot" }) {
  if (!badge) return null;
  return (
    <Badge className="text-[8px] h-4 px-1.5 font-black uppercase border-none bg-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.4)]">
      {badge}
    </Badge>
  );
}

function NavItemLink({ item, collapsed }: { item: DashboardNavItem; collapsed: boolean }) {
  const { pathname } = useLocation();
  const active = isNavActive(pathname, item);

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={active} className="h-11">
        <NavLink
          to={item.to}
          end={item.to === "/dashboard"}
          className={cn(
            "group flex items-center justify-between px-3 rounded-xl text-sm font-bold transition-all duration-200",
            active
              ? "text-primary bg-gradient-to-r from-primary/20 to-transparent border-l-2 border-primary shadow-lg shadow-primary/5"
              : "text-muted-foreground hover:text-foreground hover:bg-white/5",
          )}
        >
          <div className="flex items-center gap-3 min-w-0">
            <item.icon className={cn("h-4 w-4 shrink-0 transition-transform group-hover:scale-110", active ? "text-primary" : "text-muted-foreground")} />
            {!collapsed && <span className="truncate">{item.label}</span>}
          </div>
          {!collapsed && <NavBadge badge={item.badge} />}
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { isAdmin } = useIsAdmin();
  const { isAgent } = useIsAgent();
  const groups = dashboardNavGroups(isAgent);

  return (
    <Sidebar collapsible="icon" className="border-r border-white/10 bg-[#0A0A0F]/95 backdrop-blur-xl">
      <SidebarHeader className="px-4 py-5 border-b border-white/10">
        <NavLink to="/dashboard" className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-amber-600 grid place-items-center font-black text-primary-foreground text-lg shadow-lg shadow-primary/30">B</div>
          {!collapsed && (
            <div>
              <span className="font-display font-black text-lg tracking-tight block">ByteBoss</span>
              <span className="text-[9px] font-bold uppercase tracking-widest text-primary/80">Data Reseller Hub</span>
            </div>
          )}
        </NavLink>
      </SidebarHeader>

      <SidebarContent className="gap-0.5 py-2">
        {groups.map(group => (
          <SidebarGroup key={group.label}>
            {!collapsed && (
              <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-white/25 px-4 pt-3 font-black">
                {group.label}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map(item => (
                  <NavItemLink key={item.to} item={item} collapsed={collapsed} />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}

        {isAdmin && (
          <SidebarGroup>
            {!collapsed && <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-white/25 px-4 pt-3 font-black">Admin</SidebarGroupLabel>}
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild className="h-11">
                    <NavLink to="/admin" className="flex items-center gap-3 px-3 rounded-xl text-sm font-bold text-muted-foreground hover:text-primary hover:bg-white/5">
                      <Shield className="h-4 w-4" />
                      {!collapsed && <span>Control Center</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
