export function slugify(name: string) {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 32);
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${base || "store"}-${suffix}`;
}

export function getStoreUrl(slug: string) {
  return `${window.location.origin}/store/${slug}`;
}

export function whatsappLink(number: string, message: string) {
  const digits = number.replace(/\D/g, "");
  const phone = digits.startsWith("0") ? `233${digits.slice(1)}` : digits.startsWith("233") ? digits : `233${digits}`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
