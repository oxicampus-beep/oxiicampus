import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Crown
} from "lucide-react";

const Profile = () => {
  const [isEditing, setIsEditing] = useState(false);
  
  // Mock user data
  const user = {
    name: "Kofi Mensah",
    email: "kofi.mensah@ug.edu.gh",
    phone: "+233 24 123 4567",
    university: "University of Ghana",
    location: "East Legon, Accra",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
    isVerified: true,
    plan: "Pro",
    listingsCount: 8,
    listingsLimit: 10,
    memberSince: "January 2024",
  };

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
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-32 h-32 rounded-2xl border-4 border-background object-cover shadow-lg"
                    />
                    <button className="absolute bottom-2 right-2 p-1.5 rounded-full bg-primary text-primary-foreground shadow-lg">
                      <Camera className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {/* Name & Details */}
                  <div className="pb-2">
                    <div className="flex items-center gap-2 mb-1">
                      <h1 className="font-display text-2xl md:text-3xl font-bold">
                        {user.name}
                      </h1>
                      {user.isVerified && (
                        <BadgeCheck className="w-6 h-6 text-primary" />
                      )}
                    </div>
                    <p className="text-muted-foreground">{user.university}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <Badge variant="outline" className="border-primary text-primary">
                        <Crown className="w-3 h-3 mr-1" />
                        {user.plan} Plan
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        Member since {user.memberSince}
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
                  <Link to="/settings">
                    <Button variant="ghost" size="sm">
                      <Settings className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-card rounded-xl border border-border p-4">
              <Package className="w-8 h-8 text-primary mb-2" />
              <div className="font-display text-2xl font-bold">{user.listingsCount}</div>
              <div className="text-sm text-muted-foreground">Active Listings</div>
            </div>
            <div className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center justify-between mb-2">
                <Crown className="w-8 h-8 text-accent" />
                <span className="text-xs text-muted-foreground">
                  {user.listingsCount}/{user.listingsLimit}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2 mb-2">
                <div 
                  className="gradient-bg h-2 rounded-full"
                  style={{ width: `${(user.listingsCount / user.listingsLimit) * 100}%` }}
                />
              </div>
              <div className="text-sm text-muted-foreground">Listings Used</div>
            </div>
            <Link to="/my-listings" className="block">
              <div className="bg-card rounded-xl border border-border p-4 hover:shadow-purple transition-shadow">
                <Package className="w-8 h-8 text-purple-glow mb-2" />
                <div className="font-display text-2xl font-bold">View</div>
                <div className="text-sm text-muted-foreground">My Listings</div>
              </div>
            </Link>
            <Link to="/favorites" className="block">
              <div className="bg-card rounded-xl border border-border p-4 hover:shadow-purple transition-shadow">
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
                      <Input defaultValue={user.name} className="mt-1" />
                    ) : (
                      <p className="font-medium">{user.name}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <label className="text-sm text-muted-foreground">Email Address</label>
                    {isEditing ? (
                      <Input defaultValue={user.email} className="mt-1" />
                    ) : (
                      <p className="font-medium">{user.email}</p>
                    )}
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
                      <Input defaultValue={user.phone} className="mt-1" />
                    ) : (
                      <p className="font-medium">{user.phone}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <label className="text-sm text-muted-foreground">Location</label>
                    {isEditing ? (
                      <Input defaultValue={user.location} className="mt-1" />
                    ) : (
                      <p className="font-medium">{user.location}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {isEditing && (
              <div className="flex gap-3 mt-6 pt-6 border-t border-border">
                <Button variant="hero" onClick={() => setIsEditing(false)}>
                  Save Changes
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
