import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h1 className="font-display text-4xl font-bold mb-4">Privacy Policy</h1>
            <p className="text-muted-foreground mb-8">Last updated: January 2024</p>

            <div className="prose prose-gray dark:prose-invert max-w-none">
              <section className="mb-8">
                <h2 className="font-display text-2xl font-bold mb-4">1. Introduction</h2>
                <p className="text-muted-foreground mb-4">
                  OxiCampus ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="font-display text-2xl font-bold mb-4">2. Information We Collect</h2>
                <p className="text-muted-foreground mb-4">
                  We collect information you provide directly to us, including:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                  <li>Account information (name, email, phone number, university)</li>
                  <li>Profile information (avatar, bio)</li>
                  <li>Listing information (titles, descriptions, images, prices)</li>
                  <li>Communications between users</li>
                  <li>Payment information (processed securely through third-party providers)</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="font-display text-2xl font-bold mb-4">3. How We Use Your Information</h2>
                <p className="text-muted-foreground mb-4">
                  We use the information we collect to:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                  <li>Provide, maintain, and improve our services</li>
                  <li>Process transactions and send related information</li>
                  <li>Send promotional communications (with your consent)</li>
                  <li>Respond to your comments, questions, and requests</li>
                  <li>Monitor and analyze trends, usage, and activities</li>
                  <li>Detect, investigate, and prevent fraudulent transactions</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="font-display text-2xl font-bold mb-4">4. Information Sharing</h2>
                <p className="text-muted-foreground mb-4">
                  We may share your information in the following circumstances:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                  <li>With other users as necessary for transactions</li>
                  <li>With service providers who assist in our operations</li>
                  <li>In response to legal process or government request</li>
                  <li>To protect our rights, privacy, safety, or property</li>
                  <li>In connection with a merger, acquisition, or sale of assets</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="font-display text-2xl font-bold mb-4">5. Data Security</h2>
                <p className="text-muted-foreground mb-4">
                  We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="font-display text-2xl font-bold mb-4">6. Your Rights</h2>
                <p className="text-muted-foreground mb-4">
                  You have the right to:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                  <li>Access your personal information</li>
                  <li>Correct inaccurate data</li>
                  <li>Request deletion of your data</li>
                  <li>Object to processing of your data</li>
                  <li>Data portability</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="font-display text-2xl font-bold mb-4">7. Contact Us</h2>
                <p className="text-muted-foreground mb-4">
                  If you have any questions about this Privacy Policy, please contact us at:
                </p>
                <p className="text-muted-foreground">
                  Email: privacy@oxicampus.com<br />
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

export default Privacy;
