import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Wallet, History, Smartphone, Radio, Signal, Wifi,
  UserPlus, Sparkles, Store, ShoppingCart, Banknote, Code2, Settings, AlertCircle, Shield, Users, BarChart3, Bell, Trophy
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, useSidebar
} from "@/components/ui/sidebar";
import { useIsAdmin } from "@/hooks/useRoles";

const main = [
  { title: "Overview", url: "/dashboard", icon: LayoutDashboard },
  { title: "Wallet", url: "/dashboard/wallet", icon: Wallet },
  { title: "Rewards", url: "/dashboard/rewards", icon: Trophy },
  { title: "Transaction History", url: "/dashboard/transactions", icon: History },
];

const buyData = [
  { title: "Buy MTN Data", url: "/dashboard/buy/mtn", icon: Smartphone },
  { title: "AT iShare Data", url: "/dashboard/buy/at-ishare", icon: Radio },
  { title: "AT BigTime Data", url: "/dashboard/buy/at-bigtime", icon: Signal },
  { title: "Buy Telecel Data", url: "/dashboard/buy/telecel", icon: Wifi },
];

const services = [
  { title: "AFA Registration", url: "/dashboard/afa", icon: UserPlus },
  { title: "Extra Services", url: "/dashboard/extras", icon: Sparkles },
];

const store = [
  { title: "My Store", url: "/dashboard/store", icon: Store },
  { title: "Store Orders", url: "/dashboard/store/orders", icon: ShoppingCart },
  { title: "Store Withdrawal", url: "/dashboard/store/withdrawal", icon: Banknote },
];

const account = [
  { title: "Developer API", url: "/dashboard/developer", icon: Code2 },
  { title: "My Settings", url: "/dashboard/settings", icon: Settings },
  { title: "Report an Issue", url: "/dashboard/report", icon: AlertCircle },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();
  const { isAdmin } = useIsAdmin();

  const renderGroup = (label: string, items: typeof main) => (
    <SidebarGroup>
      {!collapsed && <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground/70 px-3 pt-2">{label}</SidebarGroupLabel>}
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const active = pathname === item.url;
            return (
              <SidebarMenuItem key={item.url}>
                <SidebarMenuButton asChild isActive={active} className="h-12">
                  <NavLink to={item.url} end className={({ isActive }) =>
                    `flex items-center gap-3 rounded-md px-3 transition-colors ${
                      isActive ? "bg-primary/15 text-primary font-semibold" : "hover:bg-sidebar-accent text-sidebar-foreground"
                    }`
                  }>
                    <item.icon className="h-5 w-5 shrink-0" />
                    {!collapsed && <span className="text-[15px]">{item.title}</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="px-4 py-5 border-b border-sidebar-border">
        <NavLink to="/dashboard" className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg bg-primary grid place-items-center font-black text-primary-foreground text-lg">B</div>
          {!collapsed && <span className="font-display font-bold text-xl tracking-tight">ByteBoss</span>}
        </NavLink>
      </SidebarHeader>

      <SidebarContent className="gap-1">
        {renderGroup("Main", main)}
        {renderGroup("Buy Data", buyData)}
        {renderGroup("Services", services)}
        {renderGroup("Store", store)}
        {renderGroup("Account", account)}
        {isAdmin && renderGroup("Admin", [
          { title: "Overview", url: "/admin/overview", icon: BarChart3 },
          { title: "Orders", url: "/admin/orders", icon: ShoppingCart },
          { title: "Users", url: "/admin/users", icon: Users },
          { title: "Manage Packages", url: "/admin/packages", icon: Shield },
          { title: "Notifications", url: "/admin/notifications", icon: Bell },
          { title: "Settings", url: "/admin/settings", icon: Settings },
        ])}
      </SidebarContent>
    </Sidebar>
  );
}
