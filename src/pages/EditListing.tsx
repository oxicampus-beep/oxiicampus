import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
import { ghanaUniversities, categories, conditions, listingStatuses } from "@/data/constants";
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

const EditListing = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [condition, setCondition] = useState("");
  const [university, setUniversity] = useState("");
  const [status, setStatus] = useState("available");
  const [images, setImages] = useState<string[]>([]);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");

  useEffect(() => {
    const fetchListing = async () => {
      if (!id || !user) return;

      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        toast({
          title: "Error loading listing",
          description: error.message,
          variant: "destructive",
        });
        navigate("/my-listings");
        return;
      }

      if (!data) {
        toast({
          title: "Listing not found",
          description: "This listing doesn't exist or you don't have permission to edit it",
          variant: "destructive",
        });
        navigate("/my-listings");
        return;
      }

      setTitle(data.title);
      setDescription(data.description || "");
      setPrice(data.price.toString());
      setCategory(data.category);
      setCondition(data.condition || "");
      setUniversity(data.university || "");
      setStatus(data.status || "available");
      setImages(data.images || []);
      setPhoneNumber(data.phone_number || "");
      setWhatsappNumber(data.whatsapp_number || "");
      setIsLoading(false);
    };

    fetchListing();
  }, [id, user, navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !id) return;

    setIsSaving(true);

    try {
      const { error } = await supabase
        .from("listings")
        .update({
          title,
          description,
          price: parseFloat(price),
          category,
          condition,
          university,
          status,
          images: images.length > 0 ? images : ["https://images.unsplash.com/photo-1560343090-f0409e92791a?w=800"],
          phone_number: phoneNumber || null,
          whatsapp_number: whatsappNumber || phoneNumber || null,
        })
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;

      toast({
        title: "Listing updated!",
        description: "Your changes have been saved.",
      });

      navigate("/my-listings");
    } catch (error: any) {
      toast({
        title: "Error updating listing",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 pb-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="font-display text-3xl font-bold mb-4">Sign in required</h1>
            <Button variant="hero" onClick={() => navigate("/auth")}>
              Sign In
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 pb-16 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
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
              Edit Listing
            </h1>
            <p className="text-muted-foreground mb-8">
              Update your listing details
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Status */}
              <div className="space-y-2">
                <Label htmlFor="status">Listing Status</Label>
                <div className="flex flex-wrap gap-2">
                  {listingStatuses.map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => setStatus(s.value)}
                      className={`px-4 py-2 rounded-lg border transition-colors ${
                        status === s.value
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <span className={`inline-block w-2 h-2 rounded-full ${s.color} mr-2`} />
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

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
              <div className="flex gap-4">
                <Button
                  type="submit"
                  variant="hero"
                  size="xl"
                  className="flex-1"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="xl"
                  onClick={() => navigate("/my-listings")}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default EditListing;
