import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PricingSection from "@/components/home/PricingSection";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  {
    question: "How do I upgrade my plan?",
    answer: "You can upgrade your plan anytime from your dashboard. Simply go to Settings > Subscription and choose your new plan. The upgrade takes effect immediately.",
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept Mobile Money (MTN, Vodafone, AirtelTigo), bank transfers, and major credit/debit cards. All payments are processed securely.",
  },
  {
    question: "Can I cancel my subscription anytime?",
    answer: "Yes! You can cancel your subscription at any time. Your plan benefits will continue until the end of your billing period.",
  },
  {
    question: "What happens if I exceed my listing limit?",
    answer: "You'll be prompted to upgrade to a higher plan to continue posting new listings. Free gets 1, Pro gets 3, and Premium gets 6 listings per month.",
  },
  {
    question: "What does 'Featured Listings' mean?",
    answer: "Featured listings appear at the top of search results and category pages, getting more visibility and faster sales. This is exclusive to Premium plan members.",
  },
  {
    question: "How do I get a verified vendor badge?",
    answer: "The verified vendor badge is included with the Premium plan. We verify your identity and student status to build trust with buyers.",
  },
];

const Pricing = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24">
        {/* Hero */}
        <section className="py-16 text-center">
          <div className="container mx-auto px-4">
            <h1 className="font-display text-4xl md:text-6xl font-bold mb-4">
              Choose Your <span className="gradient-text">Plan</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Start selling for free or upgrade for more listings and premium features.
            </p>
          </div>
        </section>

        <PricingSection />

        {/* FAQ Section */}
        <section className="py-24 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <h2 className="font-display text-3xl md:text-4xl font-bold text-center mb-12">
                Frequently Asked <span className="gradient-text">Questions</span>
              </h2>

              <Accordion type="single" collapsible className="space-y-4">
                {faqs.map((faq, index) => (
                  <AccordionItem
                    key={index}
                    value={`item-${index}`}
                    className="bg-card rounded-2xl border border-border px-6 data-[state=open]:shadow-purple data-[state=open]:border-primary/30"
                  >
                    <AccordionTrigger className="text-left font-semibold hover:no-underline py-5">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground pb-5">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Pricing;
