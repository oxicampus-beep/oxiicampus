import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { listingStatuses, planLimits } from "@/data/constants";
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Eye, 
  Package,
  Star,
  Crown,
  Loader2,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Listing {
  id: string;
  title: string;
  description: string | null;
  price: number;
  category: string;
  condition: string | null;
  university: string | null;
  images: string[] | null;
  is_featured: boolean | null;
  status: string | null;
  created_at: string;
}

const MyListings = () => {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Check subscription expiry to determine effective plan
  const subscriptionExpiresAt = profile?.subscription_expires_at 
    ? new Date(profile.subscription_expires_at) 
    : null;
  const isSubscriptionExpired = subscriptionExpiresAt && new Date() > subscriptionExpiresAt;
  const effectivePlan = isSubscriptionExpired ? "free" : (profile?.plan || "free");
  const listingsLimit = planLimits[effectivePlan] || 1;
  const canAddMore = listings.length < listingsLimit;

  useEffect(() => {
    const fetchListings = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        toast({
          title: "Error loading listings",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setListings(data || []);
      }
      
      setIsLoading(false);
    };

    fetchListings();
  }, [user, toast]);

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("listings")
      .delete()
      .eq("id", id)
      .eq("user_id", user?.id);

    if (error) {
      toast({
        title: "Error deleting listing",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setListings(listings.filter((listing) => listing.id !== id));
      toast({
        title: "Listing deleted",
        description: "Your listing has been removed.",
      });
      
      // Update profile listings count
      if (profile) {
        await supabase
          .from("profiles")
          .update({ listings_count: Math.max(0, (profile.listings_count || 1) - 1) })
          .eq("user_id", user?.id);
        refreshProfile();
      }
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    const { error } = await supabase
      .from("listings")
      .update({ status: newStatus })
      .eq("id", id)
      .eq("user_id", user?.id);

    if (error) {
      toast({
        title: "Error updating status",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setListings(listings.map((listing) => 
        listing.id === id ? { ...listing, status: newStatus } : listing
      ));
      toast({
        title: "Status updated",
        description: `Listing marked as ${newStatus}`,
      });
    }
  };

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case "sold":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "unavailable":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
  };

  const getStatusBadge = (status: string | null) => {
    const statusInfo = listingStatuses.find(s => s.value === status) || listingStatuses[0];
    return (
      <Badge variant="outline" className="capitalize">
        <span className={`w-2 h-2 rounded-full ${statusInfo.color} mr-1.5`} />
        {statusInfo.label}
      </Badge>
    );
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 pb-12">
          <div className="container mx-auto px-4 text-center">
            <h1 className="font-display text-3xl font-bold mb-4">Sign in to view your listings</h1>
            <Button variant="hero" onClick={() => navigate("/auth")}>
              Sign In
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

      <div className="pt-24 pb-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
                My <span className="gradient-text">Listings</span>
              </h1>
              <p className="text-muted-foreground">
                Manage your products and services on OxiCampus
              </p>
            </div>
            
            {canAddMore ? (
              <Link to="/create-listing">
                <Button variant="hero" className="mt-4 md:mt-0">
                  <Plus className="w-5 h-5 mr-2" />
                  Add New Listing
                </Button>
              </Link>
            ) : (
              <Link to="/pricing">
                <Button variant="outline" className="mt-4 md:mt-0 border-accent text-accent hover:bg-accent/10">
                  <Crown className="w-5 h-5 mr-2" />
                  Upgrade to List More
                </Button>
              </Link>
            )}
          </div>

          {/* Plan Status */}
          <div className="bg-card rounded-xl border border-border p-4 mb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center">
                  <Package className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold capitalize">{effectivePlan} Plan</span>
                    <Badge variant="outline" className="border-primary text-primary">
                      {listings.length}/{listingsLimit} used
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    You can list {Math.max(0, listingsLimit - listings.length)} more items
                  </p>
                </div>
              </div>
              <div className="w-full md:w-48">
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="gradient-bg h-2 rounded-full transition-all"
                    style={{ width: `${Math.min((listings.length / listingsLimit) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Listings Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : listings.length > 0 ? (
            <div className="grid gap-4 md:gap-6">
              {listings.map((listing) => (
                <div
                  key={listing.id}
                  className={`bg-card rounded-xl border border-border p-4 md:p-6 hover:shadow-md transition-shadow ${
                    listing.status === "sold" ? "opacity-75" : ""
                  }`}
                >
                  <div className="flex flex-col md:flex-row gap-4">
                    {/* Image */}
                    <div className="w-full md:w-32 h-32 rounded-lg overflow-hidden flex-shrink-0 relative">
                      <img
                        src={listing.images?.[0] || "https://images.unsplash.com/photo-1560343090-f0409e92791a?w=800"}
                        alt={listing.title}
                        className="w-full h-full object-cover"
                      />
                      {listing.status === "sold" && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <span className="text-white font-bold">SOLD</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-semibold text-lg truncate">
                              {listing.title}
                            </h3>
                            {listing.is_featured && (
                              <Badge className="gradient-bg text-primary-foreground">
                                <Star className="w-3 h-3 mr-1 fill-current" />
                                Featured
                              </Badge>
                            )}
                            {getStatusBadge(listing.status)}
                          </div>
                          <p className="text-muted-foreground text-sm line-clamp-2 mb-2">
                            {listing.description}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outline">{listing.category}</Badge>
                            {listing.condition && (
                              <Badge variant="outline" className="capitalize">
                                {listing.condition.replace("_", " ")}
                              </Badge>
                            )}
                            {listing.university && (
                              <Badge variant="outline">{listing.university}</Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="font-display text-xl font-bold gradient-text">
                            GH₵{listing.price.toLocaleString()}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {new Date(listing.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex md:flex-col gap-2 md:justify-center flex-shrink-0">
                      <Link to={`/product/${listing.id}`}>
                        <Button variant="outline" size="sm" className="w-full">
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </Button>
                      </Link>
                      <Link to={`/edit-listing/${listing.id}`}>
                        <Button variant="outline" size="sm" className="w-full">
                          <Edit2 className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                      </Link>
                      
                      {/* Status Dropdown */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="w-full">
                            {getStatusIcon(listing.status)}
                            <span className="ml-2">Status</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          {listingStatuses.map((status) => (
                            <DropdownMenuItem
                              key={status.value}
                              onClick={() => handleStatusChange(listing.id, status.value)}
                              className="cursor-pointer"
                            >
                              <span className={`w-2 h-2 rounded-full ${status.color} mr-2`} />
                              {status.label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Listing?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete your listing.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDelete(listing.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-card rounded-2xl border border-border">
              <div className="w-20 h-20 mx-auto bg-muted rounded-full flex items-center justify-center mb-4">
                <Package className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="font-display text-2xl font-bold mb-2">
                No listings yet
              </h3>
              <p className="text-muted-foreground mb-6">
                Start selling by creating your first listing
              </p>
              <Link to="/create-listing">
                <Button variant="hero">
                  <Plus className="w-5 h-5 mr-2" />
                  Create Your First Listing
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default MyListings;
