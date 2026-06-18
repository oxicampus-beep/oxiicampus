import { useEffect, useState } from "react";
import { AdminPageHeader } from "@/components/admin/AdminUi";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { GraduationCap, Loader2, Trash2 } from "lucide-react";

type Product = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  price: number;
  user_price: number;
  agent_price: number;
  category: "result_checker" | "admission_form";
  active: boolean;
  sort_order: number;
};

const emptyForm = {
  slug: "",
  name: "",
  description: "",
  user_price: "",
  agent_price: "",
  category: "result_checker" as Product["category"],
  sort_order: "0",
};

function slugify(name: string) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
}

export default function AdminResultCheckers() {
  const [items, setItems] = useState<Product[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    const { data, error } = await supabase
      .from("result_checker_products")
      .select("*")
      .order("category")
      .order("sort_order")
      .order("name");
    if (error) return toast.error(error.message);
    setItems((data ?? []) as Product[]);
  };

  useEffect(() => { load(); }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    const slug = form.slug.trim() || slugify(form.name);
    if (!form.name.trim()) return toast.error("Name is required.");
    setSaving(true);
    const userPrice = Number(form.user_price);
    const agentPrice = Number(form.agent_price);
    const { error } = await supabase.from("result_checker_products").insert({
      slug,
      name: form.name.trim(),
      description: form.description.trim() || null,
      price: userPrice,
      user_price: userPrice,
      agent_price: agentPrice,
      category: form.category,
      sort_order: Number(form.sort_order) || 0,
      active: true,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Product added.");
    setForm(emptyForm);
    load();
  };

  const toggle = async (item: Product) => {
    const { error } = await supabase
      .from("result_checker_products")
      .update({ active: !item.active })
      .eq("id", item.id);
    if (error) return toast.error(error.message);
    load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("result_checker_products").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Product deleted.");
    load();
  };

  const updatePrice = async (id: string, field: "user_price" | "agent_price", value: string) => {
    const n = Number(value);
    if (Number.isNaN(n) || n <= 0) return;
    const patch: Record<string, number> = { [field]: n };
    if (field === "user_price") patch.price = n;
    await supabase.from("result_checker_products").update(patch).eq("id", id);
    load();
  };

  const resultItems = items.filter(i => i.category === "result_checker");
  const admissionItems = items.filter(i => i.category === "admission_form");

  const renderTable = (rows: Product[]) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>User ₵</TableHead>
          <TableHead>Agent ₵</TableHead>
          <TableHead>Active</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No products yet.</TableCell></TableRow>
        ) : rows.map(item => (
          <TableRow key={item.id}>
            <TableCell>
              <div className="font-medium">{item.name}</div>
              <div className="text-xs text-muted-foreground">{item.description ?? item.slug}</div>
            </TableCell>
            <TableCell>
              <Input
                type="number"
                step="0.01"
                className="h-8 w-24"
                defaultValue={item.user_price}
                onBlur={e => updatePrice(item.id, "user_price", e.target.value)}
              />
            </TableCell>
            <TableCell>
              <Input
                type="number"
                step="0.01"
                className="h-8 w-24"
                defaultValue={item.agent_price}
                onBlur={e => updatePrice(item.id, "agent_price", e.target.value)}
              />
            </TableCell>
            <TableCell>
              <Switch checked={item.active} onCheckedChange={() => toggle(item)} />
            </TableCell>
            <TableCell>
              <Button variant="ghost" size="icon" onClick={() => remove(item.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Result Checkers & Admission"
        description="Manage WAEC/BECE checkers and admission form vouchers. Users and agents pay from wallet after entering their phone number."
      />

      <Card className="p-6">
        <form onSubmit={create} className="space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-lg bg-primary/10 grid place-items-center">
              <GraduationCap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-display font-semibold text-lg">Add product</h2>
              <p className="text-sm text-muted-foreground">Set separate user and agent prices.</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={v => setForm({ ...form, category: v as Product["category"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="result_checker">Result checker</SelectItem>
                  <SelectItem value="admission_form">Admission form</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="WAEC Result Checker" required />
            </div>
            <div className="space-y-1.5">
              <Label>Slug (optional)</Label>
              <Input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} placeholder="waec" />
            </div>
            <div className="space-y-1.5">
              <Label>User price (₵)</Label>
              <Input type="number" step="0.01" value={form.user_price} onChange={e => setForm({ ...form, user_price: e.target.value })} required />
            </div>
            <div className="space-y-1.5">
              <Label>Agent price (₵)</Label>
              <Input type="number" step="0.01" value={form.agent_price} onChange={e => setForm({ ...form, agent_price: e.target.value })} required />
            </div>
            <div className="space-y-1.5">
              <Label>Sort order</Label>
              <Input type="number" value={form.sort_order} onChange={e => setForm({ ...form, sort_order: e.target.value })} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} placeholder="Short description for buyers" />
          </div>

          <Button type="submit" disabled={saving} className="font-semibold gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Add product
          </Button>
        </form>
      </Card>

      <Card className="p-0 overflow-hidden">
        <Tabs defaultValue="result_checker">
          <div className="px-4 pt-4 border-b border-border">
            <TabsList>
              <TabsTrigger value="result_checker">Result checkers ({resultItems.length})</TabsTrigger>
              <TabsTrigger value="admission_form">Admission forms ({admissionItems.length})</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="result_checker" className="m-0 overflow-x-auto">
            {renderTable(resultItems)}
          </TabsContent>
          <TabsContent value="admission_form" className="m-0 overflow-x-auto">
            {renderTable(admissionItems)}
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
