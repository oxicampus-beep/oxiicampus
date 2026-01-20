import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  ImagePlus, 
  Tag, 
  FileText, 
  DollarSign,
  Package,
  GraduationCap,
  ArrowLeft,
  Loader2,
  X
} from "lucide-react";

const categories = [
  "Electronics",
  "Books",
  "Services",
  "Clothing",
  "Furniture",
  "Accessories",
];

const conditions = [
  { value: "new", label: "New" },
  { value: "like_new", label: "Like New" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
  { value: "poor", label: "Poor" },
];

const universities = [
  "University of Ghana",
  "KNUST",
  "Ashesi University",
  "University of Cape Coast",
  "University of Professional Studies",
  "Regional Maritime University",
  "Ghana Institute of Management and Public Administration",
];

const CreateListing = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [condition, setCondition] = useState("");
  const [university, setUniversity] = useState(profile?.university || "");
  const [images, setImages] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState("");

  const addImageUrl = () => {
    if (imageUrl.trim() && images.length < 5) {
      setImages([...images, imageUrl.trim()]);
      setImageUrl("");
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

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

    // Check listing limits based on plan
    const planLimits: Record<string, number> = {
      free: 1,
      pro: 10,
      premium: 50,
    };
    
    const userPlan = profile?.plan || "free";
    const currentListings = profile?.listings_count || 0;
    const limit = planLimits[userPlan] || 1;

    if (currentListings >= limit) {
      toast({
        title: "Listing limit reached",
        description: `You've reached your ${userPlan} plan limit of ${limit} listings. Upgrade to list more!`,
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
      });

      if (error) throw error;

      // Update listings count
      await supabase
        .from("profiles")
        .update({ listings_count: currentListings + 1 })
        .eq("user_id", user.id);

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
                  {universities.map((uni) => (
                    <option key={uni} value={uni}>
                      {uni}
                    </option>
                  ))}
                </select>
              </div>

              {/* Images */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <ImagePlus className="w-4 h-4" />
                  Images (Add image URLs)
                </Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Paste image URL..."
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="h-12"
                  />
                  <Button type="button" variant="outline" onClick={addImageUrl}>
                    Add
                  </Button>
                </div>
                {images.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {images.map((img, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={img}
                          alt={`Preview ${index + 1}`}
                          className="w-20 h-20 object-cover rounded-lg border"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Add up to 5 image URLs. First image will be the cover.
                </p>
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
