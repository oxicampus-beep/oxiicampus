import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function ReportIssue() {
  const { user } = useAuth();
  const [f, setF] = useState({ subject: "", description: "" });
  const [loading, setLoading] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!user) return;
    setLoading(true);
    const { error } = await supabase.from("issues").insert({ user_id: user.id, ...f });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Issue submitted. We'll get back to you.");
    setF({ subject: "", description: "" });
  };
  return (
    <div className="space-y-6 max-w-2xl">
      <div><h1 className="text-3xl md:text-4xl font-display font-bold">Report an Issue</h1>
        <p className="text-muted-foreground mt-1">Tell us what's wrong and we'll help.</p></div>
      <Card className="p-6">
        <form onSubmit={submit} className="space-y-4">
          <div><Label>Subject</Label><Input required value={f.subject} onChange={e => setF({ ...f, subject: e.target.value })} /></div>
          <div><Label>Description</Label><Textarea required rows={6} value={f.description} onChange={e => setF({ ...f, description: e.target.value })} /></div>
          <Button type="submit" disabled={loading} className="w-full font-semibold">{loading ? "..." : "Submit Issue"}</Button>
        </form>
      </Card>
    </div>
  );
}
