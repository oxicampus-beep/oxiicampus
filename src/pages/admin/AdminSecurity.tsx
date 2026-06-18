import AdminStubPage from "./AdminStubPage";
import { Shield } from "lucide-react";
export default function AdminSecurity() {
  return <AdminStubPage title="Security" description="Platform security policies and access controls." icon={Shield} features={["Role-based access", "IP allowlists", "Session monitoring"]} />;
}
