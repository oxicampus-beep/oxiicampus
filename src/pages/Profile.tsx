import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Edit2, 
  Camera,
  BadgeCheck,
  Package,
  Heart,
  Settings,
  Crown,
  Loader2,
  GraduationCap
} from "lucide-react";

const Profile = () => {
  const navigate = useNavigate();
  const { user, profile, refreshProfile, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [listingsCount, setListingsCount] = useState(0);
  
  // Editable fields
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [university, setUniversity] = useState("");

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setPhone(profile.phone || "");
      setUniversity(profile.university || "");
    }
  }, [profile]);

  useEffect(() => {
    const fetchListingsCount = async () => {
      if (!user) return;
      
      const { count } = await supabase
        .from("listings")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);
      
      setListingsCount(count || 0);
    };

    fetchListingsCount();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    
    setIsSaving(true);
    
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          phone,
          university,
        })
        .eq("user_id", user.id);

      if (error) throw error;

      await refreshProfile();
      
      toast({
        title: "Profile updated",
        description: "Your changes have been saved.",
      });
      
      setIsEditing(false);
    } catch (error: any) {
      toast({
        title: "Error updating profile",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 pb-12 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 pb-12">
          <div className="container mx-auto px-4 text-center">
            <h1 className="font-display text-3xl font-bold mb-4">Sign in to view your profile</h1>
            <Button variant="hero" onClick={() => navigate("/auth")}>
              Sign In
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const planLimits: Record<string, number> = {
    free: 1,
    pro: 10,
    premium: 50,
  };

  const userPlan = profile?.plan || "free";
  const listingsLimit = planLimits[userPlan] || 1;
  const memberSince = profile?.created_at 
    ? new Date(profile.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "Recently";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          {/* Profile Header */}
          <div className="bg-card rounded-2xl border border-border overflow-hidden mb-8">
            {/* Cover */}
            <div className="h-32 md:h-48 gradient-bg relative">
              <button className="absolute bottom-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors">
                <Camera className="w-5 h-5 text-primary-foreground" />
              </button>
            </div>
            
            {/* Profile Info */}
            <div className="px-6 pb-6">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between -mt-16 md:-mt-12">
                <div className="flex flex-col md:flex-row md:items-end gap-4">
                  {/* Avatar */}
                  <div className="relative">
                    <div className="w-32 h-32 rounded-2xl border-4 border-background bg-primary/20 flex items-center justify-center shadow-lg">
                      <User className="w-16 h-16 text-primary" />
                    </div>
                    <button className="absolute bottom-2 right-2 p-1.5 rounded-full bg-primary text-primary-foreground shadow-lg">
                      <Camera className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {/* Name & Details */}
                  <div className="pb-2">
                    <div className="flex items-center gap-2 mb-1">
                      <h1 className="font-display text-2xl md:text-3xl font-bold">
                        {profile?.full_name || "User"}
                      </h1>
                      {profile?.is_verified && (
                        <BadgeCheck className="w-6 h-6 text-primary" />
                      )}
                    </div>
                    <p className="text-muted-foreground">{profile?.university || "No university set"}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <Badge variant="outline" className="border-primary text-primary capitalize">
                        <Crown className="w-3 h-3 mr-1" />
                        {userPlan} Plan
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        Member since {memberSince}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex gap-3 mt-4 md:mt-0">
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(!isEditing)}>
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-card rounded-xl border border-border p-4">
              <Package className="w-8 h-8 text-primary mb-2" />
              <div className="font-display text-2xl font-bold">{listingsCount}</div>
              <div className="text-sm text-muted-foreground">Active Listings</div>
            </div>
            <div className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center justify-between mb-2">
                <Crown className="w-8 h-8 text-accent" />
                <span className="text-xs text-muted-foreground">
                  {listingsCount}/{listingsLimit}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2 mb-2">
                <div 
                  className="gradient-bg h-2 rounded-full"
                  style={{ width: `${Math.min((listingsCount / listingsLimit) * 100, 100)}%` }}
                />
              </div>
              <div className="text-sm text-muted-foreground">Listings Used</div>
            </div>
            <Link to="/my-listings" className="block">
              <div className="bg-card rounded-xl border border-border p-4 hover:shadow-purple transition-shadow h-full">
                <Package className="w-8 h-8 text-purple-glow mb-2" />
                <div className="font-display text-2xl font-bold">View</div>
                <div className="text-sm text-muted-foreground">My Listings</div>
              </div>
            </Link>
            <Link to="/favorites" className="block">
              <div className="bg-card rounded-xl border border-border p-4 hover:shadow-purple transition-shadow h-full">
                <Heart className="w-8 h-8 text-destructive mb-2" />
                <div className="font-display text-2xl font-bold">View</div>
                <div className="text-sm text-muted-foreground">Favorites</div>
              </div>
            </Link>
          </div>

          {/* Profile Details */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <h2 className="font-display text-xl font-bold mb-6">Profile Information</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <label className="text-sm text-muted-foreground">Full Name</label>
                    {isEditing ? (
                      <Input 
                        value={fullName} 
                        onChange={(e) => setFullName(e.target.value)}
                        className="mt-1" 
                      />
                    ) : (
                      <p className="font-medium">{profile?.full_name || "Not set"}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <label className="text-sm text-muted-foreground">Email Address</label>
                    <p className="font-medium">{user.email}</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Phone className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <label className="text-sm text-muted-foreground">Phone Number</label>
                    {isEditing ? (
                      <Input 
                        value={phone} 
                        onChange={(e) => setPhone(e.target.value)}
                        className="mt-1" 
                      />
                    ) : (
                      <p className="font-medium">{profile?.phone || "Not set"}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <GraduationCap className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <label className="text-sm text-muted-foreground">University</label>
                    {isEditing ? (
                      <Input 
                        value={university} 
                        onChange={(e) => setUniversity(e.target.value)}
                        className="mt-1" 
                      />
                    ) : (
                      <p className="font-medium">{profile?.university || "Not set"}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {isEditing && (
              <div className="flex gap-3 mt-6 pt-6 border-t border-border">
                <Button variant="hero" onClick={handleSave} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Profile;
