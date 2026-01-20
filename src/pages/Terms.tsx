import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const Terms = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h1 className="font-display text-4xl font-bold mb-4">Terms of Service</h1>
            <p className="text-muted-foreground mb-8">Last updated: January 2024</p>

            <div className="prose prose-gray dark:prose-invert max-w-none">
              <section className="mb-8">
                <h2 className="font-display text-2xl font-bold mb-4">1. Acceptance of Terms</h2>
                <p className="text-muted-foreground mb-4">
                  By accessing or using OxiCampus, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our platform.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="font-display text-2xl font-bold mb-4">2. Eligibility</h2>
                <p className="text-muted-foreground mb-4">
                  You must be at least 18 years old or have parental consent to use OxiCampus. By using our platform, you represent that you meet this requirement.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="font-display text-2xl font-bold mb-4">3. User Accounts</h2>
                <p className="text-muted-foreground mb-4">
                  You are responsible for:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                  <li>Maintaining the confidentiality of your account</li>
                  <li>All activities that occur under your account</li>
                  <li>Providing accurate and complete information</li>
                  <li>Updating your information as necessary</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="font-display text-2xl font-bold mb-4">4. Listing Guidelines</h2>
                <p className="text-muted-foreground mb-4">
                  When creating listings, you agree to:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                  <li>Provide accurate descriptions of items</li>
                  <li>Only list items you have the right to sell</li>
                  <li>Not list prohibited items (illegal goods, weapons, counterfeit items, etc.)</li>
                  <li>Respond promptly to buyer inquiries</li>
                  <li>Complete transactions in good faith</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="font-display text-2xl font-bold mb-4">5. Prohibited Conduct</h2>
                <p className="text-muted-foreground mb-4">
                  You may not:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                  <li>Use the platform for any illegal purpose</li>
                  <li>Harass, abuse, or harm other users</li>
                  <li>Post false, misleading, or deceptive content</li>
                  <li>Attempt to gain unauthorized access to systems</li>
                  <li>Interfere with the proper working of the platform</li>
                  <li>Scrape or collect user data without permission</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="font-display text-2xl font-bold mb-4">6. Fees and Payments</h2>
                <p className="text-muted-foreground mb-4">
                  OxiCampus offers free and paid subscription plans. Paid plans are billed according to the pricing displayed at the time of purchase. All fees are non-refundable unless otherwise stated.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="font-display text-2xl font-bold mb-4">7. Limitation of Liability</h2>
                <p className="text-muted-foreground mb-4">
                  OxiCampus is a platform that connects buyers and sellers. We are not responsible for the quality, safety, or legality of items listed, the truth or accuracy of listings, or the ability of sellers to sell items or buyers to pay for items.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="font-display text-2xl font-bold mb-4">8. Termination</h2>
                <p className="text-muted-foreground mb-4">
                  We reserve the right to suspend or terminate your account at any time for violation of these terms or for any other reason at our sole discretion.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="font-display text-2xl font-bold mb-4">9. Changes to Terms</h2>
                <p className="text-muted-foreground mb-4">
                  We may modify these terms at any time. Continued use of the platform after changes constitutes acceptance of the modified terms.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="font-display text-2xl font-bold mb-4">10. Contact</h2>
                <p className="text-muted-foreground mb-4">
                  For questions about these Terms of Service, please contact us at:
                </p>
                <p className="text-muted-foreground">
                  Email: legal@oxicampus.com<br />
                  Address: Accra, Ghana
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Terms;
