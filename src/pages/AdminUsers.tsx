import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { useRoles, AppRole } from "@/hooks/useRoles";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Shield,
  Search,
  Loader2,
  User as UserIcon,
  BadgeCheck,
  Crown,
  UserCog,
  ShieldCheck,
  ArrowLeft,
  ChevronDown,
  Megaphone,
} from "lucide-react";


type PlanType = "free" | "pro" | "premium";

interface UserWithRoles {
  id: string;
  user_id: string;
  full_name: string | null;
  email?: string;
  plan: string | null;
  is_verified: boolean | null;
  roles: AppRole[];
  is_ambassador: boolean;
  ambassador_status?: string;
}

const AdminUsers = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { isAdmin, isLoading: rolesLoading } = useRoles();
  const { toast } = useToast();

  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [ambassadorDialogUser, setAmbassadorDialogUser] = useState<UserWithRoles | null>(null);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const [profilesRes, rolesRes, ambassadorsRes] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("*"),
        supabase.from("ambassadors").select("user_id, status"),
      ]);

      if (profilesRes.error) throw profilesRes.error;
      if (rolesRes.error) throw rolesRes.error;

      const ambassadorMap = new Map(
        (ambassadorsRes.data || []).map((a: any) => [a.user_id, a.status])
      );

      const usersWithRoles = (profilesRes.data || []).map((profile) => ({
        ...profile,
        roles: (rolesRes.data || [])
          .filter((r: any) => r.user_id === profile.user_id)
          .map((r: any) => r.role as AppRole),
        is_ambassador: ambassadorMap.has(profile.user_id),
        ambassador_status: ambassadorMap.get(profile.user_id),
      }));

      setUsers(usersWithRoles);
    } catch (err) {
      console.error("Error fetching users:", err);
      toast({ title: "Error", description: "Failed to load users", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) fetchUsers();
  }, [isAdmin]);

  const handleAssignRole = async (userId: string, role: AppRole) => {
    try {
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
      if (error) throw error;
      toast({ title: "Role assigned", description: `Successfully assigned ${role} role` });
      fetchUsers();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleRemoveRole = async (userId: string, role: AppRole) => {
    try {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role);
      if (error) throw error;
      toast({ title: "Role removed", description: `Successfully removed ${role} role` });
      fetchUsers();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleToggleVerified = async (userItem: UserWithRoles) => {
    setActionLoading(userItem.user_id);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_verified: !userItem.is_verified })
        .eq("user_id", userItem.user_id);
      if (error) throw error;
      toast({
        title: userItem.is_verified ? "Badge removed" : "Badge granted",
        description: userItem.is_verified ? "Verified badge has been removed" : "User now has a verified badge",
      });
      fetchUsers();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleChangePlan = async (userItem: UserWithRoles, newPlan: PlanType) => {
    if (userItem.plan === newPlan) return;
    setActionLoading(userItem.user_id);
    try {
      const { error } = await supabase.from("profiles").update({ plan: newPlan }).eq("user_id", userItem.user_id);
      if (error) throw error;
      toast({ title: "Plan updated", description: `User plan changed to ${newPlan}` });
      fetchUsers();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveAmbassador = async (userItem: UserWithRoles) => {
    setActionLoading(userItem.user_id);
    try {
      const { error } = await supabase.from("ambassadors").delete().eq("user_id", userItem.user_id);
      if (error) throw error;
      toast({ title: "Ambassador removed", description: "User is no longer an ambassador" });
      fetchUsers();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const getPlanBadgeColor = (plan: string | null) => {
    switch (plan) {
      case "premium": return "bg-yellow-500/20 text-yellow-600 border-yellow-500/30";
      case "pro": return "bg-blue-500/20 text-blue-600 border-blue-500/30";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.user_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        <div className="pt-24 pb-16">
          <div className="container mx-auto px-4 text-center">
            <Shield className="w-16 h-16 mx-auto mb-4 text-destructive" />
            <h1 className="font-display text-3xl font-bold mb-4">Access Denied</h1>
            <p className="text-muted-foreground mb-6">You need admin privileges to access this page.</p>
            <Button variant="hero" onClick={() => navigate("/")}>Go Home</Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const getRoleIcon = (role: AppRole) => {
    switch (role) {
      case "admin": return <Shield className="w-3 h-3" />;
      case "moderator": return <ShieldCheck className="w-3 h-3" />;
      default: return <UserCog className="w-3 h-3" />;
    }
  };

  const getRoleBadgeColor = (role: AppRole) => {
    switch (role) {
      case "admin": return "bg-destructive text-destructive-foreground";
      case "moderator": return "bg-accent text-accent-foreground";
      default: return "bg-secondary text-secondary-foreground";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <button
              onClick={() => navigate("/admin")}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </button>

            <div className="flex items-center justify-between mb-8">
              <h1 className="font-display text-3xl md:text-4xl font-bold">
                <Shield className="inline-block w-8 h-8 mr-3 text-primary" />
                User Management
              </h1>
            </div>

            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search users by name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12"
              />
            </div>

            <div className="bg-card rounded-2xl border border-border overflow-hidden">
              {isLoading ? (
                <div className="flex items-center justify-center h-48">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">No users found</div>
              ) : (
                <div className="divide-y divide-border">
                  {filteredUsers.map((userItem) => (
                    <div key={userItem.id} className="p-4 flex flex-col md:flex-row md:items-center gap-4">
                      {/* User Info */}
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <UserIcon className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{userItem.full_name || "Unnamed User"}</span>
                            {userItem.is_verified && <BadgeCheck className="w-4 h-4 text-yellow-500" />}
                          </div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm text-muted-foreground font-mono">
                              {userItem.user_id.slice(0, 8)}...
                            </p>
                            {userItem.is_ambassador && (
                              <Badge
                                variant="outline"
                                className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-primary/30"
                              >
                                <Megaphone className="w-2.5 h-2.5 mr-0.5" />
                                Ambassador{userItem.ambassador_status === "pending" ? " (Pending)" : ""}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Plan Selector */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className={`capitalize w-fit gap-1 ${getPlanBadgeColor(userItem.plan)}`}
                            disabled={actionLoading === userItem.user_id}
                          >
                            <Crown className="w-3 h-3" />
                            {userItem.plan || "free"}
                            <ChevronDown className="w-3 h-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {(["free", "pro", "premium"] as PlanType[]).map((plan) => (
                            <DropdownMenuItem
                              key={plan}
                              onClick={() => handleChangePlan(userItem, plan)}
                              className={userItem.plan === plan || (!userItem.plan && plan === "free") ? "bg-accent" : ""}
                            >
                              <Crown className={`w-3 h-3 mr-2 ${plan === "premium" ? "text-yellow-500" : plan === "pro" ? "text-blue-500" : "text-muted-foreground"}`} />
                              <span className="capitalize">{plan}</span>
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>

                      {/* Current Roles */}
                      <div className="flex flex-wrap gap-2">
                        {userItem.roles.map((role) => (
                          <Badge
                            key={role}
                            className={`${getRoleBadgeColor(role)} cursor-pointer`}
                            onClick={() => handleRemoveRole(userItem.user_id, role)}
                          >
                            {getRoleIcon(role)}
                            <span className="ml-1 capitalize">{role}</span>
                            <span className="ml-1 text-xs">×</span>
                          </Badge>
                        ))}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          size="sm"
                          variant={userItem.is_verified ? "destructive" : "outline"}
                          onClick={() => handleToggleVerified(userItem)}
                          disabled={actionLoading === userItem.user_id}
                        >
                          {actionLoading === userItem.user_id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <>
                              <BadgeCheck className="w-3 h-3 mr-1" />
                              {userItem.is_verified ? "Remove Badge" : "Verify"}
                            </>
                          )}
                        </Button>

                        {!userItem.roles.includes("admin") && (
                          <Button size="sm" variant="outline" onClick={() => handleAssignRole(userItem.user_id, "admin")}>
                            <Shield className="w-3 h-3 mr-1" />Admin
                          </Button>
                        )}
                        {!userItem.roles.includes("moderator") && (
                          <Button size="sm" variant="outline" onClick={() => handleAssignRole(userItem.user_id, "moderator")}>
                            <ShieldCheck className="w-3 h-3 mr-1" />Mod
                          </Button>
                        )}

                        {/* Ambassador toggle */}
                        {userItem.is_ambassador ? (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleRemoveAmbassador(userItem)}
                            disabled={actionLoading === userItem.user_id}
                          >
                            <Megaphone className="w-3 h-3 mr-1" />
                            Remove Amb
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setAmbassadorDialogUser(userItem)}
                          >
                            <Megaphone className="w-3 h-3 mr-1" />
                            Make Amb
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Ambassador Info Dialog */}
      {ambassadorDialogUser && (
        <AmbassadorInfoDialog
          open={!!ambassadorDialogUser}
          onClose={() => setAmbassadorDialogUser(null)}
          userId={ambassadorDialogUser.user_id}
          userName={ambassadorDialogUser.full_name}
          onSuccess={fetchUsers}
        />
      )}

      <Footer />
    </div>
  );
};

export default AdminUsers;
