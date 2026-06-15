import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Search, Shield, ShieldOff } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/admin";

type UserRow = {
  id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  wallet_balance: number;
  created_at: string;
  isAdmin: boolean;
  isAgent: boolean;
  orderCount: number;
  totalSpent: number;
};

function AdminUsersContent() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [{ data: profiles, error: pErr }, { data: roles }, { data: orders }, { data: stores }] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id, role").eq("role", "admin"),
      supabase.from("data_orders").select("user_id, price"),
      supabase.from("stores").select("user_id"),
    ]);
    if (pErr) { toast.error(pErr.message); setLoading(false); return; }

    const adminIds = new Set((roles ?? []).map(r => r.user_id));
    const agentIds = new Set((stores ?? []).map(s => s.user_id));
    const orderStats: Record<string, { count: number; spent: number }> = {};
    (orders ?? []).forEach(o => {
      if (!orderStats[o.user_id]) orderStats[o.user_id] = { count: 0, spent: 0 };
      orderStats[o.user_id].count++;
      orderStats[o.user_id].spent += Number(o.price);
    });

    setUsers((profiles ?? []).map(p => ({
      id: p.id,
      full_name: p.full_name,
      phone: p.phone,
      email: p.email ?? null,
      wallet_balance: Number(p.wallet_balance),
      created_at: p.created_at,
      isAdmin: adminIds.has(p.id),
      isAgent: agentIds.has(p.id),
      orderCount: orderStats[p.id]?.count ?? 0,
      totalSpent: orderStats[p.id]?.spent ?? 0,
    })));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggleAdmin = async (u: UserRow) => {
    if (u.id === currentUser?.id) return toast.error("You cannot change your own admin role.");
    if (u.isAdmin) {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", u.id).eq("role", "admin");
      if (error) return toast.error(error.message);
      toast.success(`${u.full_name ?? "User"} removed from admins`);
    } else {
      const { error } = await supabase.from("user_roles").insert({ user_id: u.id, role: "admin" });
      if (error) return toast.error(error.message);
      toast.success(`${u.full_name ?? "User"} promoted to admin`);
    }
    load();
  };

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    return !q ||
      u.full_name?.toLowerCase().includes(q) ||
      u.phone?.includes(q) ||
      u.email?.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl md:text-4xl font-display font-bold">Users</h1>
        <p className="text-muted-foreground mt-1">View and manage all registered users on the platform.</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, phone, or email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <Card className="p-0 overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-muted-foreground">Loading users…</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground">No users found.</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Wallet</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Spent</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Admin</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(u => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="font-medium">{u.full_name ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">{u.email ?? "—"}</div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{u.phone ?? "—"}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(u.wallet_balance)}</TableCell>
                    <TableCell>{u.orderCount}</TableCell>
                    <TableCell className="text-primary font-medium">{formatCurrency(u.totalSpent)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(u.created_at)}</TableCell>
                    <TableCell>
                      {u.isAgent ? (
                        <Badge className="bg-primary/20 text-primary border-primary/30">Agent</Badge>
                      ) : (
                        <Badge variant="secondary">User</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {u.isAdmin ? (
                        <Badge className="gap-1"><Shield className="h-3 w-3" /> Admin</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={u.id === currentUser?.id}
                        onClick={() => toggleAdmin(u)}
                        className="gap-1"
                      >
                        {u.isAdmin ? (
                          <><ShieldOff className="h-4 w-4" /> Revoke</>
                        ) : (
                          <><Shield className="h-4 w-4" /> Make Admin</>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}

export default function AdminUsers() {
  return (
    <AdminGuard>
      <AdminUsersContent />
    </AdminGuard>
  );
}
