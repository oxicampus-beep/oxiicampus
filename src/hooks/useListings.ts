import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Listing {
  id: string;
  title: string;
  description: string | null;
  price: number;
  category: string;
  condition: string | null;
  university: string | null;
  images: string[] | null;
  status: string | null;
  is_featured: boolean | null;
  phone_number: string | null;
  whatsapp_number: string | null;
  created_at: string;
  user_id: string;
  seller?: {
    full_name: string | null;
    avatar_url: string | null;
    is_verified: boolean | null;
    university: string | null;
    plan: string | null;
  } | null;
}

interface UseListingsOptions {
  category?: string;
  university?: string;
  search?: string;
  limit?: number;
  featuredOnly?: boolean;
  minPrice?: number;
  maxPrice?: number;
}

export const useListings = (options: UseListingsOptions = {}) => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchListings = async () => {
    setIsLoading(true);
    setError(null);

    try {
      let query = supabase
        .from("listings")
        .select("*")
        .eq("status", "available")
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false });

      if (options.category && options.category !== "All") {
        query = query.eq("category", options.category);
      }

      if (options.university && options.university !== "All Universities") {
        query = query.eq("university", options.university);
      }

      if (options.search) {
        query = query.ilike("title", `%${options.search}%`);
      }

      if (options.featuredOnly) {
        query = query.eq("is_featured", true);
      }

      if (options.minPrice !== undefined) {
        query = query.gte("price", options.minPrice);
      }

      if (options.maxPrice !== undefined) {
        query = query.lte("price", options.maxPrice);
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data: listingsData, error: queryError } = await query;

      if (queryError) throw queryError;

      // Fetch seller profiles separately
      const userIds = [...new Set((listingsData || []).map(l => l.user_id))];
      
      let profilesMap: Record<string, any> = {};
      if (userIds.length > 0) {
        // Use profiles_public view to only expose non-sensitive profile data
        const { data: profiles } = await supabase
          .from("profiles_public")
          .select("user_id, full_name, avatar_url, is_verified, university")
          .in("user_id", userIds);
        
        profilesMap = (profiles || []).reduce((acc, p) => {
          acc[p.user_id] = p;
          return acc;
        }, {} as Record<string, any>);
      }

      // Transform data to include seller info
      const transformedListings = (listingsData || []).map((listing) => ({
        ...listing,
        seller: profilesMap[listing.user_id] ? {
          full_name: profilesMap[listing.user_id].full_name,
          avatar_url: profilesMap[listing.user_id].avatar_url,
          is_verified: profilesMap[listing.user_id].is_verified,
          university: profilesMap[listing.user_id].university,
          plan: null,
        } : null,
      }));

      setListings(transformedListings);
    } catch (err: any) {
      console.error("Error fetching listings:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [options.category, options.university, options.search, options.limit, options.featuredOnly, options.minPrice, options.maxPrice]);

  return { listings, isLoading, error, refetch: fetchListings };
};

export const useListing = (id: string | undefined) => {
  const [listing, setListing] = useState<Listing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setIsLoading(false);
      return;
    }

    const fetchListing = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const { data, error: queryError } = await supabase
          .from("listings")
          .select("*")
          .eq("id", id)
          .maybeSingle();

        if (queryError) throw queryError;

        if (data) {
          // Fetch seller profile
          // Use profiles_public view to only expose non-sensitive profile data
          // Phone is not included as it's sensitive - users contact via messaging
          const { data: profile } = await supabase
            .from("profiles_public")
            .select("full_name, avatar_url, is_verified, university")
            .eq("user_id", data.user_id)
            .maybeSingle();

          setListing({
            ...data,
            seller: profile ? {
              full_name: profile.full_name,
              avatar_url: profile.avatar_url,
              is_verified: profile.is_verified,
              university: profile.university,
            } : null,
          });
        }
      } catch (err: any) {
        console.error("Error fetching listing:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchListing();
  }, [id]);

  return { listing, isLoading, error };
};
