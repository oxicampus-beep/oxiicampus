import AdminStubPage from "./AdminStubPage";
import { UserPlus } from "lucide-react";
export default function AdminSubAgents() {
  return <AdminStubPage title="Sub-Agents" description="Manage sub-agents under parent agents." icon={UserPlus} features={["Sub-agent signup approvals", "Parent agent hierarchy", "Activation fee tracking"]} />;
}
