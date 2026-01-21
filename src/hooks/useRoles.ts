import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type AppRole = "admin" | "moderator" | "user";

export const useRoles = () => {
  const { user } = useAuth();
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const fetchRoles = async () => {
      if (!user) {
        setRoles([]);
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id);

        if (error) throw error;

        const userRoles = (data || []).map((r: any) => r.role as AppRole);
        setRoles(userRoles);
        setIsAdmin(userRoles.includes("admin"));
      } catch (err) {
        console.error("Error fetching roles:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRoles();
  }, [user]);

  const assignRole = async (userId: string, role: AppRole) => {
    try {
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role });

      if (error) throw error;
      return { error: null };
    } catch (err: any) {
      return { error: err.message };
    }
  };

  const removeRole = async (userId: string, role: AppRole) => {
    try {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", role);

      if (error) throw error;
      return { error: null };
    } catch (err: any) {
      return { error: err.message };
    }
  };

  return { roles, isAdmin, isLoading, assignRole, removeRole };
};
