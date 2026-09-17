const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(value) {
  return String(value ?? "").trim().toLowerCase();
}

export function isValidEmail(value) {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= 254 &&
    EMAIL_PATTERN.test(value)
  );
}

export function isValidPassword(value) {
  return typeof value === "string" && value.length >= 8 && value.length <= 128;
}

export function cleanDisplayName(value) {
  if (typeof value !== "string") return null;
  let cleaned = "";
  for (const ch of value) {
    const code = ch.codePointAt(0) ?? 0;
    if (code > 0x20 && code !== 0x7f) cleaned += ch;
  }
  cleaned = cleaned.trim();
  if (cleaned.length === 0) return null;
  return cleaned.slice(0, 60);
}