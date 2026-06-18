import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminCard, AdminPageHeader } from "@/components/admin/AdminUi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertTriangle, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

type Alert = { severity: string; title: string; description: string };

export default function AdminSentinelAI() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("get_sentinel_alerts");
    setLoading(false);
    if (error) return;
    setAlerts((data as Alert[]) ?? []);
  };

  useEffect(() => { load(); }, []);

  const severityClass = (s: string) =>
    s === "high" ? "border-red-500/40 text-red-400 bg-red-500/10" :
    s === "medium" ? "border-amber-500/40 text-amber-400 bg-amber-500/10" :
    "border-blue-500/40 text-blue-400 bg-blue-500/10";

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Sentinel AI"
        description="Automated monitoring for order failures, stuck deliveries, and suspicious patterns."
        actions={<Button variant="outline" size="sm" onClick={load} disabled={loading} className="border-white/10 text-white gap-2"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />Refresh</Button>}
      />

      {alerts.length === 0 ? (
        <AdminCard>
          <div className="flex flex-col items-center py-10 gap-3 text-center">
            <ShieldCheck className="h-12 w-12 text-green-400" />
            <p className="text-white font-semibold">All clear</p>
            <p className="text-white/45 text-sm">No active alerts detected in the last 24 hours.</p>
          </div>
        </AdminCard>
      ) : (
        <div className="space-y-3">
          {alerts.map((a, i) => (
            <AdminCard key={i}>
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-white">{a.title}</span>
                    <Badge variant="outline" className={severityClass(a.severity)}>{a.severity}</Badge>
                  </div>
                  <p className="text-sm text-white/55 mt-1">{a.description}</p>
                </div>
              </div>
            </AdminCard>
          ))}
        </div>
      )}

      <AdminCard>
        <p className="text-sm text-white/45">Review flagged orders in <Link to="/admin/orders" className="text-amber-400 hover:underline">Orders</Link> or retry failed fulfillments from there.</p>
      </AdminCard>
    </div>
  );
}
