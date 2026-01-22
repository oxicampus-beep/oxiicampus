import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useRoles } from "@/hooks/useRoles";
import { supabase } from "@/integrations/supabase/client";
import {
  Shield,
  Users,
  Package,
  MessageCircle,
  TrendingUp,
  DollarSign,
  Loader2,
  ArrowUpRight,
  UserCog,
  ListChecks,
  BarChart3,
} from "lucide-react";

interface DashboardStats {
  totalUsers: number;
  totalListings: number;
  activeListings: number;
  totalMessages: number;
  proUsers: number;
  premiumUsers: number;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { isAdmin, isLoading: rolesLoading } = useRoles();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [recentListings, setRecentListings] = useState<any[]>([]);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);

  useEffect(() => {
    if (!isAdmin) return;

    const fetchStats = async () => {
      setIsLoading(true);

      try {
        // Fetch counts in parallel
        const [usersResult, listingsResult, activeListingsResult, messagesResult, proResult, premiumResult] =
          await Promise.all([
            supabase.from("profiles").select("*", { count: "exact", head: true }),
            supabase.from("listings").select("*", { count: "exact", head: true }),
            supabase.from("listings").select("*", { count: "exact", head: true }).eq("status", "available"),
            supabase.from("messages").select("*", { count: "exact", head: true }),
            supabase.from("profiles").select("*", { count: "exact", head: true }).eq("plan", "pro"),
            supabase.from("profiles").select("*", { count: "exact", head: true }).eq("plan", "premium"),
          ]);

        setStats({
          totalUsers: usersResult.count || 0,
          totalListings: listingsResult.count || 0,
          activeListings: activeListingsResult.count || 0,
          totalMessages: messagesResult.count || 0,
          proUsers: proResult.count || 0,
          premiumUsers: premiumResult.count || 0,
        });

        // Fetch recent listings
        const { data: listings } = await supabase
          .from("listings")
          .select("id, title, created_at, status, price")
          .order("created_at", { ascending: false })
          .limit(5);
        setRecentListings(listings || []);

        // Fetch recent users
        const { data: users } = await supabase
          .from("profiles")
          .select("id, user_id, full_name, plan, created_at, is_verified")
          .order("created_at", { ascending: false })
          .limit(5);
        setRecentUsers(users || []);
      } catch (err) {
        console.error("Error fetching stats:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [isAdmin]);

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
            <p className="text-muted-foreground mb-6">
              You need admin privileges to access this page.
            </p>
            <Button variant="hero" onClick={() => navigate("/")}>
              Go Home
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
              <Shield className="inline-block w-8 h-8 mr-3 text-primary" />
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground">
              Manage users, listings, and monitor platform activity
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Link to="/admin/users">
              <Card className="p-4 hover:shadow-purple transition-shadow cursor-pointer">
                <UserCog className="w-8 h-8 text-primary mb-2" />
                <h3 className="font-semibold">Manage Users</h3>
                <p className="text-sm text-muted-foreground">Roles & verification</p>
              </Card>
            </Link>
            <Link to="/admin/listings">
              <Card className="p-4 hover:shadow-purple transition-shadow cursor-pointer">
                <ListChecks className="w-8 h-8 text-accent mb-2" />
                <h3 className="font-semibold">Manage Listings</h3>
                <p className="text-sm text-muted-foreground">Feature, edit, delete</p>
              </Card>
            </Link>
            <Link to="/messages">
              <Card className="p-4 hover:shadow-purple transition-shadow cursor-pointer">
                <MessageCircle className="w-8 h-8 text-success mb-2" />
                <h3 className="font-semibold">Messages</h3>
                <p className="text-sm text-muted-foreground">View conversations</p>
              </Card>
            </Link>
            <Link to="/products">
              <Card className="p-4 hover:shadow-purple transition-shadow cursor-pointer">
                <BarChart3 className="w-8 h-8 text-primary mb-2" />
                <h3 className="font-semibold">Browse Listings</h3>
                <p className="text-sm text-muted-foreground">View all products</p>
              </Card>
            </Link>
          </div>

          {/* Stats Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : stats && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
              <Card className="p-4">
                <Users className="w-6 h-6 text-primary mb-2" />
                <div className="font-display text-2xl font-bold">{stats.totalUsers}</div>
                <div className="text-sm text-muted-foreground">Total Users</div>
              </Card>
              <Card className="p-4">
                <Package className="w-6 h-6 text-accent mb-2" />
                <div className="font-display text-2xl font-bold">{stats.totalListings}</div>
                <div className="text-sm text-muted-foreground">Total Listings</div>
              </Card>
              <Card className="p-4">
                <TrendingUp className="w-6 h-6 text-success mb-2" />
                <div className="font-display text-2xl font-bold">{stats.activeListings}</div>
                <div className="text-sm text-muted-foreground">Active Listings</div>
              </Card>
              <Card className="p-4">
                <MessageCircle className="w-6 h-6 text-primary mb-2" />
                <div className="font-display text-2xl font-bold">{stats.totalMessages}</div>
                <div className="text-sm text-muted-foreground">Messages</div>
              </Card>
              <Card className="p-4">
                <DollarSign className="w-6 h-6 text-accent mb-2" />
                <div className="font-display text-2xl font-bold">{stats.proUsers}</div>
                <div className="text-sm text-muted-foreground">Pro Users</div>
              </Card>
              <Card className="p-4">
                <DollarSign className="w-6 h-6 text-success mb-2" />
                <div className="font-display text-2xl font-bold">{stats.premiumUsers}</div>
                <div className="text-sm text-muted-foreground">Premium Users</div>
              </Card>
            </div>
          )}

          {/* Recent Activity */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Recent Users */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-lg font-semibold">Recent Users</h3>
                <Link
                  to="/admin/users"
                  className="text-primary text-sm hover:underline flex items-center gap-1"
                >
                  View all <ArrowUpRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="space-y-3">
                {recentUsers.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{u.full_name || "Unnamed User"}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(u.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                        u.plan === "premium"
                          ? "bg-success/20 text-success"
                          : u.plan === "pro"
                          ? "bg-accent/20 text-accent"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {u.plan || "free"}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Recent Listings */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-lg font-semibold">Recent Listings</h3>
                <Link
                  to="/products"
                  className="text-primary text-sm hover:underline flex items-center gap-1"
                >
                  View all <ArrowUpRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="space-y-3">
                {recentListings.map((listing) => (
                  <Link
                    key={listing.id}
                    to={`/product/${listing.id}`}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                  >
                    <div>
                      <p className="font-medium truncate max-w-[200px]">{listing.title}</p>
                      <p className="text-xs text-muted-foreground">
                        GH₵{listing.price.toLocaleString()}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                        listing.status === "available"
                          ? "bg-success/20 text-success"
                          : listing.status === "sold"
                          ? "bg-destructive/20 text-destructive"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {listing.status || "available"}
                    </span>
                  </Link>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default AdminDashboard;
