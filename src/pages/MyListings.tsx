import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { mockProducts } from "@/data/mockProducts";
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Eye, 
  MoreVertical,
  AlertCircle,
  Package,
  Star,
  Crown
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

const MyListings = () => {
  // Mock user's listings (first 3 for demo)
  const [listings, setListings] = useState(mockProducts.slice(0, 3));
  
  const user = {
    plan: "Pro",
    listingsCount: 3,
    listingsLimit: 10,
  };

  const handleDelete = (id: string) => {
    setListings(listings.filter((listing) => listing.id !== id));
  };

  const canAddMore = user.listingsCount < user.listingsLimit;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-24 pb-12">
        <div className="container mx-auto px-4">
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
                <Button variant="gold" className="mt-4 md:mt-0">
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
                    <span className="font-semibold">{user.plan} Plan</span>
                    <Badge variant="outline" className="border-primary text-primary">
                      {user.listingsCount}/{user.listingsLimit} used
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    You can list {user.listingsLimit - user.listingsCount} more items this month
                  </p>
                </div>
              </div>
              <div className="w-full md:w-48">
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="gradient-bg h-2 rounded-full transition-all"
                    style={{ width: `${(user.listingsCount / user.listingsLimit) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Listings Grid */}
          {listings.length > 0 ? (
            <div className="grid gap-4">
              {listings.map((listing) => (
                <div
                  key={listing.id}
                  className="bg-card rounded-xl border border-border p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col md:flex-row gap-4">
                    {/* Image */}
                    <div className="w-full md:w-32 h-32 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={listing.images[0]}
                        alt={listing.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-lg truncate">
                              {listing.title}
                            </h3>
                            {listing.isFeatured && (
                              <Badge className="gradient-bg text-primary-foreground">
                                <Star className="w-3 h-3 mr-1 fill-current" />
                                Featured
                              </Badge>
                            )}
                          </div>
                          <p className="text-muted-foreground text-sm line-clamp-2 mb-2">
                            {listing.description}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outline">{listing.category}</Badge>
                            <Badge variant="outline">{listing.condition}</Badge>
                            <Badge variant="outline">{listing.university}</Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-display text-xl font-bold gradient-text">
                            GH₵{listing.price.toLocaleString()}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Listed: {listing.createdAt}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex md:flex-col gap-2 md:justify-center">
                      <Link to={`/product/${listing.id}`}>
                        <Button variant="outline" size="sm" className="w-full">
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </Button>
                      </Link>
                      <Button variant="outline" size="sm">
                        <Edit2 className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
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
