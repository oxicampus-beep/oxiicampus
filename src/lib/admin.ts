import { labelFor } from "@/components/data/BuyDataDialog";

export { labelFor };

export function formatCurrency(amount: number) {
  return `₵${amount.toFixed(2)}`;
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleString();
}

export function statusBadgeClass(status: string) {
  const map: Record<string, string> = {
    completed: "border-primary/40 bg-primary/10 text-primary",
    pending: "border-yellow-500/40 bg-yellow-500/10 text-yellow-400",
    processing: "border-blue-500/40 bg-blue-500/10 text-blue-400",
    failed: "border-destructive/40 bg-destructive/10 text-destructive",
    refunded: "border-muted-foreground/40 bg-muted text-muted-foreground",
  };
  return map[status] ?? "border-border bg-secondary text-foreground";
}

export function groupSalesByDay(orders: { price: number; created_at: string }[], days = 7) {
  const result: { date: string; revenue: number; orders: number }[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric" });
    const dayOrders = orders.filter(o => o.created_at.slice(0, 10) === key);
    result.push({
      date: label,
      revenue: dayOrders.reduce((s, o) => s + Number(o.price), 0),
      orders: dayOrders.length,
    });
  }
  return result;
}
