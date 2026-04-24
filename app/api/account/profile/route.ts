import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { parseSessionValue, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import {
  COUNTRY_PHONE_RULES,
  EAST_AFRICA_COUNTRIES,
  type EastAfricaCountry,
} from "@/lib/constants/countries";
import { sanitizeLocalPhoneDigits } from "@/lib/validators/auth";

type UpdateProfileBody = {
  country?: string;
  phone?: string;
  address?: string;
  city?: string;
};

function validateFullPhoneAgainstCountry(
  country: EastAfricaCountry,
  fullPhone: string
): string | null {
  const rule = COUNTRY_PHONE_RULES[country];

  if (!fullPhone) return "Phone number is required.";

  if (!fullPhone.startsWith(rule.dialCode)) {
    return `Phone number must start with ${rule.dialCode} for ${country}.`;
  }

  const localPart = sanitizeLocalPhoneDigits(
    fullPhone.slice(rule.dialCode.length)
  );

  if (localPart.length !== rule.localDigits) {
    return `Phone number for ${country} must be exactly ${rule.localDigits} digits after ${rule.dialCode}.`;
  }

  if (fullPhone !== `${rule.dialCode}${localPart}`) {
    return "Phone number format is invalid.";
  }

  return null;
}

export async function PATCH(request: Request) {
  try {
    const cookieStore = await cookies();
    const rawSession = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!rawSession) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const session = parseSessionValue(rawSession);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = (await request.json()) as UpdateProfileBody;

    const country = body.country?.trim() ?? "";
    const phone = body.phone?.trim() ?? "";
    const address = body.address?.trim() ?? "";
    const city = body.city?.trim() ?? "";

    if (!country || !EAST_AFRICA_COUNTRIES.includes(country as never)) {
      return NextResponse.json(
        { error: "Selected country is not supported right now." },
        { status: 400 }
      );
    }

    const phoneError = validateFullPhoneAgainstCountry(
      country as EastAfricaCountry,
      phone
    );

    if (phoneError) {
      return NextResponse.json({ error: phoneError }, { status: 400 });
    }

    const updatedUser = await db.user.update({
      where: { id: session.userId },
      data: {
        country,
        phone,
        address: address || null,
        city: city || null,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        address: true,
        country: true,
        city: true,
        role: true,
        emailVerified: true,
        status: true,
        authProvider: true,
        onboardingCompleted: true,
      },
    });

    return NextResponse.json({
      message: "Profile updated successfully.",
      user: updatedUser,
    });
  } catch (error) {
    console.error("UPDATE_PROFILE_ERROR", error);

    return NextResponse.json(
      { error: "Unable to update profile right now." },
      { status: 500 }
    );
  }
}