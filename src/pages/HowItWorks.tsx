import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { 
  UserPlus, 
  Camera, 
  MessageCircle, 
  ShoppingBag,
  Shield,
  Zap,
  Users,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const steps = [
  {
    icon: UserPlus,
    title: "Create Your Account",
    description: "Sign up in seconds with your email. It's completely free to get started.",
  },
  {
    icon: Camera,
    title: "List Your Items",
    description: "Take photos, add a description, set your price, and you're live in minutes.",
  },
  {
    icon: MessageCircle,
    title: "Connect with Buyers",
    description: "Respond to interested buyers and negotiate directly through the platform.",
  },
  {
    icon: ShoppingBag,
    title: "Make the Sale",
    description: "Meet up on campus to complete the transaction safely and securely.",
  },
];

const benefits = [
  {
    icon: Shield,
    title: "Safe & Secure",
    description: "Trade with verified students from your university community.",
  },
  {
    icon: Zap,
    title: "Fast & Easy",
    description: "List items in under 2 minutes and reach thousands of students instantly.",
  },
  {
    icon: Users,
    title: "Campus Community",
    description: "Connect with fellow students who understand your needs.",
  },
];

const HowItWorks = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero */}
      <section className="pt-24 pb-16 gradient-bg">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center text-white">
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
              How OxiCampus Works
            </h1>
            <p className="text-xl text-white/80">
              The simplest way to buy and sell on campus. Get started in minutes.
            </p>
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid gap-8">
              {steps.map((step, index) => (
                <div 
                  key={step.title}
                  className="flex items-start gap-6 p-6 rounded-2xl bg-card border border-border hover:shadow-lg transition-shadow"
                >
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 rounded-2xl gradient-bg flex items-center justify-center">
                      <step.icon className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-bold text-primary">Step {index + 1}</span>
                    </div>
                    <h3 className="font-display text-xl font-bold mb-2">{step.title}</h3>
                    <p className="text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Why Students Love OxiCampus
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Join thousands of students who are already buying and selling on their campus.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {benefits.map((benefit) => (
              <div 
                key={benefit.title}
                className="text-center p-6 rounded-2xl bg-card border border-border"
              >
                <div className="w-14 h-14 rounded-2xl gradient-bg flex items-center justify-center mx-auto mb-4">
                  <benefit.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="font-display text-lg font-bold mb-2">{benefit.title}</h3>
                <p className="text-muted-foreground text-sm">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="font-display text-3xl font-bold mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-muted-foreground mb-8">
              Join the OxiCampus community today and start buying and selling with fellow students.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth?mode=signup">
                <Button variant="hero">
                  Create Account
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link to="/products">
                <Button variant="outline">
                  Browse Listings
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HowItWorks;
