import {
  COUNTRY_PHONE_RULES,
  type EastAfricaCountry,
} from "@/lib/constants/countries";

export function validateName(value: string, fieldLabel: string): string | null {
  const trimmed = value.trim();

  if (!trimmed) {
    return `${fieldLabel} is required.`;
  }

  if (trimmed.length < 2) {
    return `${fieldLabel} must be at least 2 characters.`;
  }

  if (!/^[A-Za-z][A-Za-z\s'-]*$/.test(trimmed)) {
    return `${fieldLabel} can only contain letters, spaces, apostrophes, and hyphens.`;
  }

  return null;
}

export function validateEmail(value: string): string | null {
  const trimmed = value.trim().toLowerCase();

  if (!trimmed) {
    return "Email address is required.";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return "Enter a valid email address.";
  }

  return null;
}

export function validatePassword(value: string): string | null {
  if (!value) {
    return "Password is required.";
  }

  if (value.length < 8) {
    return "Password must be at least 8 characters.";
  }

  if (!/^[A-Z]/.test(value)) {
    return "Password must start with an uppercase letter.";
  }

  if (!/[a-z]/.test(value)) {
    return "Password must include at least one lowercase letter.";
  }

  if (!/[0-9]/.test(value)) {
    return "Password must include at least one number.";
  }

  if (!/[^A-Za-z0-9]/.test(value)) {
    return "Password must include at least one special character.";
  }

  return null;
}

export function validateConfirmPassword(
  password: string,
  confirmPassword: string
): string | null {
  if (!confirmPassword) {
    return "Confirm password is required.";
  }

  if (password !== confirmPassword) {
    return "Passwords do not match.";
  }

  return null;
}

export function sanitizeLocalPhoneDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export function buildFullPhoneNumber(
  country: EastAfricaCountry,
  localDigits: string
): string {
  const rule = COUNTRY_PHONE_RULES[country];
  return `${rule.dialCode}${localDigits}`;
}

export function validatePhoneForCountry(
  country: string,
  localDigitsRaw: string
): string | null {
  if (!country) {
    return "Country is required.";
  }

  const rule = COUNTRY_PHONE_RULES[country as EastAfricaCountry];

  if (!rule) {
    return "Selected country is not supported right now.";
  }

  const localDigits = sanitizeLocalPhoneDigits(localDigitsRaw);

  if (!localDigits) {
    return "Phone number is required.";
  }

  if (localDigits.length !== rule.localDigits) {
    return `Phone number for ${country} must be exactly ${rule.localDigits} digits after ${rule.dialCode}.`;
  }

  return null;
}