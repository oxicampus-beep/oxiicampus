export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 10 ? digits.slice(-10) : digits;
}

export function isValidGhanaPhone(phone: string): boolean {
  return normalizePhone(phone).length === 10;
}

export type TrackedOrder = {
  order_id: string;
  order_type: "platform" | "store";
  network: string;
  size_gb: number;
  price: number;
  status: string;
  contact_phone: string;
  store_name: string | null;
  created_at: string;
  updated_at: string;
};

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  processing: "Processing",
  completed: "Delivered",
  failed: "Failed",
  refunded: "Refunded",
};

export function orderStatusClass(status: string) {
  const map: Record<string, string> = {
    completed: "bg-primary/15 text-primary border-primary/30",
    pending: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/30",
    processing: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30",
    failed: "bg-destructive/15 text-destructive border-destructive/30",
    refunded: "bg-muted text-muted-foreground border-border",
  };
  return map[status] ?? "bg-secondary text-foreground border-border";
}
