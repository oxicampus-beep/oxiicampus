import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AmbassadorSetupDialog from "@/components/ambassador/AmbassadorSetupDialog";

interface AmbassadorSetupContextType {
  needsSetup: boolean;
}

const AmbassadorSetupContext = createContext<AmbassadorSetupContextType>({ needsSetup: false });

export const useAmbassadorSetup = () => useContext(AmbassadorSetupContext);

export const AmbassadorSetupProvider = ({ children }: { children: ReactNode }) => {
  const { user, profile } = useAuth();
  const [needsSetup, setNeedsSetup] = useState(false);

  useEffect(() => {
    if (!user) {
      setNeedsSetup(false);
      return;
    }

    const checkSetup = async () => {
      const { data } = await supabase
        .from("ambassadors")
        .select("id, status")
        .eq("user_id", user.id)
        .eq("status", "pending_setup")
        .maybeSingle();

      setNeedsSetup(!!data);
    };

    checkSetup();
  }, [user]);

  const handleComplete = () => {
    setNeedsSetup(false);
  };

  return (
    <AmbassadorSetupContext.Provider value={{ needsSetup }}>
      {children}
      {needsSetup && user && (
        <AmbassadorSetupDialog
          open={needsSetup}
          userId={user.id}
          userName={profile?.full_name || null}
          onComplete={handleComplete}
        />
      )}
    </AmbassadorSetupContext.Provider>
  );
};
