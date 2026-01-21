/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ShoppingBag,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  GraduationCap,
  Phone,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import oxiLogo from "@/asset/logo.png";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { signUp, signIn, user } = useAuth();
  const { toast } = useToast();
  
  const [isSignUp, setIsSignUp] = useState(searchParams.get("mode") === "signup");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [university, setUniversity] = useState("");

  // Animation states
  const [focusedField, setFocusedField] = useState<string | null>(null);

  useEffect(() => {
    setIsSignUp(searchParams.get("mode") === "signup");
  }, [searchParams]);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignUp) {
        const { error } = await signUp(email, password, {
          full_name: name,
          phone,
          university,
        });
        
        if (error) {
          if (error.message.includes("already registered")) {
            toast({
              title: "Account exists",
              description: "This email is already registered. Try signing in instead.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Sign up failed",
              description: error.message,
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "Account created!",
            description: "Please check your email to verify your account, or sign in if email confirmation is disabled.",
          });
        }
      } else {
        const { error } = await signIn(email, password);
        
        if (error) {
          toast({
            title: "Sign in failed",
            description: error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Welcome back!",
            description: "You've successfully signed in.",
          });
          navigate("/");
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const universities = [
    "University of Ghana",
    "KNUST",
    "Ashesi University",
    "University of Cape Coast",
    "University of Professional Studies",
    "Regional Maritime University",
    "Ghana Institute of Management and Public Administration",
    "Other",
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          {/* Logo */}
          <Link to="/" className="inline-flex items-center gap-2 mb-8 group">
            <img 
              src={oxiLogo} 
              alt="OxiCampus Logo" 
              className="h-10 w-auto transition-transform group-hover:scale-105"
            />
          </Link>

          {/* Header */}
          <div className="mb-8">
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
              {isSignUp ? "Create your account" : "Welcome back"}
            </h1>
            <p className="text-muted-foreground">
              {isSignUp
                ? "Start selling to fellow students today"
                : "Sign in to manage your listings"}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {isSignUp && (
              <>
                {/* Name Field */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">
                    Full Name
                  </Label>
                  <div
                    className={`relative transition-all duration-300 ${
                      focusedField === "name" ? "scale-[1.02]" : ""
                    }`}
                  >
                    <User
                      className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${
                        focusedField === "name"
                          ? "text-primary"
                          : "text-muted-foreground"
                      }`}
                    />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Enter your full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onFocus={() => setFocusedField("name")}
                      onBlur={() => setFocusedField(null)}
                      className="pl-12 h-12 rounded-xl border-2 transition-all focus:border-primary focus:shadow-purple"
                      required
                    />
                  </div>
                </div>

                {/* Phone Field */}
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium">
                    Phone Number
                  </Label>
                  <div
                    className={`relative transition-all duration-300 ${
                      focusedField === "phone" ? "scale-[1.02]" : ""
                    }`}
                  >
                    <Phone
                      className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${
                        focusedField === "phone"
                          ? "text-primary"
                          : "text-muted-foreground"
                      }`}
                    />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="0XX XXX XXXX"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      onFocus={() => setFocusedField("phone")}
                      onBlur={() => setFocusedField(null)}
                      className="pl-12 h-12 rounded-xl border-2 transition-all focus:border-primary focus:shadow-purple"
                      required
                    />
                  </div>
                </div>

                {/* University Field */}
                <div className="space-y-2">
                  <Label htmlFor="university" className="text-sm font-medium">
                    University
                  </Label>
                  <div
                    className={`relative transition-all duration-300 ${
                      focusedField === "university" ? "scale-[1.02]" : ""
                    }`}
                  >
                    <GraduationCap
                      className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors z-10 ${
                        focusedField === "university"
                          ? "text-primary"
                          : "text-muted-foreground"
                      }`}
                    />
                    <select
                      id="university"
                      value={university}
                      onChange={(e) => setUniversity(e.target.value)}
                      onFocus={() => setFocusedField("university")}
                      onBlur={() => setFocusedField(null)}
                      className="w-full pl-12 h-12 rounded-xl border-2 bg-background transition-all focus:border-primary focus:shadow-purple focus:outline-none appearance-none cursor-pointer"
                      required
                    >
                      <option value="">Select your university</option>
                      {universities.map((uni) => (
                        <option key={uni} value={uni}>
                          {uni}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            )}

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email Address
              </Label>
              <div
                className={`relative transition-all duration-300 ${
                  focusedField === "email" ? "scale-[1.02]" : ""
                }`}
              >
                <Mail
                  className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${
                    focusedField === "email"
                      ? "text-primary"
                      : "text-muted-foreground"
                  }`}
                />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@university.edu.gh"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => setFocusedField(null)}
                  className="pl-12 h-12 rounded-xl border-2 transition-all focus:border-primary focus:shadow-purple"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <div
                className={`relative transition-all duration-300 ${
                  focusedField === "password" ? "scale-[1.02]" : ""
                }`}
              >
                <Lock
                  className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${
                    focusedField === "password"
                      ? "text-primary"
                      : "text-muted-foreground"
                  }`}
                />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField(null)}
                  className="pl-12 pr-12 h-12 rounded-xl border-2 transition-all focus:border-primary focus:shadow-purple"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {!isSignUp && (
              <div className="flex justify-end">
                <button
                  type="button"
                  className="text-sm text-primary hover:underline"
                >
                  Forgot password?
                </button>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              variant="hero"
              size="xl"
              className="w-full group"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  {isSignUp ? "Creating account..." : "Signing in..."}
                </span>
              ) : (
                <>
                  {isSignUp ? "Create Account" : "Sign In"}
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </Button>
          </form>

          {/* Toggle Auth Mode */}
          <p className="mt-8 text-center text-muted-foreground">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-primary font-semibold hover:underline"
            >
              {isSignUp ? "Sign In" : "Sign Up"}
            </button>
          </p>
        </div>
      </div>

      {/* Right Side - Decorative */}
      <div className="hidden lg:flex flex-1 gradient-hero-bg relative overflow-hidden">
        {/* Floating Elements */}
        <div className="absolute top-20 left-20 animate-float">
          <div className="glass-card p-6 rounded-2xl shadow-purple bg-white/10 backdrop-blur-xl border border-white/20">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
        </div>
        <div
          className="absolute bottom-32 right-20 animate-float"
          style={{ animationDelay: "2s" }}
        >
          <div className="glass-card p-6 rounded-2xl shadow-gold bg-white/10 backdrop-blur-xl border border-white/20">
            <ShoppingBag className="w-10 h-10 text-white" />
          </div>
        </div>
        <div
          className="absolute top-1/2 left-1/3 animate-float"
          style={{ animationDelay: "1s" }}
        >
          <div className="glass-card p-6 rounded-2xl shadow-purple bg-white/10 backdrop-blur-xl border border-white/20">
            <GraduationCap className="w-10 h-10 text-white" />
          </div>
        </div>

        {/* Background Blurs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/20 rounded-full blur-3xl" />

        {/* Content */}
        <div className="flex items-center justify-center w-full px-12">
          <div className="text-center text-white">
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">
              Join Ghana's Largest
              <span className="block text-white/90">Student Marketplace</span>
            </h2>
            <p className="text-xl text-white/80 max-w-md mx-auto">
              Connect with 20,000+ students across 10+ universities. Buy, sell, and thrive together.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 mt-12">
              <div className="glass-card p-4 rounded-2xl bg-white/10 backdrop-blur border border-white/20">
                <div className="font-display text-3xl font-bold text-white">
                  5K+
                </div>
                <div className="text-sm text-white/70">Listings</div>
              </div>
              <div className="glass-card p-4 rounded-2xl bg-white/10 backdrop-blur border border-white/20">
                <div className="font-display text-3xl font-bold text-white">
                  10+
                </div>
                <div className="text-sm text-white/70">Universities</div>
              </div>
              <div className="glass-card p-4 rounded-2xl bg-white/10 backdrop-blur border border-white/20">
                <div className="font-display text-3xl font-bold text-white">
                  20K+
                </div>
                <div className="text-sm text-white/70">Students</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
