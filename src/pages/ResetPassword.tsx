import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Eye, EyeOff, ArrowRight, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import oxiLogo from "@/asset/logo.png";

const ResetPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  useEffect(() => {
    // Check if we have a valid session from the password reset link
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Invalid or expired link",
          description: "Please request a new password reset link.",
          variant: "destructive",
        });
        navigate("/auth");
      }
    };
    checkSession();
  }, [navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure both passwords are the same.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        toast({
          title: "Error resetting password",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setIsSuccess(true);
        toast({
          title: "Password updated!",
          description: "Your password has been successfully reset.",
        });
        
        // Redirect to home after a short delay
        setTimeout(() => {
          navigate("/");
        }, 2000);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Something went wrong";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md text-center">
          <div className="mb-8 flex justify-center">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
          </div>
          <h1 className="font-display text-3xl font-bold mb-4">Password Reset!</h1>
          <p className="text-muted-foreground mb-8">
            Your password has been successfully updated. Redirecting you to the homepage...
          </p>
          <Button variant="hero" size="xl" onClick={() => navigate("/")}>
            Go to Homepage
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-background">
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
            Set new password
          </h1>
          <p className="text-muted-foreground">
            Enter your new password below
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* New Password Field */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium">
              New Password
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
                placeholder="Enter your new password"
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

          {/* Confirm Password Field */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-sm font-medium">
              Confirm Password
            </Label>
            <div
              className={`relative transition-all duration-300 ${
                focusedField === "confirmPassword" ? "scale-[1.02]" : ""
              }`}
            >
              <Lock
                className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${
                  focusedField === "confirmPassword"
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              />
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm your new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onFocus={() => setFocusedField("confirmPassword")}
                onBlur={() => setFocusedField(null)}
                className="pl-12 pr-12 h-12 rounded-xl border-2 transition-all focus:border-primary focus:shadow-purple"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

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
                Updating password...
              </span>
            ) : (
              <>
                Reset Password
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </Button>
        </form>

        {/* Back to sign in */}
        <p className="mt-8 text-center text-muted-foreground">
          Remember your password?{" "}
          <Link to="/auth" className="text-primary font-semibold hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;
