import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ghanaUniversities } from "@/data/constants";
import { 
  User, 
  Mail, 
  Phone, 
  Edit2, 
  Camera,
  BadgeCheck,
  Package,
  Heart,
  Crown,
  Loader2,
  GraduationCap,
  MessageCircle,
  Calendar,
  AlertCircle,
  CheckCircle,
  Upload,
} from "lucide-react";
import { formatDistanceToNow, format, isPast, addDays } from "date-fns";

const Profile = () => {
  const navigate = useNavigate();
  const { user, profile, refreshProfile, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [listingsCount, setListingsCount] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Editable fields
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [university, setUniversity] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setPhone(profile.phone || "");
      setUniversity(profile.university || "");
      setAvatarUrl(profile.avatar_url);
    }
  }, [profile]);

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingAvatar(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("listings")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("listings")
        .getPublicUrl(fileName);

      // Update profile
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
      await refreshProfile();

      toast({
        title: "Avatar updated",
        description: "Your profile picture has been updated.",
      });
    } catch (error: any) {
      toast({
        title: "Error uploading avatar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  useEffect(() => {
    const fetchCounts = async () => {
      if (!user) return;
      
      const [listingsResult, messagesResult] = await Promise.all([
        supabase
          .from("listings")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id),
        supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .eq("receiver_id", user.id)
          .eq("is_read", false),
      ]);
      
      setListingsCount(listingsResult.count || 0);
      setUnreadMessages(messagesResult.count || 0);
    };

    fetchCounts();
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

  // Subscription status
  const subscriptionExpiresAt = profile?.subscription_expires_at 
    ? new Date(profile.subscription_expires_at) 
    : null;
  const isSubscriptionActive = subscriptionExpiresAt && !isPast(subscriptionExpiresAt);
  // Expiring soon = subscription is still active but expires within 7 days
  const isExpiringSoon = subscriptionExpiresAt && !isPast(subscriptionExpiresAt) && 
    subscriptionExpiresAt <= addDays(new Date(), 7);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          {/* Profile Header */}
          <div className="bg-card rounded-2xl border border-border overflow-hidden mb-8">
            
            {/* Profile Info */}
            <div className="px-6 py-6">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between">
                <div className="flex flex-col md:flex-row md:items-end gap-4">
                  {/* Avatar */}
                  <div className="relative">
                    <div className="w-32 h-32 rounded-2xl border-4 border-background bg-primary/20 flex items-center justify-center shadow-lg overflow-hidden">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-16 h-16 text-primary" />
                      )}
                    </div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleAvatarUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingAvatar}
                      className="absolute bottom-2 right-2 p-1.5 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                      {isUploadingAvatar ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Camera className="w-4 h-4" />
                      )}
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

          {/* Subscription Status Card */}
          {userPlan !== "free" && (
            <div className={`mb-8 p-6 rounded-2xl border ${
              isSubscriptionActive 
                ? isExpiringSoon 
                  ? "bg-accent/10 border-accent" 
                  : "bg-success/10 border-success"
                : "bg-destructive/10 border-destructive"
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {isSubscriptionActive ? (
                    <CheckCircle className={`w-6 h-6 ${isExpiringSoon ? "text-accent" : "text-success"}`} />
                  ) : (
                    <AlertCircle className="w-6 h-6 text-destructive" />
                  )}
                  <div>
                    <h3 className="font-semibold text-lg">
                      {isSubscriptionActive 
                        ? isExpiringSoon 
                          ? "Subscription Expiring Soon" 
                          : "Active Subscription"
                        : "Subscription Expired"}
                    </h3>
                    {subscriptionExpiresAt && (
                      <p className="text-sm text-muted-foreground">
                        {isSubscriptionActive 
                          ? `Expires ${format(subscriptionExpiresAt, "MMMM d, yyyy")} (${formatDistanceToNow(subscriptionExpiresAt, { addSuffix: true })})`
                          : `Expired on ${format(subscriptionExpiresAt, "MMMM d, yyyy")}`}
                      </p>
                    )}
                  </div>
                </div>
                {(!isSubscriptionActive || isExpiringSoon) && (
                  <Link to="/pricing">
                    <Button variant="hero" size="sm">
                      {isSubscriptionActive ? "Renew" : "Resubscribe"}
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
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
            <Link to="/messages" className="block">
              <div className="bg-card rounded-xl border border-border p-4 hover:shadow-purple transition-shadow h-full relative">
                <MessageCircle className="w-8 h-8 text-primary mb-2" />
                <div className="font-display text-2xl font-bold">
                  {unreadMessages > 0 ? unreadMessages : "View"}
                </div>
                <div className="text-sm text-muted-foreground">
                  {unreadMessages > 0 ? "Unread Messages" : "Messages"}
                </div>
                {unreadMessages > 0 && (
                  <span className="absolute top-2 right-2 w-3 h-3 rounded-full bg-destructive animate-pulse" />
                )}
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
                      <select
                        value={university}
                        onChange={(e) => setUniversity(e.target.value)}
                        className="w-full mt-1 h-10 px-3 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="">Select university</option>
                        {ghanaUniversities.map((uni) => (
                          <option key={uni} value={uni}>
                            {uni}
                          </option>
                        ))}
                      </select>
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

          {/* Upgrade CTA for free users */}
          {userPlan === "free" && (
            <div className="mt-8 p-6 bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl border border-primary/20">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="font-display text-xl font-bold mb-1">Upgrade Your Plan</h3>
                  <p className="text-muted-foreground">
                    Get more listings, verified badge, and priority support with Pro or Premium plans.
                  </p>
                </div>
                <Link to="/pricing">
                  <Button variant="hero">
                    <Crown className="w-4 h-4 mr-2" />
                    View Plans
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Profile;
