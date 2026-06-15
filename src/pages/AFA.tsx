import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function AFA() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [f, setF] = useState({ full_name: "", dob: "", phone: "", id_number: "", network: "mtn", region: "" });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!user) return;
    setLoading(true);
    const { error } = await supabase.from("afa_registrations").insert({ ...f, user_id: user.id } as any);
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("AFA registration submitted!");
    setF({ full_name: "", dob: "", phone: "", id_number: "", network: "mtn", region: "" });
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl md:text-4xl font-display font-bold">AFA Registration</h1>
        <p className="text-muted-foreground mt-1">Register a new SIM for a customer.</p>
      </div>
      <Card className="p-6">
        <form onSubmit={submit} className="space-y-4">
          <div><Label>Full name</Label><Input required value={f.full_name} onChange={e => setF({ ...f, full_name: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Date of birth</Label><Input type="date" required value={f.dob} onChange={e => setF({ ...f, dob: e.target.value })} /></div>
            <div><Label>Phone</Label><Input required value={f.phone} onChange={e => setF({ ...f, phone: e.target.value })} /></div>
          </div>
          <div><Label>Ghana Card / ID number</Label><Input required value={f.id_number} onChange={e => setF({ ...f, id_number: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Network</Label>
              <Select value={f.network} onValueChange={v => setF({ ...f, network: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="mtn">MTN</SelectItem>
                  <SelectItem value="airteltigo_ishare">AirtelTigo</SelectItem>
                  <SelectItem value="telecel">Telecel</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Region</Label><Input value={f.region} onChange={e => setF({ ...f, region: e.target.value })} /></div>
          </div>
          <Button type="submit" disabled={loading} className="w-full font-semibold">{loading ? "..." : "Submit Registration"}</Button>
        </form>
      </Card>
    </div>
  );
}
