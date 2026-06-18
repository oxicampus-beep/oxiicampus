import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { DashboardPageHeader, GlassCard } from "@/components/dashboard/DashboardUi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Trash2, UserPlus } from "lucide-react";

type Contact = { id: string; name: string | null; phone: string; network: string | null };

export default function AddressBook() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Contact[]>([]);
  const [form, setForm] = useState({ name: "", phone: "", network: "mtn" });

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("customer_contacts").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setRows((data ?? []) as Contact[]);
  };

  useEffect(() => { load(); }, [user]);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || form.phone.length < 10) return toast.error("Enter a valid phone number");
    const { error } = await supabase.from("customer_contacts").insert({
      user_id: user.id, name: form.name || null, phone: form.phone, network: form.network,
    });
    if (error) return toast.error(error.message);
    toast.success("Contact saved");
    setForm({ name: "", phone: "", network: "mtn" });
    load();
  };

  const remove = async (id: string) => {
    await supabase.from("customer_contacts").delete().eq("id", id);
    load();
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <DashboardPageHeader title="Address Book" description="Save customer phone numbers for faster repeat orders." />

      <GlassCard title="Add Contact">
        <form onSubmit={add} className="space-y-3">
          <div><Label>Name (optional)</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Kwame" className="mt-1" /></div>
          <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value.replace(/\D/g, "").slice(0, 10) }))} placeholder="0241234567" className="mt-1" /></div>
          <Button type="submit" className="gap-2 font-bold w-full"><UserPlus className="h-4 w-4" /> Save contact</Button>
        </form>
      </GlassCard>

      <GlassCard title={`Saved Contacts (${rows.length})`}>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No contacts yet.</p>
        ) : (
          <ul className="divide-y divide-white/10">
            {rows.map(r => (
              <li key={r.id} className="py-3 flex items-center justify-between gap-3">
                <div>
                  <p className="font-bold">{r.name ?? "Unnamed"}</p>
                  <p className="text-sm text-muted-foreground font-mono">{r.phone}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => remove(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </li>
            ))}
          </ul>
        )}
      </GlassCard>
    </div>
  );
}
