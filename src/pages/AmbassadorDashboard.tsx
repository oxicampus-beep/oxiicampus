import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2, Users, DollarSign, Clock, Copy, CheckCircle, Megaphone, AlertCircle,
} from "lucide-react";

interface AmbassadorData {
  id: string;
  referral_code: string | null;
  status: string;
  university: string;
}

interface ReferralData {
  id: string;
  package: string;
  amount: number;
  commission: number;
  status: string;
  created_at: string;
  buyer_id: string;
}

const AmbassadorDashboard = () => {
  const navigate = useNavigate();
  const { user, profile, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [ambassador, setAmbassador] = useState<AmbassadorData | null>(null);
  const [referrals, setReferrals] = useState<ReferralData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      setIsLoading(true);
      const { data: amb } = await supabase
        .from("ambassadors")
        .select("id, referral_code, status, university")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!amb) {
        setIsLoading(false);
        return;
      }
      setAmbassador(amb);

      if (amb.status === "approved" && amb.id) {
        const { data: refs } = await supabase
          .from("referrals")
          .select("*")
          .eq("ambassador_id", amb.id)
          .order("created_at", { ascending: false });
        setReferrals(refs || []);
      }
      setIsLoading(false);
    };
    fetchData();
  }, [user]);

  const copyCode = () => {
    if (ambassador?.referral_code) {
      navigator.clipboard.writeText(ambassador.referral_code);
      setCopied(true);
      toast({ title: "Referral code copied!" });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 pb-16 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!user) {
    navigate("/auth");
    return null;
  }

  if (!ambassador) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 pb-16 text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="font-display text-2xl font-bold mb-2">No Ambassador Profile</h1>
          <p className="text-muted-foreground mb-6">You haven't applied as an ambassador yet.</p>
          <Button variant="hero" onClick={() => navigate("/ambassador-apply")}>
            Apply Now
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  if (ambassador.status === "pending") {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 pb-16 text-center">
          <Clock className="w-16 h-16 mx-auto mb-4 text-accent" />
          <h1 className="font-display text-2xl font-bold mb-2">Application Pending</h1>
          <p className="text-muted-foreground mb-6">
            Your ambassador application is under review. Please contact an admin for approval.
          </p>
          <Button variant="outline" onClick={() => navigate("/")}>
            Back to Home
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  if (ambassador.status === "declined" || ambassador.status === "suspended") {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 pb-16 text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-destructive" />
          <h1 className="font-display text-2xl font-bold mb-2">
            Application {ambassador.status === "declined" ? "Declined" : "Suspended"}
          </h1>
          <p className="text-muted-foreground mb-6">Please contact support for more information.</p>
          <Button variant="outline" onClick={() => navigate("/contact")}>
            Contact Support
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  // Stats
  const totalReferrals = referrals.length;
  const premiumPurchases = referrals.filter((r) => r.package === "premium").length;
  const totalCommission = referrals.reduce((sum, r) => sum + Number(r.commission), 0);
  const pendingPayouts = referrals
    .filter((r) => r.status === "pending")
    .reduce((sum, r) => sum + Number(r.commission), 0);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
              <Megaphone className="inline-block w-8 h-8 mr-3 text-primary" />
              Ambassador Dashboard
            </h1>
            <p className="text-muted-foreground">
              Welcome, {profile?.full_name || "Ambassador"} — {ambassador.university}
            </p>
          </div>

          {/* Referral Code */}
          <Card className="mb-8 border-2 border-primary/30">
            <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Your Referral Code</p>
                <p className="font-display text-4xl font-bold tracking-widest gradient-text">
                  {ambassador.referral_code || "N/A"}
                </p>
              </div>
              <Button variant="hero" size="lg" onClick={copyCode} disabled={!ambassador.referral_code}>
                {copied ? (
                  <><CheckCircle className="w-5 h-5 mr-2" /> Copied!</>
                ) : (
                  <><Copy className="w-5 h-5 mr-2" /> Copy Code</>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="p-4">
              <Users className="w-6 h-6 text-primary mb-2" />
              <div className="font-display text-2xl font-bold">{totalReferrals}</div>
              <div className="text-sm text-muted-foreground">Total Referrals</div>
            </Card>
            <Card className="p-4">
              <DollarSign className="w-6 h-6 text-accent mb-2" />
              <div className="font-display text-2xl font-bold">{premiumPurchases}</div>
              <div className="text-sm text-muted-foreground">Premium Purchases</div>
            </Card>
            <Card className="p-4">
              <DollarSign className="w-6 h-6 text-primary mb-2" />
              <div className="font-display text-2xl font-bold">GH₵{totalCommission.toFixed(2)}</div>
              <div className="text-sm text-muted-foreground">Total Commission</div>
            </Card>
            <Card className="p-4">
              <Clock className="w-6 h-6 text-accent mb-2" />
              <div className="font-display text-2xl font-bold">GH₵{pendingPayouts.toFixed(2)}</div>
              <div className="text-sm text-muted-foreground">Pending Payouts</div>
            </Card>
          </div>

          {/* Referral History */}
          <Card>
            <CardHeader>
              <CardTitle>Referral History</CardTitle>
            </CardHeader>
            <CardContent>
              {referrals.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No referrals yet. Share your code to start earning!
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Package</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Commission</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {referrals.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell>{new Date(r.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="capitalize font-medium">{r.package}</TableCell>
                        <TableCell>GH₵{Number(r.amount).toFixed(2)}</TableCell>
                        <TableCell className="font-semibold text-primary">
                          GH₵{Number(r.commission).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                              r.status === "paid"
                                ? "bg-green-500/20 text-green-600"
                                : "bg-accent/20 text-accent"
                            }`}
                          >
                            {r.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AmbassadorDashboard;
