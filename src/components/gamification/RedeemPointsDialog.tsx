import { useEffect, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { NETWORK_OPTIONS } from "@/lib/networks";
import { REDEEM_DATA_GB, REDEEM_POINTS_COST } from "@/lib/rewards";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

type Mode = "redeem" | "spin_claim";

async function fulfillOrder(orderId: string) {
  const { data, error } = await supabase.functions.invoke("fulfill-data-order", {
    body: { order_id: orderId },
  });
  if (error || !data?.success) {
    toast.warning(data?.error ?? "Order placed. Data delivery is pending.");
  } else if (data.status === "completed") {
    toast.success("Data has been delivered!");
  } else {
    toast.success("Your data is being delivered.");
  }
}

export default function RedeemPointsDialog({
  open,
  onOpenChange,
  mode,
  spinId,
  dataGb = REDEEM_DATA_GB,
  pointsBalance,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  mode: Mode;
  spinId?: string;
  dataGb?: number;
  pointsBalance: number;
  onSuccess?: () => void;
}) {
  const [network, setNetwork] = useState("mtn");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setPhone("");
      setNetwork("mtn");
    }
  }, [open]);

  const title = mode === "redeem"
    ? `Redeem ${REDEEM_POINTS_COST} points for ${dataGb}GB`
    : `Claim your ${dataGb}GB spin prize`;

  const canRedeem = mode === "redeem" ? pointsBalance >= REDEEM_POINTS_COST : true;

  const handleSubmit = async () => {
    if (phone.length < 10) return toast.error("Enter a valid 10-digit phone number");
    setLoading(true);

    let orderId: string | null = null;
    let error: { message: string } | null = null;

    if (mode === "redeem") {
      const res = await supabase.rpc("redeem_points_for_data", {
        p_network: network,
        p_recipient_phone: phone,
      });
      orderId = res.data;
      error = res.error;
    } else if (spinId) {
      const res = await supabase.rpc("claim_spin_data_prize", {
        p_spin_id: spinId,
        p_network: network,
        p_recipient_phone: phone,
      });
      orderId = res.data;
      error = res.error;
    }

    if (error) {
      setLoading(false);
      return toast.error(error.message);
    }

    if (orderId) await fulfillOrder(orderId);
    setLoading(false);
    onOpenChange(false);
    onSuccess?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {mode === "redeem"
              ? `You have ${pointsBalance} points. ${REDEEM_POINTS_COST} points = ${dataGb}GB data on any network.`
              : "Choose network and phone number to receive your free data bundle."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <Label>Network</Label>
            <Select value={network} onValueChange={setNetwork}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {NETWORK_OPTIONS.map(n => (
                  <SelectItem key={n.id} value={n.id}>{n.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Recipient phone</Label>
            <Input
              value={phone}
              onChange={e => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
              placeholder="0241234567"
              inputMode="numeric"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={loading || !canRedeem || phone.length < 10} onClick={handleSubmit} className="gap-2">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === "redeem" ? `Redeem ${REDEEM_POINTS_COST} pts` : "Claim data"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
