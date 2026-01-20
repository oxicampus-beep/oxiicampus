import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { MapPin, Star, BadgeCheck, Heart, Share2 } from "lucide-react";
import { Product } from "@/data/mockProducts";
import { useFavorites } from "@/contexts/FavoritesContext";
import { useToast } from "@/hooks/use-toast";

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const { isFavorite, toggleFavorite } = useFavorites();
  const { toast } = useToast();
  const favorite = isFavorite(product.id);

  const conditionColors = {
    new: "bg-success text-success-foreground",
    "like-new": "bg-primary text-primary-foreground",
    good: "bg-accent text-accent-foreground",
    fair: "bg-muted text-muted-foreground",
  };

  const handleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(product.id);
    toast({
      title: favorite ? "Removed from favorites" : "Added to favorites",
      description: favorite 
        ? "Item removed from your favorites." 
        : "Item saved to your favorites!",
    });
  };

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
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
    <Link to={`/product/${product.id}`}>
      <div className="group bg-card rounded-2xl border border-border overflow-hidden transition-all duration-300 hover:shadow-purple hover:border-primary/30 hover:-translate-y-1">
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden">
          <img
            src={product.images[0]}
            alt={product.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          
          {/* Action Buttons */}
          <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleShare}
              className="p-2 rounded-full bg-white/90 hover:bg-white shadow-md transition-colors"
            >
              <Share2 className="w-4 h-4 text-foreground" />
            </button>
            <button
              onClick={handleFavorite}
              className={`p-2 rounded-full shadow-md transition-colors ${
                favorite 
                  ? "bg-destructive text-destructive-foreground" 
                  : "bg-white/90 hover:bg-white text-foreground"
              }`}
            >
              <Heart className={`w-4 h-4 ${favorite ? "fill-current" : ""}`} />
            </button>
          </div>
          
          {product.isFeatured && (
            <div className="absolute top-3 left-3 px-3 py-1 gradient-bg rounded-full flex items-center gap-1.5 shadow-purple">
              <Star className="w-3.5 h-3.5 text-primary-foreground fill-current" />
              <span className="text-xs font-semibold text-primary-foreground">
                Featured
              </span>
            </div>
          )}
          <div
            className={`absolute bottom-3 left-3 px-2 py-1 rounded-full text-xs font-medium ${
              conditionColors[product.condition]
            }`}
          >
            {product.condition.charAt(0).toUpperCase() + product.condition.slice(1)}
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">
              {product.title}
            </h3>
          </div>

          <div className="flex items-center gap-1.5 text-muted-foreground text-sm mb-3">
            <MapPin className="w-4 h-4" />
            <span>{product.location}</span>
            <span className="text-border">•</span>
            <span>{product.university}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="font-display text-2xl font-bold gradient-text">
              GH₵{product.price.toLocaleString()}
            </div>
            <div className="flex items-center gap-2">
              <img
                src={product.seller.avatar}
                alt={product.seller.name}
                className="w-8 h-8 rounded-full object-cover border-2 border-background"
              />
              {product.seller.isVerified && (
                <BadgeCheck className="w-4 h-4 text-primary" />
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
