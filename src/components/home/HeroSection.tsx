import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Sparkles, ShoppingBag, Search } from "lucide-react";

const HeroSection = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <section className="relative min-h-[110vh] md:min-h-[115vh] flex items-center justify-center overflow-hidden pt-16 pb-24 gradient-bg">
      {/* Background Elements */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-deep/20 rounded-full blur-3xl" />
      </div>
      
      {/* Floating Elements */}
      <div className="absolute top-32 right-[20%] animate-float hidden md:block">
        <div className="glass-card p-4 rounded-2xl shadow-lg border border-white/20">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
      </div>
      <div className="absolute bottom-40 left-[15%] animate-float hidden md:block" style={{ animationDelay: "2s" }}>
        <div className="glass-card p-4 rounded-2xl shadow-lg border border-white/20">
          <ShoppingBag className="w-8 h-8 text-accent" />
        </div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 mb-8 animate-slide-up backdrop-blur-sm">
            <Sparkles className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium text-white">
              Ghana's #1 Student Marketplace
            </span>
          </div>

          {/* Headline with Animation */}
          <h1 className="font-display text-4xl sm:text-5xl md:text-7xl font-bold mb-6 animate-slide-up-delay-1 text-white">
            <span className="inline-block animate-text-shimmer bg-clip-text text-transparent bg-[linear-gradient(110deg,#fff,45%,#e0b0ff,55%,#fff)] bg-[length:250%_100%]">
              Buy & Sell on
            </span>
            <span className="block mt-2 text-white drop-shadow-lg">Your Campus</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl md:text-2xl text-white/80 mb-8 max-w-2xl mx-auto animate-slide-up-delay-2 px-4">
            Connect with fellow students. List your items. Reach thousands of buyers across universities in Ghana.
          </p>

          {/* Search Bar - Responsive */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-10 animate-slide-up-delay-2 px-4">
            <div className="relative flex flex-col sm:flex-row items-stretch gap-2 sm:gap-0">
              <div className="relative flex-1">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Search className="w-5 h-5 text-muted-foreground" />
                </div>
                <Input
                  type="text"
                  placeholder="Search for laptops, textbooks, services..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-6 text-base sm:text-lg rounded-full sm:rounded-l-full sm:rounded-r-none bg-white/95 backdrop-blur-sm border-0 shadow-lg focus-visible:ring-accent"
                />
              </div>
              <Button
                type="submit"
                variant="hero"
                className="w-full sm:w-auto rounded-full sm:rounded-l-none sm:rounded-r-full px-8 py-6"
              >
                <span className="sm:hidden">Search</span>
                <span className="hidden sm:inline">Search</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </form>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-slide-up-delay-3 px-4">
            <Link to="/auth?mode=signup" className="w-full sm:w-auto">
              <Button size="xl" className="w-full sm:w-auto bg-white text-primary hover:bg-white/90 shadow-lg group">
                Start Selling Free
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link to="/products" className="w-full sm:w-auto">
              <Button variant="outline" size="xl" className="w-full sm:w-auto border-white/50 text-white hover:bg-white/10">
                Browse Listings
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 sm:gap-8 max-w-xl mx-auto px-4">
            <div className="text-center animate-slide-up-delay-3">
              <div className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-white">5K+</div>
              <div className="text-xs sm:text-sm text-white/70 mt-1">Active Listings</div>
            </div>
            <div className="text-center animate-slide-up-delay-3">
              <div className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-white">10+</div>
              <div className="text-xs sm:text-sm text-white/70 mt-1">Universities</div>
            </div>
            <div className="text-center animate-slide-up-delay-3">
              <div className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-white">20K+</div>
              <div className="text-xs sm:text-sm text-white/70 mt-1">Students</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
            fill="hsl(var(--background))"
          />
        </svg>
      </div>
    </section>
  );
};

export default HeroSection;
