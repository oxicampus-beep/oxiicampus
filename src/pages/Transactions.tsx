import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Transactions() {
  const { user } = useAuth();
  const [tx, setTx] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!user) return;
    supabase.from("transactions").select("*").eq("user_id", user.id).order("created_at", { ascending: false })
      .then(({ data }) => { setTx(data ?? []); setLoading(false); });
  }, [user]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl md:text-4xl font-display font-bold">Transaction History</h1>
        <p className="text-muted-foreground mt-1">All your wallet activity in one place.</p>
      </div>

      <Card className="p-0 overflow-hidden">
        {loading ? <div className="p-8 text-muted-foreground">Loading…</div> :
          tx.length === 0 ? <div className="p-10 text-center text-muted-foreground">No transactions yet.</div> :
          <ul className="divide-y divide-border">
            {tx.map(t => (
              <li key={t.id} className="p-4 md:p-5 flex justify-between items-center gap-4">
                <div className="min-w-0">
                  <div className="font-medium truncate">{t.description ?? t.type}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{new Date(t.created_at).toLocaleString()}</div>
                  <Badge variant="outline" className="mt-2 text-xs capitalize">{t.type}</Badge>
                </div>
                <div className={`font-bold text-lg shrink-0 ${Number(t.amount) < 0 ? "text-destructive" : "text-primary"}`}>
                  {Number(t.amount) < 0 ? "" : "+"}₵{Math.abs(Number(t.amount)).toFixed(2)}
                </div>
              </li>
            ))}
          </ul>
        }
      </Card>
    </div>
  );
}
