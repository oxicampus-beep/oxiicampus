import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useRoles } from "@/hooks/useRoles";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Shield,
  Package,
  Search,
  Loader2,
  Star,
  StarOff,
  Trash2,
  Edit,
  Eye,
  ArrowLeft,
} from "lucide-react";

interface Listing {
  id: string;
  title: string;
  price: number;
  category: string;
  status: string | null;
  is_featured: boolean | null;
  created_at: string;
  user_id: string;
  images: string[] | null;
  seller?: {
    full_name: string | null;
    is_verified: boolean | null;
  };
}

const AdminListings = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { isAdmin, isLoading: rolesLoading } = useRoles();
  const { toast } = useToast();
  
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchListings = async () => {
    setIsLoading(true);
    
    let query = supabase
      .from("listings")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (searchTerm) {
      query = query.ilike("title", `%${searchTerm}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching listings:", error);
      toast({
        title: "Error",
        description: "Failed to fetch listings",
        variant: "destructive",
      });
    } else {
      // Fetch seller profiles
      const userIds = [...new Set(data?.map((l) => l.user_id) || [])];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, is_verified")
        .in("user_id", userIds);

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]));
      
      const listingsWithSellers = data?.map((listing) => ({
        ...listing,
        seller: profileMap.get(listing.user_id),
      })) || [];

      setListings(listingsWithSellers);
    }
    
    setIsLoading(false);
  };

  useEffect(() => {
    if (isAdmin) {
      fetchListings();
    }
  }, [isAdmin, searchTerm]);

  const handleToggleFeatured = async (listing: Listing) => {
    setActionLoading(listing.id);
    
    const { error } = await supabase
      .from("listings")
      .update({ is_featured: !listing.is_featured })
      .eq("id", listing.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update listing",
        variant: "destructive",
      });
    } else {
      toast({
        title: listing.is_featured ? "Removed from featured" : "Featured!",
        description: `Listing ${listing.is_featured ? "removed from" : "added to"} featured`,
      });
      fetchListings();
    }
    
    setActionLoading(null);
  };

  const handleDelete = async (listing: Listing) => {
    if (!confirm(`Are you sure you want to delete "${listing.title}"?`)) return;
    
    setActionLoading(listing.id);
    
    const { error } = await supabase
      .from("listings")
      .delete()
      .eq("id", listing.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete listing",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Deleted",
        description: "Listing has been deleted",
      });
      fetchListings();
    }
    
    setActionLoading(null);
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
          {/* Back Button */}
          <button
            onClick={() => navigate("/admin")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
                <Package className="inline-block w-8 h-8 mr-3 text-primary" />
                Manage Listings
              </h1>
              <p className="text-muted-foreground">
                Feature, edit, or delete listings
              </p>
            </div>

            {/* Search */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search listings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Listings Table */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : listings.length === 0 ? (
            <Card className="p-12 text-center">
              <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-display text-xl font-semibold mb-2">No listings found</h3>
              <p className="text-muted-foreground">
                {searchTerm ? "Try a different search term" : "No listings available"}
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {listings.map((listing) => (
                <Card
                  key={listing.id}
                  className="p-4 flex flex-col md:flex-row md:items-center gap-4"
                >
                  {/* Image */}
                  <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                    <img
                      src={listing.images?.[0] || "https://images.unsplash.com/photo-1560343090-f0409e92791a?w=200"}
                      alt={listing.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold truncate">{listing.title}</h3>
                      {listing.is_featured && (
                        <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full font-medium">
                          Featured
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      GH₵{listing.price.toLocaleString()} • {listing.category} • {listing.status}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Seller: {listing.seller?.full_name || "Unknown"} 
                      {listing.seller?.is_verified && (
                        <span className="text-yellow-600 ml-1">✓ Verified</span>
                      )}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleFeatured(listing)}
                      disabled={actionLoading === listing.id}
                    >
                      {actionLoading === listing.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : listing.is_featured ? (
                        <>
                          <StarOff className="w-4 h-4 mr-1" />
                          Unfeature
                        </>
                      ) : (
                        <>
                          <Star className="w-4 h-4 mr-1" />
                          Feature
                        </>
                      )}
                    </Button>
                    <Link to={`/product/${listing.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Link to={`/edit-listing/${listing.id}`}>
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(listing)}
                      disabled={actionLoading === listing.id}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default AdminListings;