import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { useFavorites } from "@/contexts/FavoritesContext";
import { supabase } from "@/integrations/supabase/client";
import { Heart, Share2, ShoppingBag, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FavoriteItem {
  id: string;
  title: string;
  price: number;
  images: string[];
  university: string | null;
}

const Favorites = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { favorites, removeFavorite } = useFavorites();
  const [favoriteItems, setFavoriteItems] = useState<FavoriteItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFavoriteItems = async () => {
      if (favorites.length === 0) {
        setFavoriteItems([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const { data, error } = await supabase
        .from("listings")
        .select("id, title, price, images, university")
        .in("id", favorites);

      if (error) {
        console.error("Error fetching favorites:", error);
        setFavoriteItems([]);
      } else {
        setFavoriteItems(data || []);
      }
      setIsLoading(false);
    };

    fetchFavoriteItems();
  }, [favorites]);

  const handleRemove = (id: string) => {
    removeFavorite(id);
    toast({
      title: "Removed from favorites",
      description: "The item has been removed from your favorites.",
    });
  };

  const handleShare = (product: FavoriteItem) => {
    const shareUrl = `${window.location.origin}/product/${product.id}`;
    
    if (navigator.share) {
      navigator.share({
        title: product.title,
        text: `Check out ${product.title} on OxiCampus for GH₵${product.price}!`,
        url: shareUrl,
      });
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Link copied!",
        description: "Product link has been copied to clipboard.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
              My <span className="gradient-text">Favorites</span>
            </h1>
            <p className="text-muted-foreground">
              Items you've saved for later ({favorites.length} items)
            </p>
          </div>

          {/* Loading State */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : favoriteItems.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {favoriteItems.map((product) => (
                <div
                  key={product.id}
                  className="bg-card rounded-2xl border border-border overflow-hidden group hover:shadow-purple transition-all duration-300"
                >
                  {/* Image */}
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <Link to={`/product/${product.id}`}>
                      <img
                        src={product.images?.[0] || "https://images.unsplash.com/photo-1560343090-f0409e92791a?w=800"}
                        alt={product.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    </Link>
                    
                    {/* Action Buttons */}
                    <div className="absolute top-3 right-3 flex gap-2">
                      <button
                        onClick={() => handleShare(product)}
                        className="p-2 rounded-full bg-white/90 hover:bg-white shadow-md transition-colors"
                      >
                        <Share2 className="w-4 h-4 text-foreground" />
                      </button>
                      <button
                        onClick={() => handleRemove(product.id)}
                        className="p-2 rounded-full bg-destructive text-destructive-foreground shadow-md hover:bg-destructive/90 transition-colors"
                      >
                        <Heart className="w-4 h-4 fill-current" />
                      </button>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <Link to={`/product/${product.id}`}>
                      <h3 className="font-semibold text-lg line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                        {product.title}
                      </h3>
                    </Link>
                    
                    <div className="flex items-center justify-between mb-4">
                      <div className="font-display text-2xl font-bold gradient-text">
                        GH₵{product.price.toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {product.university || "Unknown"}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Link to={`/product/${product.id}`} className="flex-1">
                        <Button variant="hero" className="w-full">
                          View Details
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleShare(product)}
                      >
                        <Share2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-card rounded-2xl border border-border">
              <div className="w-20 h-20 mx-auto bg-muted rounded-full flex items-center justify-center mb-4">
                <Heart className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="font-display text-2xl font-bold mb-2">
                No favorites yet
              </h3>
              <p className="text-muted-foreground mb-6">
                Start exploring and save items you love
              </p>
              <Link to="/products">
                <Button variant="hero">
                  <ShoppingBag className="w-5 h-5 mr-2" />
                  Browse Listings
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

export default Favorites;