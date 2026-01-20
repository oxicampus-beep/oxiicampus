import { Zap, Shield, Users, MessageCircle, TrendingUp, Clock } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Instant Listings",
    description: "List your items in under 2 minutes. Simple, fast, and effective.",
    color: "primary",
  },
  {
    icon: Shield,
    title: "Verified Students",
    description: "Connect with verified university students only. Safe and secure.",
    color: "accent",
  },
  {
    icon: MessageCircle,
    title: "Direct Contact",
    description: "WhatsApp and call buttons for instant communication with sellers.",
    color: "primary",
  },
  {
    icon: Users,
    title: "Campus Network",
    description: "Access students from 10+ universities across Ghana.",
    color: "accent",
  },
  {
    icon: TrendingUp,
    title: "Featured Listings",
    description: "Boost your visibility with premium featured placements.",
    color: "primary",
  },
  {
    icon: Clock,
    title: "24/7 Available",
    description: "Your listings work round the clock, even while you study.",
    color: "accent",
  },
];

const FeaturesSection = () => {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
            Why Students Love{" "}
            <span className="gradient-text">OxiCampus</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Everything you need to buy and sell on campus, all in one place.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group relative p-8 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-purple"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div
                className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 ${
                  feature.color === "primary"
                    ? "gradient-bg shadow-purple"
                    : "bg-accent shadow-gold"
                }`}
              >
                <feature.icon className="w-7 h-7 text-primary-foreground" />
              </div>
              <h3 className="font-display text-xl font-semibold mb-3">
                {feature.title}
              </h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
