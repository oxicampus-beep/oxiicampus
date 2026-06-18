import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminCard, AdminPageHeader } from "@/components/admin/AdminUi";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { labelFor } from "@/lib/admin";
import { RefreshCw, Loader2 } from "lucide-react";
import { toast } from "sonner";

type NetHealth = {
  network: string; total_orders: number; completed: number;
  failed: number; processing: number; success_rate: number;
};

export default function AdminAPINetwork() {
  const [rows, setRows] = useState<NetHealth[]>([]);
  const [swiftOk, setSwiftOk] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const [{ data: stats }, { data: sync }] = await Promise.all([
      supabase.rpc("get_network_health_stats"),
      supabase.functions.invoke("sync-swift-plans"),
    ]);
    setLoading(false);
    setRows((stats as NetHealth[]) ?? []);
    setSwiftOk(sync?.success ?? false);
    if (!sync?.success) toast.warning("SwiftData API check failed — verify API key");
  };

  useEffect(() => { load(); }, []);

  const rateClass = (r: number) =>
    r >= 95 ? "border-green-500/40 text-green-400" :
    r >= 80 ? "border-amber-500/40 text-amber-400" :
    "border-red-500/40 text-red-400";

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="API Network Intelligence"
        description="Per-network fulfillment success rates and SwiftData provider status."
        actions={<Button variant="outline" size="sm" onClick={load} disabled={loading} className="border-white/10 text-white gap-2">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}Refresh</Button>}
      />

      <AdminCard>
        <div className="flex items-center gap-3">
          <span className="text-sm text-white/60">SwiftData API</span>
          <Badge variant="outline" className={swiftOk ? "border-green-500/40 text-green-400" : swiftOk === false ? "border-red-500/40 text-red-400" : "border-white/20 text-white/40"}>
            {swiftOk === null ? "Checking…" : swiftOk ? "Connected" : "Error"}
          </Badge>
        </div>
      </AdminCard>

      <AdminCard className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="text-white/50">Network</TableHead>
              <TableHead className="text-white/50">Orders (7d)</TableHead>
              <TableHead className="text-white/50">Completed</TableHead>
              <TableHead className="text-white/50">Failed</TableHead>
              <TableHead className="text-white/50">Processing</TableHead>
              <TableHead className="text-white/50">Success rate</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-white/40 py-8">No order data in the last 7 days.</TableCell></TableRow>
            ) : rows.map(r => (
              <TableRow key={r.network} className="border-white/10">
                <TableCell className="text-white font-medium">{labelFor(r.network)}</TableCell>
                <TableCell className="text-white/70">{r.total_orders}</TableCell>
                <TableCell className="text-green-400">{r.completed}</TableCell>
                <TableCell className="text-red-400">{r.failed}</TableCell>
                <TableCell className="text-amber-400">{r.processing}</TableCell>
                <TableCell><Badge variant="outline" className={rateClass(Number(r.success_rate))}>{r.success_rate ?? 0}%</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </AdminCard>
    </div>
  );
}
