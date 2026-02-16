/**
 * Phone normalization utilities for Indian mobile numbers
 */

/**
 * Normalizes Indian 10-digit mobile numbers to E.164 format (+91...)
 * - If input is exactly 10 digits (after trimming/removing spaces), prepends +91
 * - If input already starts with +91, 0, or +, returns as-is (trimmed)
 * - Otherwise returns the trimmed input unchanged
 */
export function normalizeIndianMobileToE164(contact: string): string {
  const trimmed = contact.trim().replace(/\s+/g, '');
  
  // If already starts with + or 0, return as-is
  if (trimmed.startsWith('+') || trimmed.startsWith('0')) {
    return trimmed;
  }
  
  // If exactly 10 digits, add +91
  if (/^\d{10}$/.test(trimmed)) {
    return `+91${trimmed}`;
  }
  
  // Otherwise return as-is
  return trimmed;
}

/**
 * Converts a contact string to a WhatsApp-compatible number (digits only, with country code)
 * Returns null if the contact cannot be normalized into a valid WhatsApp number
 */
export function toWhatsAppWaNumber(contact: string): string | null {
  // First normalize to E.164 format
  const normalized = normalizeIndianMobileToE164(contact);
  
  // Extract only digits
  const digitsOnly = normalized.replace(/\D/g, '');
  
  // Valid WhatsApp number should have at least 10 digits (country code + number)
  // For Indian numbers: 91 (2 digits) + 10 digits = 12 digits minimum
  if (digitsOnly.length < 10) {
    return null;
  }
  
  // If the normalized version started with +91 or we added +91, we should have 12 digits
  // If it's exactly 10 digits after normalization, it means it wasn't normalized (edge case)
  if (digitsOnly.length === 10) {
    // This is a 10-digit number without country code, add 91
    return `91${digitsOnly}`;
  }
  
  return digitsOnly;
}
