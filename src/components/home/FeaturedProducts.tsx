import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Star } from "lucide-react";
import ProductCard from "@/components/products/ProductCard";
import { mockProducts } from "@/data/mockProducts";

const FeaturedProducts = () => {
  const featuredProducts = mockProducts.filter((product) => product.isFeatured);

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredProducts.slice(0, 3).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;
