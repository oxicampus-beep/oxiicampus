import { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ProductCard from "@/components/products/ProductCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { mockProducts, categories, universities } from "@/data/mockProducts";
import { Search, SlidersHorizontal, X } from "lucide-react";

const Products = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedUniversity, setSelectedUniversity] = useState("All Universities");
  const [showFilters, setShowFilters] = useState(false);

  const filteredProducts = mockProducts.filter((product) => {
    const matchesSearch = product.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" || product.category === selectedCategory;
    const matchesUniversity =
      selectedUniversity === "All Universities" ||
      product.university === selectedUniversity;
    return matchesSearch && matchesCategory && matchesUniversity;
  });

  const featuredProducts = filteredProducts.filter((p) => p.isFeatured);
  const regularProducts = filteredProducts.filter((p) => !p.isFeatured);
  const sortedProducts = [...featuredProducts, ...regularProducts];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
              Browse <span className="gradient-text">Listings</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Discover great deals from students across Ghana
            </p>
          </div>

          {/* Search and Filter Bar */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search for items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 rounded-xl border-2 focus:border-primary"
              />
            </div>
            <Button
              variant="outline"
              size="lg"
              onClick={() => setShowFilters(!showFilters)}
              className="md:w-auto"
            >
              <SlidersHorizontal className="w-5 h-5 mr-2" />
              Filters
              {(selectedCategory !== "All" ||
                selectedUniversity !== "All Universities") && (
                <span className="ml-2 w-5 h-5 rounded-full gradient-bg text-primary-foreground text-xs flex items-center justify-center">
                  {(selectedCategory !== "All" ? 1 : 0) +
                    (selectedUniversity !== "All Universities" ? 1 : 0)}
                </span>
              )}
            </Button>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mb-8 p-6 bg-card rounded-2xl border border-border animate-slide-up">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">Filters</h3>
                <button
                  onClick={() => {
                    setSelectedCategory("All");
                    setSelectedUniversity("All Universities");
                  }}
                  className="text-sm text-primary hover:underline"
                >
                  Clear all
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Categories */}
                <div>
                  <label className="block text-sm font-medium mb-3">
                    Category
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((category) => (
                      <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                          selectedCategory === category
                            ? "gradient-bg text-primary-foreground shadow-purple"
                            : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Universities */}
                <div>
                  <label className="block text-sm font-medium mb-3">
                    University
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {universities.map((uni) => (
                      <button
                        key={uni}
                        onClick={() => setSelectedUniversity(uni)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                          selectedUniversity === uni
                            ? "gradient-bg text-primary-foreground shadow-purple"
                            : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                        }`}
                      >
                        {uni}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Active Filters */}
          {(selectedCategory !== "All" ||
            selectedUniversity !== "All Universities") && (
            <div className="flex flex-wrap gap-2 mb-6">
              {selectedCategory !== "All" && (
                <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm">
                  {selectedCategory}
                  <button onClick={() => setSelectedCategory("All")}>
                    <X className="w-4 h-4" />
                  </button>
                </span>
              )}
              {selectedUniversity !== "All Universities" && (
                <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm">
                  {selectedUniversity}
                  <button onClick={() => setSelectedUniversity("All Universities")}>
                    <X className="w-4 h-4" />
                  </button>
                </span>
              )}
            </div>
          )}

          {/* Results Count */}
          <p className="text-muted-foreground mb-6">
            {sortedProducts.length} listing{sortedProducts.length !== 1 && "s"} found
          </p>

          {/* Products Grid */}
          {sortedProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {sortedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-display text-xl font-semibold mb-2">
                No listings found
              </h3>
              <p className="text-muted-foreground">
                Try adjusting your filters or search query
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Products;
