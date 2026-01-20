import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Users, ShoppingBag } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Background Elements */}
      <div className="absolute inset-0 gradient-hero-bg opacity-5" />
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-pulse-slow" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse-slow" />
      
      {/* Floating Elements */}
      <div className="absolute top-32 right-[20%] animate-float">
        <div className="glass-card p-4 rounded-2xl shadow-purple">
          <Sparkles className="w-8 h-8 text-primary" />
        </div>
      </div>
      <div className="absolute bottom-40 left-[15%] animate-float" style={{ animationDelay: "2s" }}>
        <div className="glass-card p-4 rounded-2xl shadow-gold">
          <ShoppingBag className="w-8 h-8 text-accent" />
        </div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8 animate-slide-up">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">
              Ghana's #1 Student Marketplace
            </span>
          </div>

          {/* Headline */}
          <h1 className="font-display text-5xl md:text-7xl font-bold mb-6 animate-slide-up-delay-1">
            Buy & Sell on
            <span className="block gradient-text">Your Campus</span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-2xl mx-auto animate-slide-up-delay-2">
            Connect with fellow students. List your items. Reach thousands of buyers across universities in Ghana.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-slide-up-delay-3">
            <Link to="/auth?mode=signup">
              <Button variant="hero" size="xl" className="group">
                Start Selling Free
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link to="/products">
              <Button variant="outline" size="xl">
                Browse Listings
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-xl mx-auto">
            <div className="text-center animate-slide-up-delay-3">
              <div className="font-display text-3xl md:text-4xl font-bold gradient-text">5K+</div>
              <div className="text-sm text-muted-foreground mt-1">Active Listings</div>
            </div>
            <div className="text-center animate-slide-up-delay-3">
              <div className="font-display text-3xl md:text-4xl font-bold gradient-text">10+</div>
              <div className="text-sm text-muted-foreground mt-1">Universities</div>
            </div>
            <div className="text-center animate-slide-up-delay-3">
              <div className="font-display text-3xl md:text-4xl font-bold gradient-text">20K+</div>
              <div className="text-sm text-muted-foreground mt-1">Students</div>
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
