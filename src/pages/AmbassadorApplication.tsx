import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ghanaUniversities } from "@/data/constants";
import { Loader2, Megaphone, GraduationCap, Phone, User, Banknote } from "lucide-react";

const momoNetworks = ["MTN", "Vodafone", "AirtelTigo"];

const AmbassadorApplication = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [formData, setFormData] = useState({
    fullName: profile?.full_name || "",
    university: profile?.university || "",
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
    if (!user) {
      toast({ title: "Please sign in first", variant: "destructive" });
      navigate("/auth");
      return;
    }

    setIsLoading(true);
    try {
      // Check if already applied
      const { data: existing } = await supabase
        .from("ambassadors")
        .select("id, status")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        toast({
          title: existing.status === "pending" ? "Application already submitted" : "You're already an ambassador",
          description: existing.status === "pending"
            ? "Please wait for admin approval."
            : "Visit your ambassador dashboard.",
        });
        setIsLoading(false);
        return;
      }

      const { error } = await supabase.from("ambassadors").insert({
        user_id: user.id,
        university: formData.university,
        whatsapp: formData.whatsapp,
        momo_number: formData.momoNumber,
        momo_network: formData.momoNetwork,
        momo_name: formData.momoName,
      });

      if (error) throw error;

      setSubmitted(true);
      toast({
        title: "Application submitted!",
        description: "An admin will review your application soon.",
      });
    } catch (err: any) {
      toast({
        title: "Submission failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    navigate("/auth?mode=signup&type=ambassador");
    return null;
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 pb-16 flex items-center justify-center">
          <Card className="max-w-lg w-full mx-4">
            <CardHeader className="text-center">
              <div className="w-16 h-16 rounded-full gradient-bg flex items-center justify-center mx-auto mb-4">
                <Megaphone className="w-8 h-8 text-primary-foreground" />
              </div>
              <CardTitle className="text-2xl">Application Submitted!</CardTitle>
              <CardDescription className="text-base mt-2">
                Your ambassador application has been submitted. Please contact an admin for approval. 
                You will receive access to your dashboard once approved.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button variant="hero" onClick={() => navigate("/")}>
                Back to Home
              </Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-lg">
          <Card>
            <CardHeader className="text-center">
              <div className="w-14 h-14 rounded-2xl gradient-bg flex items-center justify-center mx-auto mb-3">
                <Megaphone className="w-7 h-7 text-primary-foreground" />
              </div>
              <CardTitle className="text-2xl">Ambassador Application</CardTitle>
              <CardDescription>Fill in your details to apply as a Campus Ambassador</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Full Name */}
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => handleChange("fullName", e.target.value)}
                      placeholder="Your full name"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                {/* University */}
                <div className="space-y-2">
                  <Label htmlFor="university">University</Label>
                  <div className="relative">
                    <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
                    <select
                      id="university"
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

                {/* WhatsApp */}
                <div className="space-y-2">
                  <Label htmlFor="whatsapp">WhatsApp Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="whatsapp"
                      type="tel"
                      value={formData.whatsapp}
                      onChange={(e) => handleChange("whatsapp", e.target.value)}
                      placeholder="0XX XXX XXXX"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                {/* MoMo Number */}
                <div className="space-y-2">
                  <Label htmlFor="momoNumber">Mobile Money Number</Label>
                  <div className="relative">
                    <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="momoNumber"
                      type="tel"
                      value={formData.momoNumber}
                      onChange={(e) => handleChange("momoNumber", e.target.value)}
                      placeholder="0XX XXX XXXX"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                {/* MoMo Network */}
                <div className="space-y-2">
                  <Label htmlFor="momoNetwork">Network</Label>
                  <select
                    id="momoNetwork"
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

                {/* Name on MoMo */}
                <div className="space-y-2">
                  <Label htmlFor="momoName">Name on MoMo</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="momoName"
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
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</>
                  ) : (
                    "Submit Application"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AmbassadorApplication;
