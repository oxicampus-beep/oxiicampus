import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2, Wallet, ArrowLeft, AlertCircle, CheckCircle, Clock,
} from "lucide-react";

interface WithdrawalRow {
  id: string;
  amount: number;
  momo_number: string;
  momo_network: string;
  momo_name: string;
  status: string;
  created_at: string;
}

const AmbassadorWithdrawals = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  const [ambassador, setAmbassador] = useState<any>(null);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRow[]>([]);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Withdrawal form
  const [wAmount, setWAmount] = useState("");
  const [wMomoNumber, setWMomoNumber] = useState("");
  const [wMomoNetwork, setWMomoNetwork] = useState("");
  const [wMomoName, setWMomoName] = useState("");
  const [confirmStep, setConfirmStep] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      setIsLoading(true);
      const { data: amb } = await supabase
        .from("ambassadors")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!amb || amb.status !== "approved") {
        setIsLoading(false);
        return;
      }
      setAmbassador(amb);
      setWMomoNumber(amb.momo_number);
      setWMomoNetwork(amb.momo_network);
      setWMomoName(amb.momo_name);

      const { data: refs } = await supabase
        .from("referrals")
        .select("*")
        .eq("ambassador_id", amb.id);
      setReferrals(refs || []);

      const { data: wds } = await supabase
        .from("withdrawals")
        .select("*")
        .eq("ambassador_id", amb.id)
        .order("created_at", { ascending: false });
      setWithdrawals(wds || []);

      setIsLoading(false);
    };
    fetchData();
  }, [user]);

  // Calculate available balance
  const totalCommission = referrals
    .filter((r) => r.status === "paid" || r.status === "pending")
    .reduce((sum, r) => sum + Number(r.commission), 0);
  const totalWithdrawn = withdrawals
    .filter((w) => w.status === "completed" || w.status === "pending")
    .reduce((sum, w) => sum + Number(w.amount), 0);
  const availableBalance = totalCommission - totalWithdrawn;

  const isFriday = new Date().getDay() === 5;

  const handleRequestWithdrawal = () => {
    if (!isFriday) {
      toast({
        title: "Withdrawals only on Fridays",
        description: "You can only request withdrawals on Fridays. Please come back then.",
        variant: "destructive",
      });
      return;
    }
    if (availableBalance <= 0) {
      toast({
        title: "No available balance",
        description: "You don't have any available balance to withdraw.",
        variant: "destructive",
      });
      return;
    }
    setWAmount("");
    setConfirmStep(false);
    setShowDialog(true);
  };

  const handleProceed = () => {
    const amount = parseFloat(wAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: "Invalid amount", variant: "destructive" });
      return;
    }
    if (amount > availableBalance) {
      toast({
        title: "Amount exceeds balance",
        description: `You can only withdraw up to GH₵${availableBalance.toFixed(2)}`,
        variant: "destructive",
      });
      return;
    }
    if (!wMomoNumber || !wMomoNetwork || !wMomoName) {
      toast({ title: "Fill all MoMo details", variant: "destructive" });
      return;
    }
    setConfirmStep(true);
  };

  const handleSubmitWithdrawal = async () => {
    if (!ambassador || !user) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("withdrawals").insert({
        ambassador_id: ambassador.id,
        user_id: user.id,
        amount: parseFloat(wAmount),
        momo_number: wMomoNumber,
        momo_network: wMomoNetwork,
        momo_name: wMomoName,
      });
      if (error) throw error;
      toast({ title: "Withdrawal requested!", description: "You'll receive payment within 24 hours." });
      setShowDialog(false);
      // Refresh withdrawals
      const { data: wds } = await supabase
        .from("withdrawals")
        .select("*")
        .eq("ambassador_id", ambassador.id)
        .order("created_at", { ascending: false });
      setWithdrawals(wds || []);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
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

  if (!user || !ambassador) {
    navigate("/ambassador-dashboard");
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <button
            onClick={() => navigate("/ambassador-dashboard")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>

          <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
            <Wallet className="inline-block w-8 h-8 mr-3 text-primary" />
            Withdrawals
          </h1>
          <p className="text-muted-foreground mb-8">
            View your earnings and request withdrawals. Withdrawals can only be requested on <strong className="text-foreground">Fridays</strong>.
          </p>

          {/* Balance Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <Card className="p-5">
              <div className="text-sm text-muted-foreground mb-1">Total Earned</div>
              <div className="font-display text-2xl font-bold">GH₵{totalCommission.toFixed(2)}</div>
            </Card>
            <Card className="p-5">
              <div className="text-sm text-muted-foreground mb-1">Total Withdrawn</div>
              <div className="font-display text-2xl font-bold">GH₵{totalWithdrawn.toFixed(2)}</div>
            </Card>
            <Card className="p-5 border-2 border-primary/30">
              <div className="text-sm text-muted-foreground mb-1">Available Balance</div>
              <div className="font-display text-2xl font-bold gradient-text">GH₵{availableBalance.toFixed(2)}</div>
            </Card>
          </div>

          {/* Withdraw Button */}
          <div className="mb-8">
            <Button
              variant="hero"
              size="lg"
              onClick={handleRequestWithdrawal}
              disabled={availableBalance <= 0}
            >
              <Wallet className="w-5 h-5 mr-2" />
              Request Withdrawal
            </Button>
            {!isFriday && (
              <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                Withdrawals are only available on Fridays.
              </p>
            )}
          </div>

          {/* Withdrawal History */}
          <Card>
            <CardHeader>
              <CardTitle>Withdrawal History</CardTitle>
            </CardHeader>
            <CardContent>
              {withdrawals.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No withdrawal requests yet.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>MoMo Number</TableHead>
                      <TableHead>Network</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {withdrawals.map((w) => (
                      <TableRow key={w.id}>
                        <TableCell>{new Date(w.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="font-semibold">GH₵{Number(w.amount).toFixed(2)}</TableCell>
                        <TableCell>{w.momo_number}</TableCell>
                        <TableCell>{w.momo_network}</TableCell>
                        <TableCell>{w.momo_name}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                            w.status === "completed"
                              ? "bg-green-500/20 text-green-600"
                              : "bg-yellow-500/20 text-yellow-600"
                          }`}>
                            {w.status === "completed" ? (
                              <><CheckCircle className="w-3 h-3 inline mr-1" />Completed</>
                            ) : (
                              <><Clock className="w-3 h-3 inline mr-1" />Pending</>
                            )}
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

      {/* Withdrawal Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md max-w-[calc(100vw-2rem)]">
          <DialogHeader>
            <DialogTitle>Request Withdrawal</DialogTitle>
            <DialogDescription>
              {confirmStep
                ? "Please confirm your withdrawal details below."
                : "Enter your Mobile Money details and amount."}
            </DialogDescription>
          </DialogHeader>

          {!confirmStep ? (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Amount (GH₵)</Label>
                <Input
                  type="number"
                  value={wAmount}
                  onChange={(e) => setWAmount(e.target.value)}
                  placeholder="0.00"
                  min="0.01"
                  max={availableBalance}
                  step="0.01"
                />
                <p className="text-xs text-muted-foreground">
                  Max: GH₵{availableBalance.toFixed(2)}
                </p>
              </div>
              <div className="space-y-2">
                <Label>MoMo Number</Label>
                <Input
                  value={wMomoNumber}
                  onChange={(e) => setWMomoNumber(e.target.value)}
                  placeholder="0241234567"
                />
              </div>
              <div className="space-y-2">
                <Label>Network</Label>
                <select
                  value={wMomoNetwork}
                  onChange={(e) => setWMomoNetwork(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Select network</option>
                  <option value="MTN">MTN</option>
                  <option value="Vodafone">Vodafone</option>
                  <option value="AirtelTigo">AirtelTigo</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Name on MoMo</Label>
                <Input
                  value={wMomoName}
                  onChange={(e) => setWMomoName(e.target.value)}
                  placeholder="John Mensah"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3 py-2 bg-secondary/50 rounded-xl p-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-bold">GH₵{parseFloat(wAmount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">MoMo Number</span>
                <span className="font-medium">{wMomoNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Network</span>
                <span className="font-medium">{wMomoNetwork}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name on MoMo</span>
                <span className="font-medium">{wMomoName}</span>
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-col gap-2 sm:flex-row">
            {confirmStep ? (
              <>
                <Button variant="ghost" onClick={() => setConfirmStep(false)} className="w-full sm:w-auto">
                  Edit Details
                </Button>
                <Button
                  variant="hero"
                  onClick={handleSubmitWithdrawal}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Confirm & Submit
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={() => setShowDialog(false)} className="w-full sm:w-auto">
                  Cancel
                </Button>
                <Button variant="hero" onClick={handleProceed} className="w-full sm:w-auto">
                  Review Details
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default AmbassadorWithdrawals;
