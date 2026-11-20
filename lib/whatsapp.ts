export function digitsOnly(value: string | null | undefined) {
  return (value || "").replace(/\D/g, "");
}

export function normalizeWhatsapp(value: string | null | undefined) {
  const digits = digitsOnly(value);
  if (!digits) return null;
  if (digits.length >= 10 && digits.length <= 11) return `55${digits}`;
  if (digits.startsWith("55") && digits.length >= 12) return digits;
  return digits.length >= 10 ? digits : null;
}

export function whatsappChatUrl(
  phone: string | null | undefined,
  message: string,
) {
  const normalized = normalizeWhatsapp(phone);
  if (!normalized) return null;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}

export function randomTemporaryPassword() {
  const part = () => Math.random().toString(36).slice(2, 8);
  return `Mbjj-${part()}-${part().slice(0, 4)}`;
}