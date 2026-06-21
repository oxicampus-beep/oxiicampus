import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ShoppingBag, Store, Users, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { ONBOARDING_COMPLETE_EVENT } from "@/lib/passkey";

const OPTIONS = [
  {
    icon: ShoppingBag,
    title: "Buy a data bundle",
    desc: "Purchase MTN, Telecel or AirtelTigo data instantly",
    to: "/dashboard/buy-data",
    color: "border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/15",
  },
  {
    icon: Store,
    title: "Become a data agent",
    desc: "Get wholesale prices, your own store and earn on every sale",
    to: "/dashboard/my-store",
    color: "border-primary/30 bg-primary/10 hover:bg-primary/15",
  },
  {
    icon: Users,
    title: "Become a sub-agent",
    desc: "Join under an existing agent and start reselling",
    to: "/dashboard/extras",
    color: "border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/15",
  },
];

export default function WelcomeOnboarding() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(() => !localStorage.getItem("byteboss_onboarding_done"));

  const finishOnboarding = () => {
    localStorage.setItem("byteboss_onboarding_done", "1");
    window.dispatchEvent(new Event(ONBOARDING_COMPLETE_EVENT));
  };

  const pick = (to: string) => {
    finishOnboarding();
    setOpen(false);
    navigate(to);
  };

  const skip = () => {
    finishOnboarding();
    setOpen(false);
  };

  if (!open) return null;

  return (
    <Dialog open onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden border-white/10 bg-[#0A0A0F] text-white">
        <div className="p-6 md:p-8">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="text-[10px] font-black uppercase tracking-widest text-primary">Welcome to ByteBoss</span>
          </div>
          <h2 className="text-2xl font-display font-black">What would you like to do?</h2>
          <p className="text-sm text-white/50 mt-1 mb-6">Pick an option to get started quickly.</p>
          <div className="space-y-3">
            {OPTIONS.map(opt => (
              <button
                key={opt.to}
                type="button"
                onClick={() => pick(opt.to)}
                className={cn("w-full flex items-start gap-4 p-4 rounded-2xl border text-left transition-all hover:scale-[1.01]", opt.color)}
              >
                <div className="h-11 w-11 rounded-xl bg-black/30 grid place-items-center shrink-0">
                  <opt.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-bold">{opt.title}</p>
                  <p className="text-xs text-white/50 mt-0.5">{opt.desc}</p>
                </div>
              </button>
            ))}
          </div>
          <button type="button" onClick={skip} className="w-full mt-4 text-xs text-white/40 hover:text-white/60 py-2">
            Skip tutorial
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
