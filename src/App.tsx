import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProfileProvider } from "@/contexts/ProfileContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
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
              <Route path="store" element={<MyStore />} />
              <Route path="store/packages" element={<Navigate to="/dashboard/store" replace />} />
              <Route path="store/orders" element={<StoreOrders />} />
              <Route path="store/withdrawal" element={<StoreWithdrawal />} />
              <Route path="developer" element={<DeveloperAPI />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="report" element={<ReportIssue />} />
            </Route>
            <Route path="/admin" element={<DashboardLayout />}>
              <Route index element={<Navigate to="/admin/overview" replace />} />
              <Route path="overview" element={<AdminOverview />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="packages" element={<AdminPackages />} />
              <Route path="notifications" element={<AdminAnnouncements />} />
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
