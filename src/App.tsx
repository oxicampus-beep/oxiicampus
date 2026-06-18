import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProfileProvider } from "@/contexts/ProfileContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import AdminLayout from "@/components/admin/AdminLayout";
import Auth from "@/pages/Auth";
import Overview from "@/pages/Overview";
import WalletPage from "@/pages/WalletPage";
import Transactions from "@/pages/Transactions";
import BuyMTN from "@/pages/BuyMTN";
import BuyATIshare from "@/pages/BuyATIshare";
import BuyATBigTime from "@/pages/BuyATBigTime";
import BuyTelecel from "@/pages/BuyTelecel";
import AFA from "@/pages/AFA";
import ExtraServices from "@/pages/ExtraServices";
import Rewards from "@/pages/Rewards";
import MyStore from "@/pages/MyStore";
import StoreOrders from "@/pages/StoreOrders";
import StoreWithdrawal from "@/pages/StoreWithdrawal";
import DeveloperAPI from "@/pages/DeveloperAPI";
import SettingsPage from "@/pages/SettingsPage";
import ReportIssue from "@/pages/ReportIssue";
import AdminPackages from "@/pages/AdminPackages";
import AdminOverview from "@/pages/AdminOverview";
import AdminOrders from "@/pages/AdminOrders";
import AdminUsers from "@/pages/AdminUsers";
import AdminSettings from "@/pages/AdminSettings";
import AdminAnnouncements from "@/pages/AdminAnnouncements";
import AdminAnalytics from "@/pages/admin/AdminAnalytics";
import AdminSwiftVendor from "@/pages/admin/AdminSwiftVendor";
import AdminAgents from "@/pages/admin/AdminAgents";
import AdminSubAgents from "@/pages/admin/AdminSubAgents";
import AdminMashUpOrders from "@/pages/admin/AdminMashUpOrders";
import AdminPromotions from "@/pages/admin/AdminPromotions";
import AdminWalletTopup from "@/pages/admin/AdminWalletTopup";
import AdminWithdrawals from "@/pages/admin/AdminWithdrawals";
import AdminReconciliation from "@/pages/admin/AdminReconciliation";
import AdminProfits from "@/pages/admin/AdminProfits";
import AdminAgentPerformance from "@/pages/admin/AdminAgentPerformance";
import AdminPnL from "@/pages/admin/AdminPnL";
import AdminCreditManagement from "@/pages/admin/AdminCreditManagement";
import AdminBroadcast from "@/pages/admin/AdminBroadcast";
import AdminBanners from "@/pages/admin/AdminBanners";
import AdminTickets from "@/pages/admin/AdminTickets";
import AdminEngagement from "@/pages/admin/AdminEngagement";
import AdminSecurity from "@/pages/admin/AdminSecurity";
import AdminSystemHealth from "@/pages/admin/AdminSystemHealth";
import { AdminSentinelAI, AdminAIStrategy, AdminAPINetwork, AdminSmsTemplates } from "@/pages/admin/AdminAiPages";
import AdminSystemLogs from "@/pages/admin/AdminSystemLogs";
import AdminFeatureFlags from "@/pages/admin/AdminFeatureFlags";
import AdminAuditLogs from "@/pages/admin/AdminAuditLogs";
import AdminAPIUsers from "@/pages/admin/AdminAPIUsers";
import AdminAPIOrders from "@/pages/admin/AdminAPIOrders";
import AdminAccountSettings from "@/pages/admin/AdminAccountSettings";
import Storefront from "@/pages/Storefront";
import ApiDocs from "@/pages/ApiDocs";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <ProfileProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/auth" replace />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/api-docs" element={<ApiDocs />} />
            <Route path="/store/:slug" element={<Storefront />} />
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<Overview />} />
              <Route path="wallet" element={<WalletPage />} />
              <Route path="transactions" element={<Transactions />} />
              <Route path="buy/mtn" element={<BuyMTN />} />
              <Route path="buy/at-ishare" element={<BuyATIshare />} />
              <Route path="buy/at-bigtime" element={<BuyATBigTime />} />
              <Route path="buy/telecel" element={<BuyTelecel />} />
              <Route path="afa" element={<AFA />} />
              <Route path="extras" element={<ExtraServices />} />
              <Route path="rewards" element={<Rewards />} />
              <Route path="store" element={<MyStore />} />
              <Route path="store/packages" element={<Navigate to="/dashboard/store" replace />} />
              <Route path="store/orders" element={<StoreOrders />} />
              <Route path="store/withdrawal" element={<StoreWithdrawal />} />
              <Route path="developer" element={<DeveloperAPI />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="report" element={<ReportIssue />} />
            </Route>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminOverview />} />
              <Route path="overview" element={<Navigate to="/admin" replace />} />
              <Route path="analytics" element={<AdminAnalytics />} />
              <Route path="swift-vendor" element={<AdminSwiftVendor />} />
              <Route path="agents" element={<AdminAgents />} />
              <Route path="sub-agents" element={<AdminSubAgents />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="mashup-orders" element={<AdminMashUpOrders />} />
              <Route path="packages" element={<AdminPackages />} />
              <Route path="promotions" element={<AdminPromotions />} />
              <Route path="wallet-topup" element={<AdminWalletTopup />} />
              <Route path="withdrawals" element={<AdminWithdrawals />} />
              <Route path="reconciliation" element={<AdminReconciliation />} />
              <Route path="profits" element={<AdminProfits />} />
              <Route path="agent-performance" element={<AdminAgentPerformance />} />
              <Route path="pnl" element={<AdminPnL />} />
              <Route path="credit-management" element={<AdminCreditManagement />} />
              <Route path="broadcast" element={<AdminBroadcast />} />
              <Route path="banners" element={<AdminBanners />} />
              <Route path="tickets" element={<AdminTickets />} />
              <Route path="notifications" element={<AdminAnnouncements />} />
              <Route path="engagement" element={<AdminEngagement />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="security" element={<AdminSecurity />} />
              <Route path="system-health" element={<AdminSystemHealth />} />
              <Route path="sentinel" element={<AdminSentinelAI />} />
              <Route path="ai-strategy" element={<AdminAIStrategy />} />
              <Route path="api-network" element={<AdminAPINetwork />} />
              <Route path="system-logs" element={<AdminSystemLogs />} />
              <Route path="feature-flags" element={<AdminFeatureFlags />} />
              <Route path="sms-templates" element={<AdminSmsTemplates />} />
              <Route path="audit-logs" element={<AdminAuditLogs />} />
              <Route path="api-users" element={<AdminAPIUsers />} />
              <Route path="api-orders" element={<AdminAPIOrders />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="account-settings" element={<AdminAccountSettings />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
          </ProfileProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
