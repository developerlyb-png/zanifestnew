// Normalises an Indian mobile number to its bare 10 digits, whatever the
// user typed: "+91 98765 43210", "919876543210", "09876543210",
// "98765-43210" -> "9876543210". Returns null when it isn't a valid Indian
// mobile (10 digits starting 6-9).
//
// Used by both WhatsApp OTP send and verify so they store/look up the OTP
// under the same key, and so the number sent to WhatsApp is never
// double-prefixed (the old code did "91" + input, so an input that already
// had 91 became 9191XXXXXXXXXX — a number that doesn't exist, and the OTP
// silently never arrived).
export function normalizeIndianMobile(input: unknown): string | null {
  let digits = String(input ?? "").replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  return /^[6-9]\d{9}$/.test(digits) ? digits : null;
}
