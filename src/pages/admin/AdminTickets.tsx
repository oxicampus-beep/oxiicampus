import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminCard, AdminPageHeader } from "@/components/admin/AdminUi";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { formatDate } from "@/lib/admin";

export default function AdminTickets() {
  const [rows, setRows] = useState<any[]>([]);

  const load = async () => {
    const { data } = await supabase.from("issues").select("*").order("created_at", { ascending: false });
    const { data: profiles } = await supabase.from("profiles").select("id, full_name, email");
    const pmap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]));
    setRows((data ?? []).map(r => ({ ...r, user: pmap[r.user_id] })));
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("issues").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Ticket updated");
    load();
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Support Tickets" description="User-reported issues and support requests." />
      <AdminCard className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="text-white/50">Subject</TableHead>
              <TableHead className="text-white/50">User</TableHead>
              <TableHead className="text-white/50">Status</TableHead>
              <TableHead className="text-white/50">Date</TableHead>
              <TableHead className="text-white/50">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center text-white/40 py-10">No tickets.</TableCell></TableRow>
            ) : rows.map(r => (
              <TableRow key={r.id} className="border-white/10">
                <TableCell>
                  <div className="font-medium text-white">{r.subject}</div>
                  <div className="text-xs text-white/40 mt-1 max-w-md truncate">{r.description}</div>
                </TableCell>
                <TableCell className="text-sm text-white/70">{r.user?.full_name ?? r.user?.email ?? "—"}</TableCell>
                <TableCell><Badge variant="outline" className="capitalize border-white/20">{r.status}</Badge></TableCell>
                <TableCell className="text-xs text-white/40">{formatDate(r.created_at)}</TableCell>
                <TableCell>
                  <Select value={r.status} onValueChange={v => updateStatus(r.id, v)}>
                    <SelectTrigger className="h-8 w-28 bg-white/5 border-white/10 text-white text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["open", "in_progress", "resolved", "closed"].map(s => (
                        <SelectItem key={s} value={s} className="capitalize">{s.replace("_", " ")}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </AdminCard>
    </div>
  );
}
