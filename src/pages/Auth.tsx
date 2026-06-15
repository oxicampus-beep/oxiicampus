import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function Auth() {
  const navigate = useNavigate();
  const { user } = useAuth();
  useEffect(() => { if (user) navigate("/dashboard", { replace: true }); }, [user, navigate]);

  const [loading, setLoading] = useState(false);
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
    <div className="min-h-screen grid place-items-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <div className="h-12 w-12 rounded-xl bg-primary grid place-items-center font-black text-primary-foreground text-2xl glow-yellow">B</div>
            <span className="font-display font-bold text-3xl">ByteBoss</span>
          </Link>
          <p className="text-muted-foreground">The smartest way to resell data in Ghana.</p>
        </div>

        <Card className="p-6 border-border/60">
          <Tabs defaultValue="signin">
            <TabsList className="grid grid-cols-2 w-full mb-6">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div><Label>Email</Label><Input type="email" required value={signin.email} onChange={e => setSignin({ ...signin, email: e.target.value })} /></div>
                <div><Label>Password</Label><Input type="password" required value={signin.password} onChange={e => setSignin({ ...signin, password: e.target.value })} /></div>
                <Button type="submit" disabled={loading} className="w-full font-semibold">{loading ? "..." : "Sign In"}</Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div><Label>Full Name</Label><Input required value={signup.full_name} onChange={e => setSignup({ ...signup, full_name: e.target.value })} /></div>
                <div><Label>Phone</Label><Input required value={signup.phone} onChange={e => setSignup({ ...signup, phone: e.target.value })} placeholder="0241234567" /></div>
                <div><Label>Email</Label><Input type="email" required value={signup.email} onChange={e => setSignup({ ...signup, email: e.target.value })} /></div>
                <div><Label>Password</Label><Input type="password" required minLength={6} value={signup.password} onChange={e => setSignup({ ...signup, password: e.target.value })} /></div>
                <Button type="submit" disabled={loading} className="w-full font-semibold">{loading ? "..." : "Create Account"}</Button>
              </form>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
