import AdminStubPage from "./AdminStubPage";
import { Tag } from "lucide-react";
export default function AdminPromotions() {
  return <AdminStubPage title="Promo Codes" description="Create and manage promotional discount codes." icon={Tag} features={["Percentage and fixed discounts", "Usage limits", "Network-specific promos"]} />;
}
