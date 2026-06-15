import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, MessageCircle } from "lucide-react";
import { labelFor } from "@/components/data/BuyDataDialog";
import { whatsappLink } from "@/lib/store";

type Pkg = {
  id: string;
  name: string;
  network: string;
  size_gb: number;
  price: number;
};

export default function StoreBuyDialog({
  pkg,
  storeName,
  storeOwnerId,
  whatsapp,
  open,
  onOpenChange,
}: {
  pkg: Pkg | null;
  storeName: string;
  storeOwnerId: string;
  whatsapp: string;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  if (!pkg) return null;

  const handleOrder = async () => {
    if (!phone.trim()) return toast.error("Enter your phone number.");
    setLoading(true);
    const { data, error } = await supabase.from("store_orders").insert({
      store_owner_id: storeOwnerId,
      package_id: pkg.id,
      customer_phone: phone.trim(),
      price: pkg.price,
      status: "pending",
    }).select("id").single();
    setLoading(false);
    if (error) return toast.error(error.message);

    const msg = `Hi ${storeName}! I'd like to buy:\n\n📦 ${pkg.name}\n📶 ${pkg.size_gb}GB ${labelFor(pkg.network)}\n💰 ₵${Number(pkg.price).toFixed(2)}\n📱 Recipient: ${phone.trim()}\n\nOrder ref: ${data.id.slice(0, 8)}`;
    window.open(whatsappLink(whatsapp, msg), "_blank");
    toast.success("Order placed! Complete payment via WhatsApp.");
    setPhone("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl">{pkg.name}</DialogTitle>
          <DialogDescription>
            {pkg.size_gb}GB {labelFor(pkg.network)} · ₵{Number(pkg.price).toFixed(2)}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Your phone number</Label>
            <Input
              placeholder="0241234567"
              value={phone}
              onChange={e => setPhone(e.target.value)}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            You'll be redirected to WhatsApp to confirm and pay with {storeName}.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleOrder} disabled={loading} className="gap-2 font-semibold">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
            Order via WhatsApp
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
