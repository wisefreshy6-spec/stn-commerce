export const EAST_AFRICA_COUNTRIES = [
  "Kenya",
  "Uganda",
  "Tanzania",
  "Rwanda",
  "Burundi",
  "South Sudan",
  "Ethiopia",
  "Somalia",
  "Djibouti",
  "Eritrea",
] as const;

export type EastAfricaCountry = (typeof EAST_AFRICA_COUNTRIES)[number];

export const COUNTRY_PHONE_RULES: Record<
  EastAfricaCountry,
  {
    dialCode: string;
    localDigits: number;
    example: string;
  }
> = {
  Kenya: {
    dialCode: "+254",
    localDigits: 9,
    example: "712345678",
  },
  Uganda: {
    dialCode: "+256",
    localDigits: 9,
    example: "712345678",
  },
  Tanzania: {
    dialCode: "+255",
    localDigits: 9,
    example: "712345678",
  },
  Rwanda: {
    dialCode: "+250",
    localDigits: 9,
    example: "788123456",
  },
  Burundi: {
    dialCode: "+257",
    localDigits: 8,
    example: "79123456",
  },
  "South Sudan": {
    dialCode: "+211",
    localDigits: 9,
    example: "912345678",
  },
  Ethiopia: {
    dialCode: "+251",
    localDigits: 9,
    example: "911234567",
  },
  Somalia: {
    dialCode: "+252",
    localDigits: 9,
    example: "612345678",
  },
  Djibouti: {
    dialCode: "+253",
    localDigits: 8,
    example: "77123456",
  },
  Eritrea: {
    dialCode: "+291",
    localDigits: 7,
    example: "7123456",
  },
};