import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check, Star, Crown, Zap } from "lucide-react";

const plans = [
  {
    name: "Free",
    price: "0",
    period: "forever",
    description: "Perfect for occasional sellers",
    icon: Zap,
    features: [
      "1 listing per month",
      "Basic listing visibility",
      "Direct WhatsApp contact",
      "Direct call button",
      "Standard support",
    ],
    buttonText: "Get Started",
    buttonVariant: "outline" as const,
    popular: false,
  },
  {
    name: "Pro",
    price: "30",
    period: "per month",
    description: "For active campus vendors",
    icon: Star,
    features: [
      "10 listings per month",
      "Enhanced visibility",
      "Direct WhatsApp contact",
      "Direct call button",
      "Priority support",
      "Listing analytics",
    ],
    buttonText: "Go Pro",
    buttonVariant: "hero" as const,
    popular: true,
  },
  {
    name: "Premium",
    price: "75",
    period: "per month",
    description: "For serious business owners",
    icon: Crown,
    features: [
      "50 listings per month",
      "Featured listings",
      "Verified vendor badge",
      "Top search placement",
      "Priority support 24/7",
      "Advanced analytics",
      "Custom vendor profile",
    ],
    buttonText: "Go Premium",
    buttonVariant: "gold" as const,
    popular: false,
  },
];

const PricingSection = () => {
  return (
    <section className="py-24 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
            Simple, Transparent{" "}
            <span className="gradient-text">Pricing</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that fits your selling needs. Upgrade anytime.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative p-8 rounded-2xl bg-card border-2 transition-all duration-300 hover:-translate-y-2 ${
                plan.popular
                  ? "border-primary shadow-purple"
                  : "border-border hover:border-primary/30"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 gradient-bg rounded-full text-sm font-semibold text-primary-foreground">
                  Most Popular
                </div>
              )}

              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    plan.name === "Premium"
                      ? "bg-accent shadow-gold"
                      : "gradient-bg shadow-purple"
                  }`}
                >
                  <plan.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="font-display text-2xl font-bold">{plan.name}</h3>
              </div>

              <div className="mb-2">
                <span className="font-display text-5xl font-bold">
                  GH₵{plan.price}
                </span>
                <span className="text-muted-foreground ml-2">/{plan.period}</span>
              </div>

              <p className="text-muted-foreground mb-6">{plan.description}</p>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full gradient-bg flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </div>
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link to="/auth?mode=signup">
                <Button variant={plan.buttonVariant} className="w-full">
                  {plan.buttonText}
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
