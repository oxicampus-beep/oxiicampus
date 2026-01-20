import { useParams, Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { mockProducts } from "@/data/mockProducts";
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
} from "lucide-react";
import { useState } from "react";

const ProductDetail = () => {
  const { id } = useParams();
  const product = mockProducts.find((p) => p.id === id);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);

  if (!product) {
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
      </div>
    );
  }

  const handleWhatsApp = () => {
    const message = encodeURIComponent(
      `Hi! I'm interested in your listing: "${product.title}" on OxiCampus. Is it still available?`
    );
    window.open(`https://wa.me/${product.seller.phone}?text=${message}`, "_blank");
  };

  const handleCall = () => {
    window.open(`tel:+${product.seller.phone}`, "_self");
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) =>
      prev === product.images.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? product.images.length - 1 : prev - 1
    );
  };

  const conditionLabels = {
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
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-secondary">
                <img
                  src={product.images[currentImageIndex]}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
                {product.images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full glass-card flex items-center justify-center hover:bg-white/50 transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full glass-card flex items-center justify-center hover:bg-white/50 transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}
                {product.isFeatured && (
                  <div className="absolute top-4 left-4 px-4 py-2 gradient-bg rounded-full text-sm font-semibold text-primary-foreground shadow-purple">
                    ⭐ Featured
                  </div>
                )}
              </div>

              {/* Thumbnails */}
              {product.images.length > 1 && (
                <div className="flex gap-3">
                  {product.images.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${
                        currentImageIndex === index
                          ? "border-primary shadow-purple"
                          : "border-transparent hover:border-primary/30"
                      }`}
                    >
                      <img
                        src={img}
                        alt={`${product.title} ${index + 1}`}
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
                    {product.title}
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
                  GH₵{product.price.toLocaleString()}
                </div>
              </div>

              {/* Quick Info */}
              <div className="flex flex-wrap gap-3">
                <span className="px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium">
                  {product.category}
                </span>
                <span className="px-4 py-2 bg-success/10 text-success rounded-full text-sm font-medium">
                  {conditionLabels[product.condition]}
                </span>
              </div>

              {/* Location */}
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="w-5 h-5" />
                <span>
                  {product.location} • {product.university}
                </span>
              </div>

              {/* Seller Card */}
              <div className="p-5 bg-card rounded-2xl border border-border">
                <div className="flex items-center gap-4 mb-4">
                  <img
                    src={product.seller.avatar}
                    alt={product.seller.name}
                    className="w-14 h-14 rounded-full object-cover border-2 border-primary/20"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-lg">
                        {product.seller.name}
                      </span>
                      {product.seller.isVerified && (
                        <BadgeCheck className="w-5 h-5 text-primary" />
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {product.university}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="whatsapp"
                    size="lg"
                    onClick={handleWhatsApp}
                    className="w-full"
                  >
                    <MessageCircle className="w-5 h-5" />
                    WhatsApp
                  </Button>
                  <Button
                    variant="call"
                    size="lg"
                    onClick={handleCall}
                    className="w-full"
                  >
                    <Phone className="w-5 h-5" />
                    Call
                  </Button>
                </div>
              </div>

              {/* Description */}
              <div>
                <h2 className="font-display text-xl font-semibold mb-3">
                  Description
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  {product.description}
                </p>
              </div>

              {/* Posted Date */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>
                  Posted on{" "}
                  {new Date(product.createdAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>

              {/* Share Button */}
              <Button variant="outline" className="gap-2">
                <Share2 className="w-4 h-4" />
                Share Listing
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProductDetail;
