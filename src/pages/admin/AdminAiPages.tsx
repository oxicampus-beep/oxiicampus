import AdminStubPage from "./AdminStubPage";
import { Bot, Brain, MessageSquare, Network } from "lucide-react";
export const AdminSentinelAI = () => <AdminStubPage title="Sentinel AI" description="Automated fraud detection and order monitoring." icon={Bot} features={["Anomaly detection", "Auto-flag suspicious orders", "Risk scoring"]} />;
export const AdminAIStrategy = () => <AdminStubPage title="AI Intelligence Hub" description="AI-driven insights and business recommendations." icon={Brain} features={["Demand forecasting", "Pricing suggestions", "Churn prediction"]} />;
export const AdminAPINetwork = () => <AdminStubPage title="API Network Intelligence" description="Monitor API health across networks and providers." icon={Network} features={["Per-network uptime", "Latency tracking", "Failover alerts"]} />;
export const AdminSmsTemplates = () => <AdminStubPage title="SMS Templates" description="Transactional SMS templates for notifications." icon={MessageSquare} features={["Order confirmations", "OTP templates", "Bulk SMS"]} />;
