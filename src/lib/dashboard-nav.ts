import {
  LayoutDashboard, User, Shield, Wallet, RefreshCw, History, Bell, Smartphone,
  Radio, Wifi, Phone, Zap, UserPlus, Sparkles, Store, ShoppingCart, Banknote,
  AlertCircle, BookUser, Users, Trophy, Tag, Code2, Image, Megaphone, BarChart3,
  Send, Bot, GraduationCap, Settings, Package, DollarSign,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type DashboardNavItem = {
  label: string;
  to: string;
  icon: LucideIcon;
  badge?: "new" | "hot";
  /** Visible when user has agent or sub-agent dashboard access */
  resellerOnly?: boolean;
  /** Hidden from sub-agents (parent agents only) */
  parentAgentOnly?: boolean;
  userOnly?: boolean;
  matchPrefix?: boolean;
};

export type DashboardNavGroup = {
  label: string;
  items: DashboardNavItem[];
  resellerOnly?: boolean;
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
  { label: "Buy Data", to: "/dashboard/buy-data", icon: Smartphone, badge: "hot", matchPrefix: true },
  { label: "MTN Bundles", to: "/dashboard/buy-data/mtn", icon: Smartphone, matchPrefix: true },
  { label: "Telecel Bundles", to: "/dashboard/buy-data/telecel", icon: Wifi, matchPrefix: true },
  { label: "AirtelTigo Bundles", to: "/dashboard/buy-data/airteltigo", icon: Radio, matchPrefix: true },
  { label: "Buy Airtime", to: "/dashboard/buy-airtime", icon: Phone, badge: "new" },
];

export const servicesNav: DashboardNavItem[] = [
  { label: "Utility Bills", to: "/dashboard/utilities", icon: Zap },
  { label: "Result & Admission", to: "/dashboard/result-checker", icon: GraduationCap },
  { label: "AFA Registration", to: "/dashboard/afa", icon: UserPlus, badge: "new" },
  { label: "Extra Services", to: "/dashboard/extras", icon: Sparkles },
  { label: "Rewards & Spin", to: "/dashboard/rewards", icon: Trophy },
  { label: "Referral Program", to: "/dashboard/referral", icon: Users },
  { label: "Report Issue", to: "/dashboard/report-issue", icon: AlertCircle },
  { label: "Address Book", to: "/dashboard/customers", icon: BookUser },
];

export const storeNav: DashboardNavItem[] = [
  { label: "My Store", to: "/dashboard/my-store", icon: Store, resellerOnly: true },
  { label: "Store Orders", to: "/dashboard/store/orders", icon: ShoppingCart, resellerOnly: true },
  { label: "Store Settings", to: "/dashboard/store-settings", icon: Settings, resellerOnly: true },
];

export const agentToolsNav: DashboardNavItem[] = [
  { label: "My Prices", to: "/dashboard/agent-prices", icon: Tag, resellerOnly: true },
  { label: "Withdrawals", to: "/dashboard/withdrawals", icon: Banknote, resellerOnly: true },
  { label: "Subagents", to: "/dashboard/subagents", icon: Users, resellerOnly: true, parentAgentOnly: true },
  { label: "Sub-agent Pricing", to: "/dashboard/subagent-pricing", icon: DollarSign, resellerOnly: true, parentAgentOnly: true },
  { label: "My API Access", to: "/dashboard/api", icon: Code2, resellerOnly: true },
  { label: "Marketing Tools", to: "/dashboard/marketing", icon: Megaphone, resellerOnly: true },
  { label: "Flyer Generator", to: "/dashboard/flyer", icon: Image, resellerOnly: true },
  { label: "Agent Leaderboard", to: "/dashboard/leaderboard", icon: BarChart3, resellerOnly: true },
  { label: "Bulk Disbursement", to: "/dashboard/bulk", icon: Send, resellerOnly: true },
  { label: "WhatsApp Bot", to: "/dashboard/whatsapp-bot", icon: Bot, resellerOnly: true },
];

export function dashboardNavGroups(showAgentNav: boolean, canRecruitSubAgents: boolean): DashboardNavGroup[] {
  const filter = (items: DashboardNavItem[]) =>
    items.filter(i => {
      if (i.resellerOnly && !showAgentNav) return false;
      if (i.parentAgentOnly && !canRecruitSubAgents) return false;
      if (i.userOnly && showAgentNav) return false;
      return true;
    });

  const groups: DashboardNavGroup[] = [
    { label: "Buy Data", items: filter(buyDataNav) },
    { label: "Account", items: filter(accountNav) },
    { label: "Services", items: filter(servicesNav) },
  ];

  if (showAgentNav) {
    groups.push({ label: "Store", items: filter(storeNav), resellerOnly: true });
    groups.push({
      label: canRecruitSubAgents ? "Agent Tools" : "Sub-agent Tools",
      items: filter(agentToolsNav),
      resellerOnly: true,
    });
  } else {
    groups.push({
      label: "Agent Program",
      items: [
        { label: "Become an Agent", to: "/dashboard/my-store", icon: Package },
      ],
    });
  }

  return groups;
}

export function isNavActive(pathname: string, item: DashboardNavItem) {
  if (item.to === "/dashboard") return pathname === "/dashboard";
  if (item.to === "/dashboard/buy-data") {
    return pathname === "/dashboard/buy-data";
  }
  if (item.matchPrefix) return pathname === item.to || pathname.startsWith(item.to + "/");
  return pathname === item.to || pathname.startsWith(item.to + "/");
}
