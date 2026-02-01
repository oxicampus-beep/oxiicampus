import { useParams, Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Filter, MapPin, Star, BadgeCheck, Loader2 } from "lucide-react";
import { useListings } from "@/hooks/useListings";

const categories = [
  "Electronics",
  "Books",
  "Services",
  "Clothing",
  "Furniture",
  "Accessories",
];

const Category = () => {
  const { categoryName } = useParams<{ categoryName: string }>();
  const formattedCategory = categoryName 
    ? categoryName.charAt(0).toUpperCase() + categoryName.slice(1)
    : "";

  const { listings, isLoading } = useListings({ category: formattedCategory });

  const categoryDescriptions: Record<string, string> = {
    electronics: "Find the best laptops, phones, tablets, and gadgets from fellow students",
    books: "Discover textbooks, novels, and study materials at student-friendly prices",
    services: "Connect with skilled students offering tutoring, design, and more",
    clothing: "Shop trendy fashion, shoes, and accessories from campus sellers",
    furniture: "Get quality desks, chairs, and dorm essentials for less",
    accessories: "Browse watches, bags, and personal items",
  };

  const conditionColors: Record<string, string> = {
    new: "bg-success text-success-foreground",
    "like-new": "bg-primary text-primary-foreground",
    good: "bg-accent text-accent-foreground",
    fair: "bg-muted text-muted-foreground",
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Header */}
      <section className="pt-24 pb-12 gradient-bg">
        <div className="container mx-auto px-4">
          <Link to="/products">
            <Button variant="ghost" className="text-primary-foreground mb-4 hover:bg-white/10">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Products
            </Button>
          </Link>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-primary-foreground mb-4">
            {formattedCategory}
          </h1>
          <p className="text-primary-foreground/80 text-lg max-w-2xl">
            {categoryDescriptions[categoryName?.toLowerCase() || ""] || 
              `Browse all ${formattedCategory} listings on OxiCampus`}
          </p>
          <div className="mt-4 flex items-center gap-4">
            <span className="px-4 py-2 bg-white/10 rounded-full text-primary-foreground text-sm">
              {listings.length} listings found
            </span>
          </div>
        </div>
      </section>

      {/* Products */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          {/* Filter Bar */}
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-display text-2xl font-bold">
              All <span className="gradient-text">{formattedCategory}</span>
            </h2>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : listings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {listings.map((listing) => (
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
          ) : (
            <div className="text-center py-20">
              <div className="w-20 h-20 mx-auto bg-muted rounded-full flex items-center justify-center mb-4">
                <Filter className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="font-display text-2xl font-bold mb-2">
                No listings yet
              </h3>
              <p className="text-muted-foreground mb-6">
                Be the first to list a {formattedCategory} item!
              </p>
              <Link to="/auth?mode=signup">
                <Button variant="hero">Start Selling</Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Related Categories */}
      <section className="py-12 bg-secondary/30">
        <div className="container mx-auto px-4">
          <h3 className="font-display text-xl font-bold mb-6">
            Explore Other Categories
          </h3>
          <div className="flex flex-wrap gap-3">
            {categories
              .filter((cat) => cat.toLowerCase() !== categoryName?.toLowerCase())
              .map((cat) => (
                <Link key={cat} to={`/category/${cat.toLowerCase()}`}>
                  <Button variant="outline" size="sm">
                    {cat}
                  </Button>
                </Link>
              ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Category;
