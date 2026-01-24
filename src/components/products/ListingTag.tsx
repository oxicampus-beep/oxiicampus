import { Link } from "react-router-dom";
import { Package } from "lucide-react";

interface ListingTagProps {
  listingId: string;
  title: string;
  image?: string | null;
  price?: number;
  compact?: boolean;
}

const ListingTag = ({ listingId, title, image, price, compact = false }: ListingTagProps) => {
  if (compact) {
    return (
      <Link
        to={`/product/${listingId}`}
        className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors text-xs"
      >
        {image ? (
          <img src={image} alt={title} className="w-4 h-4 rounded object-cover" />
        ) : (
          <Package className="w-3 h-3 text-primary" />
        )}
        <span className="text-primary font-medium truncate max-w-[150px]">{title}</span>
      </Link>
    );
  }

  return (
    <Link
      to={`/product/${listingId}`}
      className="flex items-center gap-3 p-3 bg-muted/50 hover:bg-muted rounded-xl border border-border transition-colors mb-3"
    >
      <div className="w-12 h-12 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
        {image ? (
          <img src={image} alt={title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-5 h-5 text-muted-foreground" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{title}</p>
        {price !== undefined && (
          <p className="text-xs text-primary font-semibold">GH₵{price.toLocaleString()}</p>
        )}
      </div>
    </Link>
  );
};

export default ListingTag;
