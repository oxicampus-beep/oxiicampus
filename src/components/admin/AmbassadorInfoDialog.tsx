import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ghanaUniversities } from "@/data/constants";
import { Loader2, Megaphone, GraduationCap, Phone, User, Banknote } from "lucide-react";

const momoNetworks = ["MTN", "Vodafone", "AirtelTigo"];

interface AmbassadorInfoDialogProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  userName: string | null;
  onSuccess: () => void;
}

const AmbassadorInfoDialog = ({ open, onClose, userId, userName, onSuccess }: AmbassadorInfoDialogProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    university: "",
    whatsapp: "",
    momoNumber: "",
    momoNetwork: "",
    momoName: "",
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Generate referral code
      const { data: codeData } = await supabase.rpc("generate_referral_code");
      const code = codeData as string;

      const { error } = await supabase.from("ambassadors").insert({
        user_id: userId,
        university: formData.university,
        whatsapp: formData.whatsapp,
        momo_number: formData.momoNumber,
        momo_network: formData.momoNetwork,
        momo_name: formData.momoName,
        status: "approved",
        referral_code: code,
      });

      if (error) throw error;

      toast({
        title: "Ambassador created",
        description: `${userName || "User"} is now an ambassador with code: ${code}`,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent className="sm:max-w-md w-[calc(100vw-2rem)] p-5 sm:p-6 gap-4 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-2">
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Megaphone className="w-5 h-5 text-primary flex-shrink-0" />
            <span>Make {userName || "User"} an Ambassador</span>
          </DialogTitle>
          <DialogDescription className="text-sm">
            Fill in the required ambassador details for this user.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amb-university">University</Label>
            <div className="relative">
              <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
              <select
                id="amb-university"
                value={formData.university}
                onChange={(e) => handleChange("university", e.target.value)}
                className="w-full pl-10 h-10 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                required
              >
                <option value="">Select university</option>
                {ghanaUniversities.map((uni) => (
                  <option key={uni} value={uni}>{uni}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amb-whatsapp">WhatsApp Number</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="amb-whatsapp"
                type="tel"
                value={formData.whatsapp}
                onChange={(e) => handleChange("whatsapp", e.target.value)}
                placeholder="0XX XXX XXXX"
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amb-momoNumber">Mobile Money Number</Label>
            <div className="relative">
              <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="amb-momoNumber"
                type="tel"
                value={formData.momoNumber}
                onChange={(e) => handleChange("momoNumber", e.target.value)}
                placeholder="0XX XXX XXXX"
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amb-momoNetwork">Network</Label>
            <select
              id="amb-momoNetwork"
              value={formData.momoNetwork}
              onChange={(e) => handleChange("momoNetwork", e.target.value)}
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              required
            >
              <option value="">Select network</option>
              {momoNetworks.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amb-momoName">Name on MoMo</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="amb-momoName"
                value={formData.momoName}
                onChange={(e) => handleChange("momoName", e.target.value)}
                placeholder="Name registered on MoMo"
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={onClose} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button type="submit" variant="hero" disabled={isLoading} className="w-full sm:w-auto">
              {isLoading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...</>
              ) : (
                "Create Ambassador"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AmbassadorInfoDialog;
