import { Card } from "@/components/ui/card";
import { Sparkles, Tv, GraduationCap, Zap } from "lucide-react";

const services = [
  { icon: Tv, title: "DStv / GOtv Subscriptions", desc: "Pay for your TV subscriptions instantly." },
  { icon: Zap, title: "ECG Power Top-up", desc: "Recharge your prepaid electricity meter." },
  { icon: GraduationCap, title: "Result Checkers", desc: "WAEC, BECE & university result voucher cards." },
  { icon: Sparkles, title: "Airtime Top-up", desc: "Send airtime to any Ghanaian network." },
];

export default function ExtraServices() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl md:text-4xl font-display font-bold">Extra Services</h1>
        <p className="text-muted-foreground mt-1">More ways to grow your reselling business.</p>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        {services.map(s => (
          <Card key={s.title} className="p-6 hover:border-primary/40 transition-colors cursor-pointer">
            <div className="h-12 w-12 rounded-lg bg-primary/15 text-primary grid place-items-center mb-4"><s.icon className="h-6 w-6" /></div>
            <div className="font-display font-semibold text-lg">{s.title}</div>
            <div className="text-sm text-muted-foreground mt-1">{s.desc}</div>
            <div className="text-xs text-primary mt-3">Coming soon</div>
          </Card>
        ))}
      </div>
    </div>
  );
}
