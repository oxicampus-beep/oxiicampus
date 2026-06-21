export type MoMoProvider = "mtn" | "vod" | "tgo";

export type GhanaNetwork = {
  id: MoMoProvider;
  label: string;
  shortLabel: string;
  color: string;
  bgClass: string;
  borderClass: string;
};

export const GHANA_NETWORKS: Record<MoMoProvider, GhanaNetwork> = {
  mtn: {
    id: "mtn",
    label: "MTN Mobile Money",
    shortLabel: "MTN",
    color: "#FFCC00",
    bgClass: "bg-[#FFCC00]/15",
    borderClass: "border-[#FFCC00]/40",
  },
  vod: {
    id: "vod",
    label: "Telecel Cash",
    shortLabel: "Telecel",
    color: "#E60000",
    bgClass: "bg-red-500/15",
    borderClass: "border-red-500/40",
  },
  tgo: {
    id: "tgo",
    label: "AirtelTigo Money",
    shortLabel: "AirtelTigo",
    color: "#E4002B",
    bgClass: "bg-rose-500/15",
    borderClass: "border-rose-500/40",
  },
};

const PREFIX_MAP: Record<string, MoMoProvider> = {
  "024": "mtn",
  "054": "mtn",
  "055": "mtn",
  "059": "mtn",
  "025": "mtn",
  "020": "vod",
  "050": "vod",
  "027": "tgo",
  "057": "tgo",
  "026": "tgo",
  "056": "tgo",
};

export function normalizeGhanaPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("233") && digits.length >= 12) {
    return "0" + digits.slice(3, 12);
  }
  if (digits.length === 9) return "0" + digits;
  return digits.slice(0, 10);
}

export function detectGhanaNetwork(phone: string): GhanaNetwork | null {
  const normalized = normalizeGhanaPhone(phone);
  if (normalized.length < 3) return null;
  const prefix = normalized.slice(0, 3);
  const provider = PREFIX_MAP[prefix];
  return provider ? GHANA_NETWORKS[provider] : null;
}

export function isValidGhanaMoMoPhone(phone: string): boolean {
  const normalized = normalizeGhanaPhone(phone);
  return normalized.length === 10 && normalized.startsWith("0") && detectGhanaNetwork(normalized) !== null;
}
