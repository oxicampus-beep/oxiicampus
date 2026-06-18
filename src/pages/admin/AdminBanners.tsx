import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminCard, AdminPageHeader } from "@/components/admin/AdminUi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { deletePromoBannerImage, uploadPromoBannerImage, validateBannerImage } from "@/lib/promo-banners";

type Banner = {
  id: string;
  title: string | null;
  link_url: string | null;
  image_url: string | null;
  image_path: string | null;
  audience: string;
  active: boolean;
  sort_order: number;
};

const empty = { title: "", link_url: "", audience: "all", sort_order: "0" };

export default function AdminBanners() {
  const [rows, setRows] = useState<Banner[]>([]);
  const [form, setForm] = useState(empty);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    const { data } = await supabase.from("promo_banners").select("*").order("sort_order").order("created_at", { ascending: false });
    setRows((data ?? []) as Banner[]);
  };

  useEffect(() => { load(); }, []);

  const onFile = (f: File | null) => {
    setFile(f);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(f ? URL.createObjectURL(f) : null);
  };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return toast.error("Select a banner image to upload.");
    const validation = validateBannerImage(file);
    if (validation) return toast.error(validation);

    setSaving(true);
    try {
      const { image_url, image_path } = await uploadPromoBannerImage(file);
      const { error } = await supabase.from("promo_banners").insert({
        title: form.title.trim() || null,
        link_url: form.link_url.trim() || null,
        image_url,
        image_path,
        audience: form.audience,
        sort_order: Number(form.sort_order) || 0,
        subtitle: null,
        cta_text: null,
      });
      if (error) {
        await deletePromoBannerImage(image_path);
        throw error;
      }
      toast.success("Banner uploaded");
      setForm(empty);
      onFile(null);
      if (inputRef.current) inputRef.current.value = "";
      load();
    } catch (err: any) {
      toast.error(err.message ?? "Upload failed");
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (id: string, active: boolean) => {
    await supabase.from("promo_banners").update({ active: !active }).eq("id", id);
    load();
  };

  const remove = async (row: Banner) => {
    await deletePromoBannerImage(row.image_path);
    await supabase.from("promo_banners").delete().eq("id", row.id);
    toast.success("Banner removed");
    load();
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Promo Banners"
        description="Upload image banners shown on the user dashboard carousel. Recommended size: 1200×400 px (3:1)."
      />

      <AdminCard title="Upload banner image">
        <form onSubmit={create} className="space-y-4">
          <div>
            <Label className="text-white/70">Banner image</Label>
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={e => onFile(e.target.files?.[0] ?? null)}
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="mt-2 w-full rounded-xl border-2 border-dashed border-white/20 bg-white/[0.02] hover:border-primary/40 hover:bg-white/[0.04] transition-colors overflow-hidden"
            >
              {preview ? (
                <img src={preview} alt="Preview" className="w-full aspect-[3/1] object-cover" />
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 py-12 text-white/40">
                  <ImagePlus className="h-10 w-10" />
                  <span className="text-sm font-medium">Click to upload JPG, PNG, WebP or GIF (max 5 MB)</span>
                </div>
              )}
            </button>
            {file && <p className="text-xs text-white/40 mt-1">{file.name} ({(file.size / 1024).toFixed(0)} KB)</p>}
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-white/70">Label (optional, for admin)</Label>
              <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="bg-white/5 border-white/10 text-white mt-1" placeholder="Summer promo" />
            </div>
            <div>
              <Label className="text-white/70">Click link (optional)</Label>
              <Input value={form.link_url} onChange={e => setForm({ ...form, link_url: e.target.value })} className="bg-white/5 border-white/10 text-white mt-1" placeholder="/dashboard/rewards" />
              <p className="text-xs text-white/35 mt-1">Where users go when they tap the banner</p>
            </div>
            <div>
              <Label className="text-white/70">Audience</Label>
              <Select value={form.audience} onValueChange={v => setForm({ ...form, audience: v })}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Everyone</SelectItem>
                  <SelectItem value="users">Users only</SelectItem>
                  <SelectItem value="agents">Agents only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-white/70">Sort order</Label>
              <Input type="number" value={form.sort_order} onChange={e => setForm({ ...form, sort_order: e.target.value })} className="bg-white/5 border-white/10 text-white mt-1" />
            </div>
          </div>

          <Button type="submit" disabled={saving || !file} className="gap-2 font-bold">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
            {saving ? "Uploading…" : "Publish banner"}
          </Button>
        </form>
      </AdminCard>

      <AdminCard className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="text-white/50">Preview</TableHead>
              <TableHead className="text-white/50">Label</TableHead>
              <TableHead className="text-white/50">Audience</TableHead>
              <TableHead className="text-white/50">Click link</TableHead>
              <TableHead className="text-white/50">Active</TableHead>
              <TableHead className="text-white/50" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-white/40 py-8">No banners yet — upload an image above.</TableCell></TableRow>
            ) : rows.map(r => (
              <TableRow key={r.id} className="border-white/10">
                <TableCell>
                  {r.image_url ? (
                    <img src={r.image_url} alt={r.title ?? "Banner"} className="h-14 w-28 object-cover rounded-lg border border-white/10" />
                  ) : (
                    <span className="text-xs text-amber-500">No image</span>
                  )}
                </TableCell>
                <TableCell className="text-white/80">{r.title ?? "—"}</TableCell>
                <TableCell className="capitalize text-white/60">{r.audience}</TableCell>
                <TableCell className="text-xs text-white/50 truncate max-w-[120px]">{r.link_url ?? "—"}</TableCell>
                <TableCell><Switch checked={r.active} onCheckedChange={() => toggle(r.id, r.active)} /></TableCell>
                <TableCell><Button variant="ghost" size="icon" onClick={() => remove(r)}><Trash2 className="h-4 w-4 text-red-400" /></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </AdminCard>
    </div>
  );
}
