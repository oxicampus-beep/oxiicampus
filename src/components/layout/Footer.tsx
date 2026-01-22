import { Link } from "react-router-dom";
import { ShoppingBag, Instagram, Twitter, Facebook, Mail } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-foreground text-background py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 gradient-bg rounded-xl flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-display font-bold text-xl text-background">
                OxiCampus
              </span>
            </Link>
            <p className="text-background/70 text-sm">
              The #1 marketplace for university students in Ghana. Buy, sell, and connect with fellow students.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-background/60 hover:text-background transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="text-background/60 hover:text-background transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-background/60 hover:text-background transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/products" className="text-background/70 hover:text-background transition-colors text-sm">
                  Browse Listings
                </Link>
              </li>
              <li>
                <Link to="/create-listing" className="text-background/70 hover:text-background transition-colors text-sm">
                  Sell an Item
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="text-background/70 hover:text-background transition-colors text-sm">
                  Pricing Plans
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="text-background/70 hover:text-background transition-colors text-sm">
                  How It Works
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-display font-semibold mb-4">Company</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/about" className="text-background/70 hover:text-background transition-colors text-sm">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-background/70 hover:text-background transition-colors text-sm">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-background/70 hover:text-background transition-colors text-sm">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-background/70 hover:text-background transition-colors text-sm">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display font-semibold mb-4">Contact Us</h4>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-background/70 text-sm">
                <Mail className="w-4 h-4" />
                oxicampus@gmail.com
              </li>
              <li className="text-background/70 text-sm">
                📞 +233 550 617 425
              </li>
            </ul>
            <div className="mt-6">
              <p className="text-background/50 text-xs">
                © 2026 OxiCampus. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
