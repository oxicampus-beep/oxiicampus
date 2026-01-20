import { useParams, Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ProductCard from "@/components/products/ProductCard";
import { mockProducts, categories } from "@/data/mockProducts";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Filter } from "lucide-react";

const Category = () => {
  const { categoryName } = useParams<{ categoryName: string }>();
  const formattedCategory = categoryName 
    ? categoryName.charAt(0).toUpperCase() + categoryName.slice(1)
    : "";

  const filteredProducts = mockProducts.filter(
    (product) => product.category.toLowerCase() === categoryName?.toLowerCase()
  );

  const categoryDescriptions: Record<string, string> = {
    electronics: "Find the best laptops, phones, tablets, and gadgets from fellow students",
    books: "Discover textbooks, novels, and study materials at student-friendly prices",
    services: "Connect with skilled students offering tutoring, design, and more",
    clothing: "Shop trendy fashion, shoes, and accessories from campus sellers",
    furniture: "Get quality desks, chairs, and dorm essentials for less",
    accessories: "Browse watches, bags, and personal items",
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
              {filteredProducts.length} listings found
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

          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
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
              .filter((cat) => cat.toLowerCase() !== categoryName?.toLowerCase() && cat !== "All")
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
