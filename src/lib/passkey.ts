export const PASSKEY_OFFER_KEY = "byteboss_offer_passkey";
export const PASSKEY_HINT_KEY = "byteboss_has_passkey";
export const ONBOARDING_COMPLETE_EVENT = "byteboss-onboarding-complete";

export function isPasskeySupported(): boolean {
  return !!(
    typeof window !== "undefined" &&
    "PublicKeyCredential" in window &&
    window.PublicKeyCredential &&
    "credentials" in navigator &&
    typeof navigator.credentials?.create === "function" &&
    typeof navigator.credentials?.get === "function"
  );
}

export function markPasskeyOfferPending(): void {
  sessionStorage.setItem(PASSKEY_OFFER_KEY, "1");
}

export function peekPasskeyOfferPending(): boolean {
  return sessionStorage.getItem(PASSKEY_OFFER_KEY) === "1";
}

export function consumePasskeyOfferPending(): boolean {
  if (!peekPasskeyOfferPending()) return false;
  sessionStorage.removeItem(PASSKEY_OFFER_KEY);
  return true;
}

export function clearPasskeyOfferPending(): void {
  sessionStorage.removeItem(PASSKEY_OFFER_KEY);
}

export function setPasskeyHint(enabled: boolean): void {
  if (enabled) localStorage.setItem(PASSKEY_HINT_KEY, "1");
  else localStorage.removeItem(PASSKEY_HINT_KEY);
}

export function hasPasskeyHint(): boolean {
  return localStorage.getItem(PASSKEY_HINT_KEY) === "1";
}

export function friendlyPasskeyError(error: { message?: string; name?: string } | null): string {
  if (!error) return "Biometric sign-in failed. Try email and password instead.";
  const msg = error.message ?? "";
  if (error.name === "AbortError" || msg.toLowerCase().includes("abort")) {
    return "Biometric sign-in was cancelled.";
  }
  if (msg.includes("not support")) {
    return "This device or browser does not support biometric sign-in.";
  }
  if (msg.includes("experimental") || msg.includes("passkey")) {
    return "Biometric sign-in is not enabled yet. Use email and password, or add a passkey from Settings.";
  }
  if (msg.includes("404") || msg.toLowerCase().includes("not found")) {
    return "Biometric sign-in is not available on this account yet.";
  }
  return msg || "Biometric sign-in failed. Try email and password instead.";
}
