import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminCard, AdminPageHeader } from "@/components/admin/AdminUi";
import { formatDate } from "@/lib/admin";

export default function AdminSystemLogs() {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("transactions").select("*").order("created_at", { ascending: false }).limit(80)
      .then(({ data }) => setLogs(data ?? []));
  }, []);

  return (
    <div className="space-y-6">
      <AdminPageHeader title="System Logs" description="Recent platform transaction events." />
      <AdminCard>
        <div className="font-mono text-xs space-y-2 max-h-[600px] overflow-y-auto">
          {logs.map(l => (
            <div key={l.id} className="flex gap-3 text-white/60 border-b border-white/5 pb-2">
              <span className="text-white/30 shrink-0">{formatDate(l.created_at)}</span>
              <span className="text-amber-400/80 shrink-0 uppercase">{l.type}</span>
              <span className="text-white/70">{l.description ?? "—"}</span>
              <span className="ml-auto shrink-0">{Number(l.amount) >= 0 ? "+" : ""}₵{Number(l.amount).toFixed(2)}</span>
            </div>
          ))}
        </div>
      </AdminCard>
    </div>
  );
}
