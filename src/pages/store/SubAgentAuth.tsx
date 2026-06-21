import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useStoreSubAgent } from "@/hooks/useStoreSubAgent";
import StoreErrorBoundary from "@/components/store/StoreErrorBoundary";
import { StoreThemeProvider, useStoreTheme } from "@/components/store/StoreThemeProvider";
import StoreHeader from "@/components/store/StoreHeader";
import SubAgentBenefits from "@/components/store/SubAgentBenefits";
import SubAgentApplyPanel from "@/components/store/SubAgentApplyPanel";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Mail, Lock, User, Phone, Store, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { BiometricSignInButton } from "@/components/auth/BiometricSignInButton";
import { markPasskeyOfferPending } from "@/lib/passkey";

function SubAgentAuthContent() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { isDark } = useStoreTheme();
  const {
    store,
    status,
    fee,
    savings,
    loading,
    notFound,
    applying,
    isStoreOwner,
    canApply,
    apply,
    refresh,
  } = useStoreSubAgent(slug);

  const [authLoadingAction, setAuthLoadingAction] = useState(false);
  const [activeTab, setActiveTab] = useState(searchParams.get("mode") === "signup" ? "signup" : "signin");
  const [signin, setSignin] = useState({ email: "", password: "" });
  const [signup, setSignup] = useState({ email: "", password: "", full_name: "", phone: "" });
  const [autoApplied, setAutoApplied] = useState(false);

  useEffect(() => {
    if (authLoading || loading || !user || !canApply || autoApplied) return;
    (async () => {
      const { error } = await apply();
      setAutoApplied(true);
      if (error) toast.error(error.message);
      else toast.success("Application submitted! You'll get access once approved.");
      refresh();
    })();
  }, [authLoading, loading, user, canApply, autoApplied, apply, refresh]);

  const afterAuth = async (email: string, password: string) => {
    await supabase.auth.signInWithPassword({ email, password });
    toast.success("Welcome! Submitting your sub-agent application…");
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoadingAction(true);
    const { error } = await supabase.auth.signInWithPassword(signin);
    setAuthLoadingAction(false);
    if (error) return toast.error(error.message);
    toast.success("Signed in!");
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoadingAction(true);
    const redirectTo = `${window.location.origin}/store/${slug}/sub-agent`;
    const { error } = await supabase.auth.signUp({
      email: signup.email,
      password: signup.password,
      options: {
        emailRedirectTo: redirectTo,
        data: { full_name: signup.full_name, phone: signup.phone },
      },
    });
    if (error) {
      setAuthLoadingAction(false);
      return toast.error(error.message);
    }
    await afterAuth(signup.email, signup.password);
    markPasskeyOfferPending();
    setAuthLoadingAction(false);
  };

  const handleApply = async () => {
    const { error } = await apply();
    if (error) toast.error(error.message);
    else toast.success("Application submitted!");
  };

  const skeletonBg = isDark ? "bg-zinc-800" : "bg-zinc-200";

  if (loading || authLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <Skeleton className={cn("h-10 w-48", skeletonBg)} />
        <Skeleton className={cn("h-32 rounded-2xl", skeletonBg)} />
        <Skeleton className={cn("h-96 rounded-2xl", skeletonBg)} />
      </div>
    );
  }

  if (notFound || !store) {
    return (
      <div className="min-h-[60vh] grid place-items-center p-6">
        <div className={cn("rounded-2xl p-10 text-center max-w-md border", isDark ? "bg-zinc-900 border-white/10" : "bg-white border-zinc-200")}>
          <Store className={cn("h-12 w-12 mx-auto mb-4", isDark ? "text-zinc-500" : "text-zinc-400")} />
          <h1 className={cn("text-2xl font-display font-bold", isDark ? "text-white" : "text-zinc-900")}>Store not found</h1>
          <Button asChild className="mt-6" variant="outline">
            <Link to="/auth">Go to login</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <StoreHeader storeName={store.name} />

      <div className="max-w-3xl mx-auto px-4 py-8 md:py-12 space-y-10">
        <Link
          to={`/store/${store.slug}`}
          className={cn("inline-flex items-center gap-1.5 text-sm font-semibold hover:text-primary transition-colors", isDark ? "text-zinc-400" : "text-zinc-500")}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {store.name} store
        </Link>

        <section className="text-center">
          <div
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold mb-4",
              isDark ? "border-primary/30 bg-primary/10 text-primary" : "border-primary/20 bg-primary/5 text-primary",
            )}
          >
            <UserPlus className="h-3.5 w-3.5" />
            Sub-agent program
          </div>
          <h1 className={cn("text-3xl sm:text-4xl font-display font-bold tracking-tight", isDark ? "text-white" : "text-zinc-900")}>
            Join {store.name} as a sub-agent
          </h1>
          <p className={cn("mt-4 text-base sm:text-lg max-w-xl mx-auto leading-relaxed", isDark ? "text-zinc-400" : "text-zinc-500")}>
            Get <span className="font-semibold text-primary">cheaper wholesale prices</span> on every bundle and launch{" "}
            <span className="font-semibold text-primary">your own reseller store</span> — powered by ByteBoss.
          </p>
        </section>

        <SubAgentBenefits storeName={store.name} savings={savings} />

        <section>
          <h2 className={cn("font-display font-bold text-xl mb-4 text-center", isDark ? "text-white" : "text-zinc-900")}>
            {user ? "Your application" : "Create an account or sign in"}
          </h2>

          {user ? (
            <SubAgentApplyPanel
              storeSlug={store.slug}
              storeName={store.name}
              status={status}
              fee={fee}
              canApply={canApply}
              isStoreOwner={isStoreOwner}
              applying={applying}
              onApply={handleApply}
              showAuthLink={false}
            />
          ) : (
            <div className={cn("rounded-2xl border p-6 sm:p-8", isDark ? "border-white/10 bg-zinc-900/50" : "border-zinc-200 bg-white")}>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className={cn("grid grid-cols-2 w-full mb-6 h-11 p-1 rounded-xl", isDark ? "bg-zinc-800" : "bg-zinc-100")}>
                  <TabsTrigger value="signin" className="rounded-lg font-semibold">Sign In</TabsTrigger>
                  <TabsTrigger value="signup" className="rounded-lg font-semibold">Sign Up</TabsTrigger>
                </TabsList>

                <TabsContent value="signin" className="mt-0">
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label>Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input className="pl-9" type="email" required value={signin.email} onChange={e => setSignin({ ...signin, email: e.target.value })} placeholder="you@example.com" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Password</Label>
                      <PasswordInput required value={signin.password} onChange={e => setSignin({ ...signin, password: e.target.value })} placeholder="Your password" />
                    </div>
                    <Button type="submit" disabled={authLoadingAction} className="w-full h-11 font-semibold gap-2">
                      {authLoadingAction ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                      Sign in & apply
                    </Button>
                  </form>
                  <BiometricSignInButton
                    disabled={authLoadingAction}
                    label="Sign in with biometrics"
                  />
                </TabsContent>

                <TabsContent value="signup" className="mt-0">
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label>Full name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input className="pl-9" required value={signup.full_name} onChange={e => setSignup({ ...signup, full_name: e.target.value })} placeholder="John Doe" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Phone</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input className="pl-9" required value={signup.phone} onChange={e => setSignup({ ...signup, phone: e.target.value })} placeholder="0241234567" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input className="pl-9" type="email" required value={signup.email} onChange={e => setSignup({ ...signup, email: e.target.value })} placeholder="you@example.com" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Password</Label>
                      <PasswordInput required minLength={6} value={signup.password} onChange={e => setSignup({ ...signup, password: e.target.value })} placeholder="Min. 6 characters" />
                    </div>
                    {fee > 0 && (
                      <p className="text-xs text-muted-foreground rounded-lg bg-secondary/50 px-3 py-2">
                        After signup, ₵{fee.toFixed(2)} activation fee will be deducted from your wallet when you apply.
                      </p>
                    )}
                    <Button type="submit" disabled={authLoadingAction} className="w-full h-11 font-semibold gap-2">
                      {authLoadingAction ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                      Create account & apply
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </section>

        <p className={cn("text-center text-xs", isDark ? "text-zinc-500" : "text-zinc-400")}>
          By joining, you agree to resell under {store.name}&apos;s agent network on ByteBoss.
        </p>
      </div>
    </>
  );
}

export default function SubAgentAuth() {
  return (
    <StoreErrorBoundary>
      <StoreThemeProvider>
        <SubAgentAuthContent />
      </StoreThemeProvider>
    </StoreErrorBoundary>
  );
}
