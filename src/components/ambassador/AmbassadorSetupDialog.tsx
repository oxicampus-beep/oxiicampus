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

interface AmbassadorSetupDialogProps {
  open: boolean;
  userId: string;
  userName: string | null;
  onComplete: () => void;
}

const AmbassadorSetupDialog = ({ open, userId, userName, onComplete }: AmbassadorSetupDialogProps) => {
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

      // Update the existing pending_setup ambassador record
      const { error } = await supabase
        .from("ambassadors")
        .update({
          university: formData.university,
          whatsapp: formData.whatsapp,
          momo_number: formData.momoNumber,
          momo_network: formData.momoNetwork,
          momo_name: formData.momoName,
          status: "approved",
          referral_code: code,
        })
        .eq("user_id", userId)
        .eq("status", "pending_setup");

      if (error) throw error;

      toast({
        title: "🎉 You're now an Ambassador!",
        description: `Your referral code is: ${code}. Visit your ambassador dashboard to start earning.`,
      });
      onComplete();
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
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-md w-[calc(100vw-2rem)] p-5 sm:p-6 gap-4 max-h-[90vh] overflow-y-auto"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="space-y-2">
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Megaphone className="w-5 h-5 text-primary flex-shrink-0" />
            <span>Welcome, Ambassador {userName || ""}! 🎉</span>
          </DialogTitle>
          <DialogDescription className="text-sm">
            You've been selected as a Campus Ambassador! Complete the form below to activate your account and start earning commissions.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="setup-university">University</Label>
            <div className="relative">
              <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
              <select
                id="setup-university"
                value={formData.university}
                onChange={(e) => handleChange("university", e.target.value)}
                className="w-full pl-10 h-10 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                required
              >
                <option value="">Select your university</option>
                {ghanaUniversities.map((uni) => (
                  <option key={uni} value={uni}>{uni}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="setup-whatsapp">WhatsApp Number</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="setup-whatsapp"
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
            <Label htmlFor="setup-momoNumber">Mobile Money Number</Label>
            <div className="relative">
              <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="setup-momoNumber"
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
            <Label htmlFor="setup-momoNetwork">Network</Label>
            <select
              id="setup-momoNetwork"
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
            <Label htmlFor="setup-momoName">Name on MoMo</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="setup-momoName"
                value={formData.momoName}
                onChange={(e) => handleChange("momoName", e.target.value)}
                placeholder="Name registered on MoMo"
                className="pl-10"
                required
              />
            </div>
          </div>

          <Button type="submit" variant="hero" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Activating...</>
            ) : (
              "Activate My Ambassador Account"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AmbassadorSetupDialog;
