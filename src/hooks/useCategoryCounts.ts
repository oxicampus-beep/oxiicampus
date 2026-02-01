import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface CategoryCount {
  category: string;
  count: number;
}

export const useCategoryCounts = () => {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCounts = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("listings")
          .select("category")
          .eq("status", "available");

        if (error) throw error;

        // Count listings per category
        const categoryCounts: Record<string, number> = {};
        (data || []).forEach((listing) => {
          const cat = listing.category;
          categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
        });

        setCounts(categoryCounts);
      } catch (err) {
        console.error("Error fetching category counts:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCounts();
  }, []);

  return { counts, isLoading };
};
