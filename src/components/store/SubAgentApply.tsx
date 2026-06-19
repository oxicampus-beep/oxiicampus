import { toast } from "sonner";
import { useStoreSubAgent } from "@/hooks/useStoreSubAgent";
import SubAgentApplyPanel from "@/components/store/SubAgentApplyPanel";
import SubAgentBenefits from "@/components/store/SubAgentBenefits";
import { cn } from "@/lib/utils";

type Props = {
  storeSlug: string;
  storeName: string;
  className?: string;
  variant?: "full" | "compact";
};

export default function SubAgentApply({ storeSlug, storeName, className, variant = "full" }: Props) {
  const {
    status,
    fee,
    savings,
    loading,
    applying,
    isStoreOwner,
    canApply,
    apply,
  } = useStoreSubAgent(storeSlug);

  const handleApply = async () => {
    const { error } = await apply();
    if (error) toast.error(error.message);
    else toast.success("Application submitted! You'll get full access once approved.");
  };

  if (loading) return null;

  if (variant === "compact") {
    return (
      <SubAgentApplyPanel
        storeSlug={storeSlug}
        storeName={storeName}
        status={status}
        fee={fee}
        canApply={canApply}
        isStoreOwner={isStoreOwner}
        applying={applying}
        onApply={handleApply}
        className={className}
      />
    );
  }

  return (
    <div id="sub-agent" className={cn("space-y-6 scroll-mt-20", className)}>
      <div className="text-center max-w-lg mx-auto">
        <h2 className="font-display font-bold text-2xl">Resell with {storeName}</h2>
        <p className="text-sm text-muted-foreground mt-2">
          Become a sub-agent — cheaper prices, your own store, full dashboard access.
        </p>
      </div>
      <SubAgentBenefits storeName={storeName} savings={savings} compact />
      <SubAgentApplyPanel
        storeSlug={storeSlug}
        storeName={storeName}
        status={status}
        fee={fee}
        canApply={canApply}
        isStoreOwner={isStoreOwner}
        applying={applying}
        onApply={handleApply}
      />
    </div>
  );
}
