import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { AuthBackground } from "@/components/auth/AuthBackground";
import { Mail, Lock, User, Phone, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

function FieldGroup({
  label,
  icon: Icon,
  children,
  delay,
}: {
  label: string;
  icon: React.ElementType;
  children: React.ReactNode;
  delay?: string;
}) {
  return (
    <div className={cn("space-y-1.5 animate-fade-in-up", delay)}>
      <Label className="text-sm font-medium text-foreground/80">{label}</Label>
      <div className="relative group">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none z-10" />
        <div className="[&_input]:pl-9 [&_input]:bg-secondary/50 [&_input]:border-border/60 [&_input]:transition-all [&_input]:duration-200 [&_input]:focus:bg-background [&_input]:focus:border-primary/40 [&_input]:focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.1)]">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function Auth() {
  const navigate = useNavigate();
  const { user } = useAuth();
  useEffect(() => { if (user) navigate("/dashboard", { replace: true }); }, [user, navigate]);

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("signin");
  const [signin, setSignin] = useState({ email: "", password: "" });
  const [signup, setSignup] = useState({ email: "", password: "", full_name: "", phone: "" });

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    const { error } = await supabase.auth.signInWithPassword(signin);
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome back!"); navigate("/dashboard");
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: signup.email,
      password: signup.password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { full_name: signup.full_name, phone: signup.phone },
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Account created! Signing you in…");
    await supabase.auth.signInWithPassword({ email: signup.email, password: signup.password });
    navigate("/dashboard");
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 sm:p-6 overflow-hidden bg-gradient-to-br from-background via-background to-primary/[0.07]">
      <AuthBackground />

      <div className="relative w-full max-w-md z-10">
        {/* Brand header */}
        <div className="text-center mb-8 animate-fade-in-up">
          <Link to="/" className="inline-flex items-center gap-3 mb-5 group">
            <div className="relative">
              <div className="absolute inset-0 rounded-2xl bg-primary/30 blur-xl scale-110 group-hover:scale-125 transition-transform duration-500" />
              <div className="relative h-14 w-14 rounded-2xl bg-primary grid place-items-center font-black text-primary-foreground text-2xl glow-yellow group-hover:scale-105 transition-transform duration-300">
                B
              </div>
            </div>
            <span className="font-display font-bold text-4xl text-gradient-yellow">ByteBoss</span>
          </Link>
          <p className="text-muted-foreground text-sm sm:text-base flex items-center justify-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-primary/70" />
            The smartest way to resell data in Ghana
            <Sparkles className="h-3.5 w-3.5 text-primary/70" />
          </p>
        </div>

        {/* Auth card */}
        <div className="auth-card-glass rounded-2xl p-6 sm:p-8 animate-fade-in-up animation-delay-200">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-2 w-full mb-7 h-11 bg-secondary/60 p-1 rounded-xl">
              <TabsTrigger
                value="signin"
                className="rounded-lg font-semibold text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all duration-300"
              >
                Sign In
              </TabsTrigger>
              <TabsTrigger
                value="signup"
                className="rounded-lg font-semibold text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all duration-300"
              >
                Sign Up
              </TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="mt-0 focus-visible:outline-none">
              <form onSubmit={handleSignIn} className="space-y-4">
                <FieldGroup label="Email" icon={Mail} delay="animation-delay-300">
                  <Input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={signin.email}
                    onChange={e => setSignin({ ...signin, email: e.target.value })}
                  />
                </FieldGroup>
                <FieldGroup label="Password" icon={Lock} delay="animation-delay-500">
                  <PasswordInput
                    required
                    placeholder="Enter your password"
                    value={signin.password}
                    onChange={e => setSignin({ ...signin, password: e.target.value })}
                  />
                </FieldGroup>
                <div className="pt-2 animate-fade-in-up animation-delay-700">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-11 font-semibold text-base relative overflow-hidden group/btn transition-all duration-300 hover:shadow-[0_0_24px_hsl(var(--primary)/0.35)]"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Signing in…
                      </span>
                    ) : (
                      "Sign In"
                    )}
                  </Button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="mt-0 focus-visible:outline-none">
              <form onSubmit={handleSignUp} className="space-y-4">
                <FieldGroup label="Full Name" icon={User} delay="animation-delay-300">
                  <Input
                    required
                    placeholder="John Doe"
                    value={signup.full_name}
                    onChange={e => setSignup({ ...signup, full_name: e.target.value })}
                  />
                </FieldGroup>
                <FieldGroup label="Phone" icon={Phone} delay="animation-delay-400">
                  <Input
                    required
                    placeholder="0241234567"
                    value={signup.phone}
                    onChange={e => setSignup({ ...signup, phone: e.target.value })}
                  />
                </FieldGroup>
                <FieldGroup label="Email" icon={Mail} delay="animation-delay-500">
                  <Input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={signup.email}
                    onChange={e => setSignup({ ...signup, email: e.target.value })}
                  />
                </FieldGroup>
                <FieldGroup label="Password" icon={Lock} delay="animation-delay-600">
                  <PasswordInput
                    required
                    minLength={6}
                    placeholder="Min. 6 characters"
                    value={signup.password}
                    onChange={e => setSignup({ ...signup, password: e.target.value })}
                  />
                </FieldGroup>
                <div className="pt-2 animate-fade-in-up animation-delay-700">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-11 font-semibold text-base transition-all duration-300 hover:shadow-[0_0_24px_hsl(var(--primary)/0.35)]"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Creating account…
                      </span>
                    ) : (
                      "Create Account"
                    )}
                  </Button>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </div>

        <p className="text-center text-xs text-muted-foreground/60 mt-6 animate-fade-in animation-delay-1000">
          Secure authentication powered by Supabase
        </p>
      </div>
    </div>
  );
}
