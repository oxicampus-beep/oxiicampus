import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ImageUpload from "@/components/listings/ImageUpload";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ghanaUniversities, categories, conditions, planLimits } from "@/data/constants";
import { 
  Tag, 
  FileText, 
  DollarSign,
  Package,
  GraduationCap,
  ArrowLeft,
  Loader2,
  Phone,
  MessageCircle,
} from "lucide-react";

const CreateListing = () => {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [condition, setCondition] = useState("");
  const [university, setUniversity] = useState(profile?.university || "");
  const [images, setImages] = useState<string[]>([]);
  const [phoneNumber, setPhoneNumber] = useState(profile?.phone || "");
  const [whatsappNumber, setWhatsappNumber] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to create a listing",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    // Check subscription expiry and listing limits based on plan
    const subscriptionExpiresAt = (profile as any)?.subscription_expires_at 
      ? new Date((profile as any).subscription_expires_at) 
      : null;
    const isSubscriptionExpired = subscriptionExpiresAt && new Date() > subscriptionExpiresAt;
    
    // If subscription expired, treat as free plan
    const effectivePlan = isSubscriptionExpired ? "free" : (profile?.plan || "free");
    const currentListings = profile?.listings_count || 0;
    const limit = planLimits[effectivePlan] || 1;

    if (isSubscriptionExpired && profile?.plan !== "free") {
      toast({
        title: "Subscription expired",
        description: `Your ${profile?.plan} subscription has expired. Please renew to continue with your plan benefits.`,
        variant: "destructive",
      });
      navigate("/pricing");
      return;
    }

    if (currentListings >= limit) {
      toast({
        title: "Listing limit reached",
        description: `You've reached your ${effectivePlan} plan limit of ${limit} listings. Upgrade to list more!`,
        variant: "destructive",
      });
      navigate("/pricing");
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.from("listings").insert({
        user_id: user.id,
        title,
        description,
        price: parseFloat(price),
        category,
        condition,
        university,
        images: images.length > 0 ? images : ["https://images.unsplash.com/photo-1560343090-f0409e92791a?w=800"],
        status: "available",
        phone_number: phoneNumber || null,
        whatsapp_number: whatsappNumber || phoneNumber || null,
      });

      if (error) throw error;

      // Update listings count
      await supabase
        .from("profiles")
        .update({ listings_count: currentListings + 1 })
        .eq("user_id", user.id);

      await refreshProfile();

      toast({
        title: "Listing created!",
        description: "Your listing is now live.",
      });

      navigate("/my-listings");
    } catch (error: any) {
      toast({
        title: "Error creating listing",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 pb-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="font-display text-3xl font-bold mb-4">Sign in to create a listing</h1>
            <p className="text-muted-foreground mb-6">You need to be signed in to create listings</p>
            <Button variant="hero" onClick={() => navigate("/auth")}>
              Sign In
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <div className="max-w-2xl mx-auto">
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
              Create New Listing
            </h1>
            <p className="text-muted-foreground mb-8">
              Fill in the details below to list your item
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title" className="flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  Title
                </Label>
                <Input
                  id="title"
                  placeholder="e.g., MacBook Pro 2021 - 14 inch"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="h-12"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Description
                </Label>
                <Textarea
                  id="description"
                  placeholder="Describe your item in detail..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
              </div>

              {/* Price */}
              <div className="space-y-2">
                <Label htmlFor="price" className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Price (GHC)
                </Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="0.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                  min="0"
                  step="0.01"
                  className="h-12"
                />
              </div>

              {/* Category & Condition */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category" className="flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Category
                  </Label>
                  <select
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    required
                    className="w-full h-12 px-4 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Select category</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="condition">Condition</Label>
                  <select
                    id="condition"
                    value={condition}
                    onChange={(e) => setCondition(e.target.value)}
                    required
                    className="w-full h-12 px-4 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Select condition</option>
                    {conditions.map((cond) => (
                      <option key={cond.value} value={cond.value}>
                        {cond.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* University */}
              <div className="space-y-2">
                <Label htmlFor="university" className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4" />
                  University
                </Label>
                <select
                  id="university"
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  className="w-full h-12 px-4 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select university</option>
                  {ghanaUniversities.map((uni) => (
                    <option key={uni} value={uni}>
                      {uni}
                    </option>
                  ))}
                </select>
              </div>

              {/* Contact Numbers */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber" className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Phone Number
                  </Label>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    placeholder="e.g., 0241234567"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="whatsappNumber" className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4" />
                    WhatsApp Number (with 233)
                  </Label>
                  <Input
                    id="whatsappNumber"
                    type="tel"
                    placeholder="e.g., 233241234567"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    pattern="233[0-9]{9}"
                    title="Enter number with country code 233 (e.g., 233241234567)"
                    className="h-12"
                  />
                  <p className="text-xs text-muted-foreground">Enter with country code 233 (e.g., 233550617425)</p>
                </div>
              </div>

              {/* Images */}
              <div className="space-y-2">
                <Label>Images</Label>
                <ImageUpload
                  images={images}
                  onImagesChange={setImages}
                  userId={user.id}
                  maxImages={5}
                />
              </div>

              {/* Submit */}
              <Button
                type="submit"
                variant="hero"
                size="xl"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  "Create Listing"
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default CreateListing;
