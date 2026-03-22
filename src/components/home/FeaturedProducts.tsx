import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Star, MapPin, BadgeCheck, Loader2 } from "lucide-react";
import { useListings } from "@/hooks/useListings";

// Fisher-Yates shuffle algorithm
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const FeaturedProducts = () => {
  const { listings, isLoading } = useListings({ limit: 20, featuredOnly: true });
  
  // Pick up to 3 featured listings randomly
  const displayListings = useMemo(() => {
    if (listings.length === 0) return [];
    const shuffled = shuffleArray(listings);
    return shuffled.slice(0, 3);
  }, [listings]);

  const conditionColors: Record<string, string> = {
    new: "bg-success text-success-foreground",
    "like-new": "bg-primary text-primary-foreground",
    good: "bg-accent text-accent-foreground",
    fair: "bg-muted text-muted-foreground",
  };

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <Star className="w-4 h-4 text-primary fill-current" />
              <span className="text-sm font-medium text-primary">
                Featured Listings
              </span>
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-bold">
              Hot Deals on <span className="gradient-text">Campus</span>
            </h2>
            <p className="text-muted-foreground mt-2 max-w-lg">
              Discover the best products from verified sellers across Ghana's top universities
            </p>
          </div>
          <Link to="/products" className="mt-4 md:mt-0">
            <Button variant="outline" className="group">
              View All Listings
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : displayListings.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground">No listings available yet.</p>
            <Link to="/create-listing" className="mt-4 inline-block">
              <Button>Create First Listing</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayListings.map((listing) => (
              <Link key={listing.id} to={`/product/${listing.id}`}>
                <div className="group bg-card rounded-2xl border border-border overflow-hidden transition-all duration-300 hover:shadow-purple hover:border-primary/30 hover:-translate-y-1">
                  {/* Image */}
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img
                      src={listing.images?.[0] || "/placeholder.svg"}
                      alt={listing.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    
                    {listing.is_featured && (
                      <div className="absolute top-3 left-3 px-3 py-1 gradient-bg rounded-full flex items-center gap-1.5 shadow-purple">
                        <Star className="w-3.5 h-3.5 text-primary-foreground fill-current" />
                        <span className="text-xs font-semibold text-primary-foreground">
                          Featured
                        </span>
                      </div>
                    )}
                    {listing.condition && (
                      <div
                        className={`absolute bottom-3 left-3 px-2 py-1 rounded-full text-xs font-medium ${
                          conditionColors[listing.condition] || "bg-muted text-muted-foreground"
                        }`}
                      >
                        {listing.condition.charAt(0).toUpperCase() + listing.condition.slice(1)}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">
                        {listing.title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1.5 text-muted-foreground text-sm mb-3">
                      <MapPin className="w-4 h-4" />
                      <span>{listing.university || "Unknown"}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="font-display text-2xl font-bold gradient-text">
                        GH₵{listing.price.toLocaleString()}
                      </div>
                      <div className="flex items-center gap-2">
                        <img
                          src={listing.seller?.avatar_url || "/placeholder.svg"}
                          alt={listing.seller?.full_name || "Seller"}
                          className="w-8 h-8 rounded-full object-cover border-2 border-background"
                        />
                        {listing.seller?.is_verified && (
                          <BadgeCheck className="w-4 h-4 text-primary" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedProducts;
