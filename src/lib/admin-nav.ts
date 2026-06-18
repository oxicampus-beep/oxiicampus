import type { LucideIcon } from "lucide-react";
import {
  Activity, ArrowLeftRight, Award, Banknote, BarChart3, Bell, Bot, Brain,
  Code2, CreditCard, DollarSign, FileText, Flag, GraduationCap, Image, Key, Layers, LayoutDashboard,
  Lock, MessageCircle, MessageSquare, Network, Package, Radio, ScrollText, Server,
  Settings, Shield, ShoppingBag, Sparkles, Tag, TrendingUp, UserPlus, Users, Wallet, Zap,
} from "lucide-react";

export type AdminNavItem = { label: string; icon: LucideIcon; path: string };
export type AdminNavGroup = { title: string; items: AdminNavItem[] };

export const ADMIN_NAV: AdminNavGroup[] = [
  {
    title: "Main",
    items: [
      { label: "Overview", icon: LayoutDashboard, path: "/admin" },
      { label: "Analytics", icon: BarChart3, path: "/admin/analytics" },
    ],
  },
  {
    title: "Operations",
    items: [
      { label: "Swift Vendor Master", icon: Zap, path: "/admin/swift-vendor" },
      { label: "Agents", icon: Users, path: "/admin/agents" },
      { label: "Sub-Agents", icon: UserPlus, path: "/admin/sub-agents" },
      { label: "Orders", icon: ShoppingBag, path: "/admin/orders" },
      { label: "Mash Up Orders", icon: Layers, path: "/admin/mashup-orders" },
      { label: "Packages", icon: Package, path: "/admin/packages" },
      { label: "Result & Admission", icon: GraduationCap, path: "/admin/result-checkers" },
      { label: "Promo Codes", icon: Tag, path: "/admin/promotions" },
      { label: "Wallet Top-Up", icon: Wallet, path: "/admin/wallet-topup" },
      { label: "Withdrawals", icon: Banknote, path: "/admin/withdrawals" },
      { label: "Reconciliation", icon: ArrowLeftRight, path: "/admin/reconciliation" },
      { label: "Profits", icon: DollarSign, path: "/admin/profits" },
      { label: "Agent Performance", icon: Award, path: "/admin/agent-performance" },
      { label: "P&L Report", icon: TrendingUp, path: "/admin/pnl" },
      { label: "Credit Mgmt", icon: CreditCard, path: "/admin/credit-management" },
      { label: "Broadcast", icon: Radio, path: "/admin/broadcast" },
      { label: "Promo Banners", icon: Image, path: "/admin/banners" },
    ],
  },
  {
    title: "Support & Users",
    items: [
      { label: "Support Tickets", icon: MessageCircle, path: "/admin/tickets" },
      { label: "Notifications", icon: Bell, path: "/admin/notifications" },
      { label: "Engagement Hub", icon: Sparkles, path: "/admin/engagement" },
      { label: "Users", icon: Users, path: "/admin/users" },
    ],
  },
  {
    title: "System",
    items: [
      { label: "Security", icon: Shield, path: "/admin/security" },
      { label: "System Health", icon: Activity, path: "/admin/system-health" },
      { label: "Sentinel AI", icon: Bot, path: "/admin/sentinel" },
      { label: "AI Intelligence Hub", icon: Brain, path: "/admin/ai-strategy" },
      { label: "API Network Intelligence", icon: Network, path: "/admin/api-network" },
      { label: "System Logs", icon: ScrollText, path: "/admin/system-logs" },
      { label: "Feature Flags", icon: Flag, path: "/admin/feature-flags" },
      { label: "SMS Templates", icon: MessageSquare, path: "/admin/sms-templates" },
      { label: "Audit Logs", icon: FileText, path: "/admin/audit-logs" },
      { label: "API Users", icon: Key, path: "/admin/api-users" },
      { label: "API Orders", icon: Code2, path: "/admin/api-orders" },
      { label: "Settings", icon: Settings, path: "/admin/settings" },
    ],
  },
  {
    title: "Account",
    items: [
      { label: "My Security", icon: Lock, path: "/admin/account-settings" },
    ],
  },
];

export const ADMIN_NAV_FLAT = ADMIN_NAV.flatMap(g => g.items);

export function adminNavLabel(pathname: string) {
  return ADMIN_NAV_FLAT.find(i => i.path === pathname || (i.path !== "/admin" && pathname.startsWith(i.path)))?.label
    ?? (pathname === "/admin" || pathname === "/admin/overview" ? "Overview" : "Admin");
}
