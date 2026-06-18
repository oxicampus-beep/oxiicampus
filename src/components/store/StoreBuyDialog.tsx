import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Clock, Loader2, MessageCircle } from "lucide-react";
import { labelFor } from "@/components/data/BuyDataDialog";
import { whatsappLink } from "@/lib/store";
import NetworkBadge from "@/components/store/NetworkBadge";
import { useStoreTheme } from "@/components/store/StoreThemeProvider";
import { cn } from "@/lib/utils";

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
  const { isDark } = useStoreTheme();
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

    const msg = `Hi ${storeName}! I'd like to buy:\n\n📦 ${pkg.size_gb}GB ${labelFor(pkg.network)}\n💰 GH₵${Number(pkg.price).toFixed(2)}\n📱 Recipient: ${phone.trim()}\n\nOrder ref: ${data.id.slice(0, 8)}`;
    window.open(whatsappLink(whatsapp, msg), "_blank");
    toast.success("Order placed! Complete payment via WhatsApp.");
    setPhone("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "sm:max-w-md",
          isDark ? "bg-zinc-900 text-zinc-100 border-white/10" : "bg-white text-zinc-900 border-zinc-200",
        )}
      >
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <NetworkBadge network={pkg.network} />
            <span className={cn("inline-flex items-center gap-1 text-xs", isDark ? "text-zinc-400" : "text-zinc-500")}>
              <Clock className="h-3.5 w-3.5" /> 1–5 min delivery
            </span>
          </div>
          <DialogTitle className="text-2xl font-display">
            {pkg.size_gb}GB · {labelFor(pkg.network)}
          </DialogTitle>
          <DialogDescription className={isDark ? "text-zinc-400" : "text-zinc-500"}>
            GH₵ {Number(pkg.price).toFixed(2)} · Pay by Mobile Money via WhatsApp
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className={isDark ? "text-zinc-300" : "text-zinc-700"}>Recipient phone number</Label>
            <Input
              placeholder="0241234567"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className={isDark ? "bg-zinc-800 border-white/10" : "bg-white border-zinc-200"}
            />
          </div>
          <p className={cn("text-xs", isDark ? "text-zinc-400" : "text-zinc-500")}>
            You'll be redirected to WhatsApp to confirm and pay with {storeName}.
          </p>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className={isDark ? "border-white/10" : "border-zinc-200"}
          >
            Cancel
          </Button>
          <Button
            onClick={handleOrder}
            disabled={loading}
            className="gap-2 font-semibold bg-[#25D366] hover:bg-[#1ebe5d] text-white"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
            Order via WhatsApp
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
