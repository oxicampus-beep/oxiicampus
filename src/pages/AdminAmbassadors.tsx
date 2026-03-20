import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { useRoles } from "@/hooks/useRoles";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Shield, Loader2, CheckCircle, XCircle, Ban, DollarSign, Users, Wallet,
} from "lucide-react";

interface AmbassadorRow {
  id: string;
  user_id: string;
  university: string;
  whatsapp: string;
  momo_number: string;
  momo_network: string;
  momo_name: string;
  referral_code: string | null;
  status: string;
  created_at: string;
  email?: string;
  full_name?: string;
}

interface ReferralRow {
  id: string;
  ambassador_id: string;
  buyer_id: string;
  package: string;
  amount: number;
  commission: number;
  status: string;
  created_at: string;
  ambassador_code?: string;
  ambassador_name?: string;
}

interface WithdrawalRow {
  id: string;
  ambassador_id: string;
  user_id: string;
  amount: number;
  momo_number: string;
  momo_network: string;
  momo_name: string;
  status: string;
  created_at: string;
  ambassador_name?: string;
}

const AdminAmbassadors = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { isAdmin, isLoading: rolesLoading } = useRoles();
  const { toast } = useToast();
  const [ambassadors, setAmbassadors] = useState<AmbassadorRow[]>([]);
  const [referrals, setReferrals] = useState<ReferralRow[]>([]);
  const [withdrawalsList, setWithdrawalsList] = useState<WithdrawalRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    // Fetch ambassadors
    const { data: ambs } = await supabase
      .from("ambassadors")
      .select("*")
      .order("created_at", { ascending: false });

    // Enrich with profile data
    if (ambs && ambs.length > 0) {
      const userIds = ambs.map((a: any) => a.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", userIds);

      const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));

      const enriched = ambs.map((a: any) => ({
        ...a,
        full_name: profileMap.get(a.user_id)?.full_name || "Unknown",
      }));
      setAmbassadors(enriched);
    } else {
      setAmbassadors([]);
    }

    // Fetch all referrals
    const { data: refs } = await supabase
      .from("referrals")
      .select("*")
      .order("created_at", { ascending: false });

    if (refs && refs.length > 0 && ambs) {
      const ambMap = new Map((ambs as any[]).map((a) => [a.id, a]));
      const enrichedRefs = refs.map((r: any) => {
        const amb = ambMap.get(r.ambassador_id);
        return {
          ...r,
          ambassador_code: amb?.referral_code || "N/A",
          ambassador_name: amb?.momo_name || "Unknown",
        };
      });
      setReferrals(enrichedRefs);
    } else {
      setReferrals(refs || []);
    }

    // Fetch withdrawals
    const { data: wds } = await supabase
      .from("withdrawals")
      .select("*")
      .order("created_at", { ascending: false });

    if (wds && wds.length > 0 && ambs) {
      const ambMap = new Map((ambs as any[]).map((a) => [a.id, a]));
      const enrichedWds = wds.map((w: any) => {
        const amb = ambMap.get(w.ambassador_id);
        return { ...w, ambassador_name: amb?.momo_name || "Unknown" };
      });
      setWithdrawalsList(enrichedWds);
    } else {
      setWithdrawalsList(wds || []);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    if (isAdmin) fetchData();
  }, [isAdmin]);

  const handleApprove = async (amb: AmbassadorRow) => {
    setActionLoading(amb.id);
    try {
      // Generate referral code
      const { data: codeData } = await supabase.rpc("generate_referral_code");
      const code = codeData as string;

      const { error } = await supabase
        .from("ambassadors")
        .update({ status: "approved", referral_code: code })
        .eq("id", amb.id);

      if (error) throw error;
      toast({ title: `Approved! Code: ${code}` });
      fetchData();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDecline = async (ambId: string) => {
    setActionLoading(ambId);
    try {
      const { error } = await supabase
        .from("ambassadors")
        .update({ status: "declined" })
        .eq("id", ambId);
      if (error) throw error;
      toast({ title: "Application declined" });
      fetchData();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleSuspend = async (ambId: string) => {
    setActionLoading(ambId);
    try {
      const { error } = await supabase
        .from("ambassadors")
        .update({ status: "suspended" })
        .eq("id", ambId);
      if (error) throw error;
      toast({ title: "Ambassador suspended" });
      fetchData();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkPaid = async (referralId: string) => {
    setActionLoading(referralId);
    try {
      const { error } = await supabase
        .from("referrals")
        .update({ status: "paid" })
        .eq("id", referralId);
      if (error) throw error;
      toast({ title: "Marked as paid" });
      fetchData();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  if (authLoading || rolesLoading) {
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

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 pb-16 text-center">
          <Shield className="w-16 h-16 mx-auto mb-4 text-destructive" />
          <h1 className="font-display text-3xl font-bold mb-4">Access Denied</h1>
          <Button variant="hero" onClick={() => navigate("/")}>Go Home</Button>
        </div>
        <Footer />
      </div>
    );
  }

  const pendingAmbs = ambassadors.filter((a) => a.status === "pending");
  const approvedAmbs = ambassadors.filter((a) => a.status === "approved");
  const pendingReferrals = referrals.filter((r) => r.status === "pending");

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
              <Shield className="inline-block w-8 h-8 mr-3 text-primary" />
              Ambassador Management
            </h1>
            <p className="text-muted-foreground">Manage applications, referral codes, and commissions</p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="p-4">
              <Users className="w-6 h-6 text-primary mb-2" />
              <div className="font-display text-2xl font-bold">{ambassadors.length}</div>
              <div className="text-sm text-muted-foreground">Total Ambassadors</div>
            </Card>
            <Card className="p-4">
              <CheckCircle className="w-6 h-6 text-green-500 mb-2" />
              <div className="font-display text-2xl font-bold">{approvedAmbs.length}</div>
              <div className="text-sm text-muted-foreground">Approved</div>
            </Card>
            <Card className="p-4">
              <DollarSign className="w-6 h-6 text-accent mb-2" />
              <div className="font-display text-2xl font-bold">{referrals.length}</div>
              <div className="text-sm text-muted-foreground">Total Referrals</div>
            </Card>
            <Card className="p-4">
              <DollarSign className="w-6 h-6 text-primary mb-2" />
              <div className="font-display text-2xl font-bold">
                GH₵{referrals.filter(r => r.status === "pending").reduce((s, r) => s + Number(r.commission), 0).toFixed(2)}
              </div>
              <div className="text-sm text-muted-foreground">Pending Payouts</div>
            </Card>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <Tabs defaultValue="applications">
              <TabsList className="mb-6">
                <TabsTrigger value="applications">
                  Applications {pendingAmbs.length > 0 && `(${pendingAmbs.length})`}
                </TabsTrigger>
                <TabsTrigger value="ambassadors">Active Ambassadors</TabsTrigger>
                <TabsTrigger value="commissions">
                  Commissions {pendingReferrals.length > 0 && `(${pendingReferrals.length})`}
                </TabsTrigger>
              </TabsList>

              {/* Applications Tab */}
              <TabsContent value="applications">
                <Card>
                  <CardHeader>
                    <CardTitle>Ambassador Applications</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {pendingAmbs.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">No pending applications</p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>University</TableHead>
                            <TableHead>WhatsApp</TableHead>
                            <TableHead>MoMo</TableHead>
                            <TableHead>Network</TableHead>
                            <TableHead>MoMo Name</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {pendingAmbs.map((amb) => (
                            <TableRow key={amb.id}>
                              <TableCell className="font-medium">{amb.full_name}</TableCell>
                              <TableCell className="max-w-[150px] truncate">{amb.university}</TableCell>
                              <TableCell>{amb.whatsapp}</TableCell>
                              <TableCell>{amb.momo_number}</TableCell>
                              <TableCell>{amb.momo_network}</TableCell>
                              <TableCell>{amb.momo_name}</TableCell>
                              <TableCell>{new Date(amb.created_at).toLocaleDateString()}</TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="default"
                                    onClick={() => handleApprove(amb)}
                                    disabled={actionLoading === amb.id}
                                  >
                                    {actionLoading === amb.id ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <CheckCircle className="w-3 h-3 mr-1" />
                                    )}
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleDecline(amb.id)}
                                    disabled={actionLoading === amb.id}
                                  >
                                    <XCircle className="w-3 h-3 mr-1" />
                                    Decline
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Active Ambassadors Tab */}
              <TabsContent value="ambassadors">
                <Card>
                  <CardHeader>
                    <CardTitle>Active Ambassadors</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {approvedAmbs.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">No active ambassadors</p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>University</TableHead>
                            <TableHead>Referral Code</TableHead>
                            <TableHead>WhatsApp</TableHead>
                            <TableHead>MoMo</TableHead>
                            <TableHead>Referrals</TableHead>
                            <TableHead>Commission Owed</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {approvedAmbs.map((amb) => {
                            const ambRefs = referrals.filter((r) => r.ambassador_id === amb.id);
                            const owed = ambRefs
                              .filter((r) => r.status === "pending")
                              .reduce((s, r) => s + Number(r.commission), 0);
                            return (
                              <TableRow key={amb.id}>
                                <TableCell className="font-medium">{amb.full_name}</TableCell>
                                <TableCell className="max-w-[150px] truncate">{amb.university}</TableCell>
                                <TableCell>
                                  <span className="font-mono font-bold text-primary">{amb.referral_code}</span>
                                </TableCell>
                                <TableCell>{amb.whatsapp}</TableCell>
                                <TableCell>{amb.momo_number} ({amb.momo_network})</TableCell>
                                <TableCell>{ambRefs.length}</TableCell>
                                <TableCell className="font-semibold">GH₵{owed.toFixed(2)}</TableCell>
                                <TableCell>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleSuspend(amb.id)}
                                    disabled={actionLoading === amb.id}
                                  >
                                    <Ban className="w-3 h-3 mr-1" />
                                    Suspend
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Commissions Tab */}
              <TabsContent value="commissions">
                <Card>
                  <CardHeader>
                    <CardTitle>Commission & Payouts</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {referrals.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">No referral transactions yet</p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Ambassador</TableHead>
                            <TableHead>Code</TableHead>
                            <TableHead>Package</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Commission</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {referrals.map((r) => (
                            <TableRow key={r.id}>
                              <TableCell>{new Date(r.created_at).toLocaleDateString()}</TableCell>
                              <TableCell className="font-medium">{r.ambassador_name}</TableCell>
                              <TableCell className="font-mono">{r.ambassador_code}</TableCell>
                              <TableCell className="capitalize">{r.package}</TableCell>
                              <TableCell>GH₵{Number(r.amount).toFixed(2)}</TableCell>
                              <TableCell className="font-semibold text-primary">
                                GH₵{Number(r.commission).toFixed(2)}
                              </TableCell>
                              <TableCell>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                                  r.status === "paid"
                                    ? "bg-green-500/20 text-green-600"
                                    : "bg-accent/20 text-accent"
                                }`}>
                                  {r.status}
                                </span>
                              </TableCell>
                              <TableCell>
                                {r.status === "pending" && (
                                  <Button
                                    size="sm"
                                    variant="default"
                                    onClick={() => handleMarkPaid(r.id)}
                                    disabled={actionLoading === r.id}
                                  >
                                    {actionLoading === r.id ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <CheckCircle className="w-3 h-3 mr-1" />
                                    )}
                                    Mark Paid
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AdminAmbassadors;
