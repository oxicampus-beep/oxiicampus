import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle } from "lucide-react";

/** Maintenance alerts only — promo images show in PromoCarousel */
export default function PlatformBanners() {
  const [maintenance, setMaintenance] = useState<{ on: boolean; message: string | null }>({ on: false, message: null });

  useEffect(() => {
    supabase.from("platform_settings").select("maintenance_mode, maintenance_message").eq("id", 1).maybeSingle()
      .then(({ data }) => {
        if (data) setMaintenance({ on: data.maintenance_mode ?? false, message: data.maintenance_message });
      });
  }, []);

  if (!maintenance.on) return null;

  return (
    <div className="mb-6">
      <div className="flex items-start gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm">
        <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="font-semibold text-amber-600 dark:text-amber-400">Platform maintenance</p>
          <p className="text-muted-foreground mt-0.5">
            {maintenance.message || "Purchases may be temporarily unavailable while we perform updates."}
          </p>
        </div>
      </div>
    </div>
  );
}
