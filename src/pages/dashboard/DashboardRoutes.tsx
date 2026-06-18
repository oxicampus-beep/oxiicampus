import { Navigate, Route } from "react-router-dom";
import Overview from "@/pages/Overview";
import WalletPage from "@/pages/WalletPage";
import Transactions from "@/pages/Transactions";
import BuyMTN from "@/pages/BuyMTN";
import BuyTelecel from "@/pages/BuyTelecel";
import BuyAirtelTigo from "@/pages/BuyAirtelTigo";
import AFA from "@/pages/AFA";
import ExtraServices from "@/pages/ExtraServices";
import Rewards from "@/pages/Rewards";
import MyStore from "@/pages/MyStore";
import StoreOrders from "@/pages/StoreOrders";
import StoreWithdrawal from "@/pages/StoreWithdrawal";
import DeveloperAPI from "@/pages/DeveloperAPI";
import SettingsPage from "@/pages/SettingsPage";
import ReportIssue from "@/pages/ReportIssue";
import ProfilePage from "@/pages/dashboard/ProfilePage";
import NotificationsInbox from "@/pages/dashboard/NotificationsInbox";
import ReferralProgram from "@/pages/dashboard/ReferralProgram";
import AddressBook from "@/pages/dashboard/AddressBook";
import AgentPrices from "@/pages/dashboard/AgentPrices";
import AgentSubAgents from "@/pages/dashboard/AgentSubAgents";
import StoreSettings from "@/pages/dashboard/StoreSettings";
import AutoRenewal from "@/pages/dashboard/AutoRenewal";
import BuyAirtime from "@/pages/dashboard/BuyAirtime";
import UtilityBills from "@/pages/dashboard/UtilityBills";
import MarketingTools from "@/pages/dashboard/MarketingTools";
import FlyerGenerator from "@/pages/dashboard/FlyerGenerator";
import AgentLeaderboard from "@/pages/dashboard/AgentLeaderboard";
import BulkDisbursement from "@/pages/dashboard/BulkDisbursement";
import WhatsAppBot from "@/pages/dashboard/WhatsAppBot";
import ResultChecker from "@/pages/dashboard/ResultChecker";

/** Dashboard child route elements for use in App.tsx Route tree */
export const dashboardChildRoutes = (
  <>
    <Route index element={<Overview />} />
    <Route path="profile" element={<ProfilePage />} />
    <Route path="account-settings" element={<SettingsPage />} />
    <Route path="settings" element={<Navigate to="/dashboard/account-settings" replace />} />
    <Route path="wallet" element={<WalletPage />} />
    <Route path="schedule" element={<AutoRenewal />} />
    <Route path="transactions" element={<Transactions />} />
    <Route path="notifications" element={<NotificationsInbox />} />
    <Route path="buy-data/mtn" element={<BuyMTN />} />
    <Route path="buy-data/telecel" element={<BuyTelecel />} />
    <Route path="buy-data/airteltigo" element={<BuyAirtelTigo />} />
    <Route path="buy/mtn" element={<Navigate to="/dashboard/buy-data/mtn" replace />} />
    <Route path="buy/telecel" element={<Navigate to="/dashboard/buy-data/telecel" replace />} />
    <Route path="buy/at-ishare" element={<Navigate to="/dashboard/buy-data/airteltigo" replace />} />
    <Route path="buy/at-bigtime" element={<Navigate to="/dashboard/buy-data/airteltigo" replace />} />
    <Route path="buy-airtime" element={<BuyAirtime />} />
    <Route path="utilities" element={<UtilityBills />} />
    <Route path="afa" element={<AFA />} />
    <Route path="extras" element={<ExtraServices />} />
    <Route path="rewards" element={<Rewards />} />
    <Route path="referral" element={<ReferralProgram />} />
    <Route path="report-issue" element={<ReportIssue />} />
    <Route path="report" element={<Navigate to="/dashboard/report-issue" replace />} />
    <Route path="customers" element={<AddressBook />} />
    <Route path="my-store" element={<MyStore />} />
    <Route path="store" element={<Navigate to="/dashboard/my-store" replace />} />
    <Route path="store/packages" element={<Navigate to="/dashboard/my-store" replace />} />
    <Route path="store/orders" element={<StoreOrders />} />
    <Route path="store/withdrawal" element={<Navigate to="/dashboard/withdrawals" replace />} />
    <Route path="store-settings" element={<StoreSettings />} />
    <Route path="agent-prices" element={<AgentPrices />} />
    <Route path="withdrawals" element={<StoreWithdrawal />} />
    <Route path="subagents" element={<AgentSubAgents />} />
    <Route path="api" element={<DeveloperAPI />} />
    <Route path="developer" element={<Navigate to="/dashboard/api" replace />} />
    <Route path="marketing" element={<MarketingTools />} />
    <Route path="flyer" element={<FlyerGenerator />} />
    <Route path="leaderboard" element={<AgentLeaderboard />} />
    <Route path="bulk" element={<BulkDisbursement />} />
    <Route path="whatsapp-bot" element={<WhatsAppBot />} />
    <Route path="result-checker" element={<ResultChecker />} />
    <Route path="*" element={<Navigate to="/dashboard" replace />} />
  </>
);
