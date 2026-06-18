import {
  LayoutDashboard, User, Shield, Wallet, RefreshCw, History, Bell, Smartphone,
  Radio, Wifi, Phone, Zap, UserPlus, Sparkles, Store, ShoppingCart, Banknote,
  AlertCircle, BookUser, Users, Trophy, Tag, Code2, Image, Megaphone, BarChart3,
  Send, Bot, GraduationCap, Settings, Package,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type DashboardNavItem = {
  label: string;
  to: string;
  icon: LucideIcon;
  badge?: "new" | "hot";
  agentOnly?: boolean;
  userOnly?: boolean;
  matchPrefix?: boolean;
};

export type DashboardNavGroup = {
  label: string;
  items: DashboardNavItem[];
  agentOnly?: boolean;
};

export const accountNav: DashboardNavItem[] = [
  { label: "Overview", to: "/dashboard", icon: LayoutDashboard },
  { label: "My Profile", to: "/dashboard/profile", icon: User },
  { label: "Account & Security", to: "/dashboard/account-settings", icon: Shield },
  { label: "Account Balance", to: "/dashboard/wallet", icon: Wallet },
  { label: "Auto-Renewal", to: "/dashboard/schedule", icon: RefreshCw, badge: "new" },
  { label: "Transactions", to: "/dashboard/transactions", icon: History },
  { label: "Inbox Notifications", to: "/dashboard/notifications", icon: Bell },
];

export const buyDataNav: DashboardNavItem[] = [
  { label: "Buy MTN Data", to: "/dashboard/buy-data/mtn", icon: Smartphone, matchPrefix: true },
  { label: "Buy Telecel Data", to: "/dashboard/buy-data/telecel", icon: Wifi, matchPrefix: true },
  { label: "Buy AirtelTigo Data", to: "/dashboard/buy-data/airteltigo", icon: Radio, matchPrefix: true },
  { label: "Buy Airtime", to: "/dashboard/buy-airtime", icon: Phone, badge: "new" },
];

export const servicesNav: DashboardNavItem[] = [
  { label: "Utility Bills", to: "/dashboard/utilities", icon: Zap },
  { label: "AFA Registration", to: "/dashboard/afa", icon: UserPlus, badge: "new" },
  { label: "Extra Services", to: "/dashboard/extras", icon: Sparkles },
  { label: "Rewards & Spin", to: "/dashboard/rewards", icon: Trophy },
  { label: "Referral Program", to: "/dashboard/referral", icon: Users },
  { label: "Report Issue", to: "/dashboard/report-issue", icon: AlertCircle },
  { label: "Address Book", to: "/dashboard/customers", icon: BookUser },
];

export const storeNav: DashboardNavItem[] = [
  { label: "My Store", to: "/dashboard/my-store", icon: Store, agentOnly: true },
  { label: "Store Orders", to: "/dashboard/store/orders", icon: ShoppingCart, agentOnly: true },
  { label: "Store Settings", to: "/dashboard/store-settings", icon: Settings, agentOnly: true },
];

export const agentToolsNav: DashboardNavItem[] = [
  { label: "Agent Prices", to: "/dashboard/agent-prices", icon: Tag, agentOnly: true },
  { label: "Withdrawals", to: "/dashboard/withdrawals", icon: Banknote, agentOnly: true },
  { label: "Subagents", to: "/dashboard/subagents", icon: Users, agentOnly: true },
  { label: "My API Access", to: "/dashboard/api", icon: Code2, agentOnly: true },
  { label: "Marketing Tools", to: "/dashboard/marketing", icon: Megaphone, agentOnly: true },
  { label: "Flyer Generator", to: "/dashboard/flyer", icon: Image, agentOnly: true },
  { label: "Agent Leaderboard", to: "/dashboard/leaderboard", icon: BarChart3, agentOnly: true },
  { label: "Bulk Disbursement", to: "/dashboard/bulk", icon: Send, agentOnly: true },
  { label: "WhatsApp Bot", to: "/dashboard/whatsapp-bot", icon: Bot, agentOnly: true },
  { label: "Result Checker", to: "/dashboard/result-checker", icon: GraduationCap, agentOnly: true },
];

export const dashboardNavGroups = (isAgent: boolean): DashboardNavGroup[] => {
  const filter = (items: DashboardNavItem[]) =>
    items.filter(i => (!i.agentOnly || isAgent) && (!i.userOnly || !isAgent));

  const groups: DashboardNavGroup[] = [
    { label: "Account", items: filter(accountNav) },
    { label: "Buy Data", items: filter(buyDataNav) },
    { label: "Services", items: filter(servicesNav) },
  ];

  if (isAgent) {
    groups.push({ label: "Store", items: filter(storeNav), agentOnly: true });
    groups.push({ label: "Agent Tools", items: filter(agentToolsNav), agentOnly: true });
  } else {
    groups.push({
      label: "Agent Program",
      items: [
        { label: "Become an Agent", to: "/dashboard/my-store", icon: Package },
        { label: "Become a Sub-Agent", to: "/dashboard/extras", icon: Users },
      ],
    });
  }

  return groups;
};

export function isNavActive(pathname: string, item: DashboardNavItem) {
  if (item.to === "/dashboard") return pathname === "/dashboard";
  if (item.matchPrefix) return pathname === item.to || pathname.startsWith(item.to + "/");
  return pathname === item.to || pathname.startsWith(item.to + "/");
}
