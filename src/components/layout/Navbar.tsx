import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, User, Plus, LogOut, Heart, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import oxiLogo from "@/asset/logo.png";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const { user, profile, signOut } = useAuth();

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Browse", path: "/products" },
    { name: "How It Works", path: "/how-it-works" },
    { name: "Pricing", path: "/pricing" },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-white/10">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <img 
              src={oxiLogo} 
              alt="OxiCampus Logo" 
              className="h-10 w-auto transition-transform group-hover:scale-105"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`font-medium transition-colors duration-200 ${
                  isActive(link.path)
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <Link to="/create-listing">
                  <Button variant="hero" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Sell Item
                  </Button>
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full">
                      <div className="w-9 h-9 rounded-full gradient-bg flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-3 py-2">
                      <p className="font-medium truncate">{profile?.full_name || "User"}</p>
                      <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="flex items-center gap-2 cursor-pointer">
                        <User className="w-4 h-4" />
                        My Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/my-listings" className="flex items-center gap-2 cursor-pointer">
                        <Package className="w-4 h-4" />
                        My Listings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/favorites" className="flex items-center gap-2 cursor-pointer">
                        <Heart className="w-4 h-4" />
                        Favorites
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={handleSignOut}
                      className="flex items-center gap-2 cursor-pointer text-destructive"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Link to="/auth">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link to="/auth?mode=signup">
                  <Button variant="hero" size="sm">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-secondary transition-colors"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border animate-slide-up">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                    isActive(link.path)
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-secondary text-muted-foreground"
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              
              {user ? (
                <>
                  <Link
                    to="/create-listing"
                    onClick={() => setIsMenuOpen(false)}
                    className="px-4 py-3 rounded-lg font-medium hover:bg-secondary text-muted-foreground flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Sell Item
                  </Link>
                  <Link
                    to="/profile"
                    onClick={() => setIsMenuOpen(false)}
                    className="px-4 py-3 rounded-lg font-medium hover:bg-secondary text-muted-foreground flex items-center gap-2"
                  >
                    <User className="w-4 h-4" />
                    My Profile
                  </Link>
                  <Link
                    to="/my-listings"
                    onClick={() => setIsMenuOpen(false)}
                    className="px-4 py-3 rounded-lg font-medium hover:bg-secondary text-muted-foreground flex items-center gap-2"
                  >
                    <Package className="w-4 h-4" />
                    My Listings
                  </Link>
                  <Link
                    to="/favorites"
                    onClick={() => setIsMenuOpen(false)}
                    className="px-4 py-3 rounded-lg font-medium hover:bg-secondary text-muted-foreground flex items-center gap-2"
                  >
                    <Heart className="w-4 h-4" />
                    Favorites
                  </Link>
                  <button
                    onClick={() => {
                      handleSignOut();
                      setIsMenuOpen(false);
                    }}
                    className="px-4 py-3 rounded-lg font-medium hover:bg-secondary text-destructive flex items-center gap-2 text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </>
              ) : (
                <div className="flex flex-col gap-2 mt-4 px-4">
                  <Link to="/auth" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="outline" className="w-full">
                      Sign In
                    </Button>
                  </Link>
                  <Link to="/auth?mode=signup" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="hero" className="w-full">
                      Get Started
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
