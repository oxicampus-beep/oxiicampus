import { useParams, Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { useListing } from "@/hooks/useListings";
import { useAuth } from "@/contexts/AuthContext";
import MessageDialog from "@/components/products/MessageDialog";
import ImageLightbox from "@/components/products/ImageLightbox";
import ImageWatermark from "@/components/products/ImageWatermark";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowLeft,
  MapPin,
  BadgeCheck,
  Phone,
  MessageCircle,
  Calendar,
  Share2,
  Heart,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Send,
  ZoomIn,
} from "lucide-react";
import { useState } from "react";

// Social share icons as simple components
const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const TwitterIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { listing, isLoading } = useListing(id);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setIsLightboxOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-32 pb-16 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-32 pb-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="font-display text-3xl font-bold mb-4">
              Product Not Found
            </h1>
            <Link to="/products">
              <Button variant="hero">Back to Listings</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const images = listing.images && listing.images.length > 0 
    ? listing.images 
    : ["https://images.unsplash.com/photo-1560343090-f0409e92791a?w=800"];

  const handleWhatsApp = () => {
    const whatsappNumber = listing.whatsapp_number || listing.phone_number;
    if (!whatsappNumber) {
      alert("Seller hasn't provided a WhatsApp number");
      return;
    }
    const cleanNumber = whatsappNumber.replace(/\D/g, '');
    const message = encodeURIComponent(
      `Hi! I'm interested in your listing: "${listing.title}" on OxiCampus. Is it still available?`
    );
    window.open(`https://wa.me/${cleanNumber}?text=${message}`, "_blank");
  };

  const handleCall = () => {
    const phoneNumber = listing.phone_number;
    if (!phoneNumber) {
      alert("Seller hasn't provided a phone number");
      return;
    }
    window.open(`tel:${phoneNumber}`, "_self");
  };

  const handleMessage = () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    setIsMessageDialogOpen(true);
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) =>
      prev === images.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? images.length - 1 : prev - 1
    );
  };

  const conditionLabels: Record<string, string> = {
    new: "Brand New",
    "like-new": "Like New",
    good: "Good Condition",
    fair: "Fair Condition",
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Back Button */}
          <Link
            to="/products"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to listings
          </Link>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Image Gallery */}
            <div className="space-y-4">
              <div
                className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-secondary cursor-pointer group"
                onClick={() => openLightbox(currentImageIndex)}
              >
                <img
                  src={images[currentImageIndex]}
                  alt={listing.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                {/* Watermark */}
                <ImageWatermark sellerName={listing.seller?.full_name} size="lg" />
                {/* Zoom Indicator */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-full p-3">
                    <ZoomIn className="w-6 h-6 text-foreground" />
                  </div>
                </div>
                {images.length > 1 && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        prevImage();
                      }}
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full glass-card flex items-center justify-center hover:bg-white/50 transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        nextImage();
                      }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full glass-card flex items-center justify-center hover:bg-white/50 transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}
                {listing.is_featured && (
                  <div className="absolute top-4 left-4 px-4 py-2 gradient-bg rounded-full text-sm font-semibold text-primary-foreground shadow-purple">
                    ⭐ Featured
                  </div>
                )}
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="flex gap-3">
                  {images.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-all hover:scale-105 ${
                        currentImageIndex === index
                          ? "border-primary shadow-purple"
                          : "border-transparent hover:border-primary/30"
                      }`}
                    >
                      <img
                        src={img}
                        alt={`${listing.title} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              {/* Title & Price */}
              <div>
                <div className="flex items-start justify-between gap-4 mb-2">
                  <h1 className="font-display text-3xl md:text-4xl font-bold">
                    {listing.title}
                  </h1>
                  <button
                    onClick={() => setIsLiked(!isLiked)}
                    className={`p-3 rounded-xl border transition-all ${
                      isLiked
                        ? "bg-destructive/10 border-destructive text-destructive"
                        : "border-border hover:border-primary/30"
                    }`}
                  >
                    <Heart
                      className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`}
                    />
                  </button>
                </div>
                <div className="font-display text-4xl md:text-5xl font-bold gradient-text">
                  GH₵{listing.price.toLocaleString()}
                </div>
              </div>

              {/* Quick Info */}
              <div className="flex flex-wrap gap-3">
                <span className="px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium">
                  {listing.category}
                </span>
                {listing.condition && (
                  <span className="px-4 py-2 bg-success/10 text-success rounded-full text-sm font-medium">
                    {conditionLabels[listing.condition] || listing.condition}
                  </span>
                )}
              </div>

              {/* Location */}
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="w-5 h-5" />
                <span>{listing.university || "Ghana"}</span>
              </div>

              {/* Seller Card */}
              <div className="p-5 bg-card rounded-2xl border border-border">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                    {listing.seller?.avatar_url ? (
                      <img
                        src={listing.seller.avatar_url}
                        alt={listing.seller.full_name || "Seller"}
                        className="w-14 h-14 rounded-full object-cover border-2 border-primary/20"
                      />
                    ) : (
                      <span className="text-2xl font-bold text-primary">
                        {(listing.seller?.full_name || "S")[0].toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-lg">
                        {listing.seller?.full_name || "Seller"}
                      </span>
                      {listing.seller?.is_verified && (
                        <BadgeCheck className="w-5 h-5 text-primary" />
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {listing.seller?.university || listing.university}
                    </span>
                  </div>
                </div>

                <div className={`grid ${listing.seller?.plan && listing.seller.plan !== 'free' ? 'grid-cols-3' : 'grid-cols-2'} gap-3`}>
                  {listing.seller?.plan && listing.seller.plan !== 'free' && (
                    <Button
                      variant="whatsapp"
                      onClick={handleWhatsApp}
                      className="w-full h-11"
                      disabled={!listing.whatsapp_number && !listing.phone_number}
                    >
                      <MessageCircle className="w-4 h-4" />
                      WhatsApp
                    </Button>
                  )}
                  <Button
                    variant="call"
                    onClick={handleCall}
                    className="w-full h-11"
                    disabled={!listing.phone_number}
                  >
                    <Phone className="w-4 h-4" />
                    Call
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleMessage}
                    className="w-full h-11"
                  >
                    <Send className="w-4 h-4" />
                    Message
                  </Button>
                </div>
              </div>

              {/* Description */}
              <div>
                <h2 className="font-display text-xl font-semibold mb-3">
                  Description
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  {listing.description || "No description provided."}
                </p>
              </div>

              {/* Posted Date */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>
                  Posted on{" "}
                  {new Date(listing.created_at).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>

              {/* Share Button */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Share2 className="w-4 h-4" />
                    Share Listing
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  <DropdownMenuItem
                    onClick={() => {
                      const url = `${window.location.origin}/product/${listing.id}`;
                      const text = `Check out this listing: "${listing.title}" for GH₵${listing.price.toLocaleString()} on OxiCampus!`;
                      window.open(`https://wa.me/?text=${encodeURIComponent(text + " " + url)}`, "_blank");
                    }}
                    className="cursor-pointer gap-3 text-[#25D366]"
                  >
                    <WhatsAppIcon />
                    Share on WhatsApp
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      const url = `${window.location.origin}/product/${listing.id}`;
                      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank");
                    }}
                    className="cursor-pointer gap-3 text-[#1877F2]"
                  >
                    <FacebookIcon />
                    Share on Facebook
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      const url = `${window.location.origin}/product/${listing.id}`;
                      const text = `Check out this listing: "${listing.title}" for GH₵${listing.price.toLocaleString()} on OxiCampus!`;
                      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, "_blank");
                    }}
                    className="cursor-pointer gap-3"
                  >
                    <TwitterIcon />
                    Share on X
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Message Dialog */}
      <MessageDialog
        isOpen={isMessageDialogOpen}
        onClose={() => setIsMessageDialogOpen(false)}
        sellerId={listing.user_id}
        sellerName={listing.seller?.full_name || "Seller"}
        sellerAvatar={listing.seller?.avatar_url}
        listingId={listing.id}
        listingTitle={listing.title}
        listingImage={images[0]}
        listingPrice={listing.price}
      />

      {/* Image Lightbox */}
      <ImageLightbox
        images={images}
        initialIndex={lightboxIndex}
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        title={listing.title}
        sellerName={listing.seller?.full_name}
      />
    </div>
  );
};

export default ProductDetail;
