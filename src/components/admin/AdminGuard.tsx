import { Navigate } from "react-router-dom";
import { useIsAdmin } from "@/hooks/useRoles";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { isAdmin, loading } = useIsAdmin();
  if (loading) return <div className="text-muted-foreground">Loading…</div>;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}
