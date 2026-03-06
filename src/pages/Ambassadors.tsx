import { Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Users,
  DollarSign,
  Share2,
  Clock,
  Megaphone,
  Gift,
  ArrowRight,
  CheckCircle,
  Smartphone,
} from "lucide-react";

const benefits = [
  {
    icon: DollarSign,
    title: "50% Commission",
    description: "Earn 50% of every purchase made using your referral code. GH₵15 for Pro, GH₵37.50 for Premium.",
  },
  {
    icon: Clock,
    title: "Fast Payouts",
    description: "Receive your commission via Mobile Money within 48 hours of confirmed purchases.",
  },
  {
    icon: Share2,
    title: "Easy Sharing",
    description: "Get a unique 6-character referral code. Share it with your classmates and campus community.",
  },
  {
    icon: Smartphone,
    title: "Track Earnings",
    description: "Access your ambassador dashboard to track referrals, commissions, and payout history in real time.",
  },
];

const steps = [
  {
    step: "01",
    title: "Apply",
    description: "Sign up and fill out the ambassador application form with your details.",
  },
  {
    step: "02",
    title: "Get Approved",
    description: "An admin reviews and approves your application. You'll receive your unique referral code.",
  },
  {
    step: "03",
    title: "Share & Earn",
    description: "Share your code with students. When they purchase Pro or Premium, you earn 50% commission.",
  },
  {
    step: "04",
    title: "Get Paid",
    description: "Commissions are paid out to your Mobile Money within 48 hours.",
  },
];

const Ambassadors = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24">
        {/* Hero Section */}
        <section className="py-20 relative overflow-hidden">
          <div className="absolute inset-0 gradient-hero-bg opacity-10" />
          <div className="container mx-auto px-4 relative z-10 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm mb-6">
              <Megaphone className="w-4 h-4" />
              Campus Ambassador Program
            </div>
            <h1 className="font-display text-4xl md:text-6xl font-bold mb-6">
              Earn While You <span className="gradient-text">Share</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              Become an OxiCampus Ambassador and earn <strong className="text-foreground">50% commission</strong> on every
              subscription purchased through your referral code. Payouts within 48 hours via Mobile Money.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth?mode=signup&type=ambassador">
                <Button variant="hero" size="xl">
                  Become an Ambassador
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link to="/auth">
                <Button variant="outline" size="xl">
                  Ambassador Login
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-20 bg-secondary/30">
          <div className="container mx-auto px-4">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-center mb-4">
              Why Become an <span className="gradient-text">Ambassador</span>?
            </h2>
            <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">
              Turn your campus influence into real income
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
              {benefits.map((b) => (
                <Card key={b.title} className="p-6 text-center hover:shadow-purple transition-shadow">
                  <div className="w-14 h-14 rounded-2xl gradient-bg flex items-center justify-center mx-auto mb-4">
                    <b.icon className="w-7 h-7 text-primary-foreground" />
                  </div>
                  <h3 className="font-display text-lg font-bold mb-2">{b.title}</h3>
                  <p className="text-sm text-muted-foreground">{b.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-center mb-12">
              How It <span className="gradient-text">Works</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
              {steps.map((s, i) => (
                <div key={s.step} className="relative text-center">
                  <div className="font-display text-5xl font-bold gradient-text mb-4">{s.step}</div>
                  <h3 className="font-display text-xl font-bold mb-2">{s.title}</h3>
                  <p className="text-sm text-muted-foreground">{s.description}</p>
                  {i < steps.length - 1 && (
                    <div className="hidden md:block absolute top-8 -right-4 text-muted-foreground/30">
                      <ArrowRight className="w-8 h-8" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Commission Breakdown */}
        <section className="py-20 bg-secondary/30">
          <div className="container mx-auto px-4">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-center mb-12">
              Commission <span className="gradient-text">Breakdown</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
              <Card className="p-8 border-2 border-primary/30">
                <h3 className="font-display text-2xl font-bold mb-2">Pro Plan Referral</h3>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="font-display text-4xl font-bold gradient-text">GH₵15</span>
                  <span className="text-muted-foreground">per referral</span>
                </div>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-primary" />
                    Plan costs GH₵30
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-primary" />
                    You earn 50% = GH₵15
                  </li>
                </ul>
              </Card>
              <Card className="p-8 border-2 border-accent/30">
                <h3 className="font-display text-2xl font-bold mb-2">Premium Plan Referral</h3>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="font-display text-4xl font-bold text-accent">GH₵37.50</span>
                  <span className="text-muted-foreground">per referral</span>
                </div>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-accent" />
                    Plan costs GH₵75
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-accent" />
                    You earn 50% = GH₵37.50
                  </li>
                </ul>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-2xl mx-auto">
              <Gift className="w-16 h-16 mx-auto mb-6 text-primary" />
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
                Ready to Start Earning?
              </h2>
              <p className="text-muted-foreground mb-8">
                Join the OxiCampus Ambassador Program today and start earning commissions from your campus network.
              </p>
              <Link to="/auth?mode=signup&type=ambassador">
                <Button variant="hero" size="xl">
                  Apply Now
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Ambassadors;
