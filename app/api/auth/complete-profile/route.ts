import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import {
  createSessionValue,
  getSessionCookieOptions,
  parseSessionValue,
  SESSION_COOKIE_NAME,
} from "@/lib/auth/session";
import {
  COUNTRY_PHONE_RULES,
  EAST_AFRICA_COUNTRIES,
  type EastAfricaCountry,
} from "@/lib/constants/countries";
import { sanitizeLocalPhoneDigits } from "@/lib/validators/auth";

type CompleteProfileBody = {
  country?: string;
  phone?: string;
  address?: string;
  city?: string;
  next?: string;
};

function validateFullPhoneAgainstCountry(
  country: EastAfricaCountry,
  fullPhone: string
): string | null {
  const rule = COUNTRY_PHONE_RULES[country];

  if (!fullPhone) {
    return "Phone number is required.";
  }

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

export async function POST(request: Request) {
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

    const body = (await request.json()) as CompleteProfileBody;

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

    const user = await db.user.update({
      where: { id: session.userId },
      data: {
        country,
        phone,
        address: address || null,
        city: city || null,
        onboardingCompleted: true,
      },
      select: {
        id: true,
        country: true,
        phone: true,
        onboardingCompleted: true,
      },
    });

    const currentUser = await db.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        role: true,
        emailVerified: true,
        authProvider: true,
        onboardingCompleted: true,
      },
    });

    if (!currentUser) {
      return NextResponse.json(
        { error: "User not found after update." },
        { status: 404 }
      );
    }

    const updatedSessionValue = createSessionValue({
      userId: currentUser.id,
      role: currentUser.role,
      emailVerified: currentUser.emailVerified,
      authProvider: currentUser.authProvider,
      onboardingCompleted: currentUser.onboardingCompleted,
      rememberMe: true,
    });

    cookieStore.set(
      SESSION_COOKIE_NAME,
      updatedSessionValue,
      getSessionCookieOptions(true)
    );

    return NextResponse.json({
      message: "Profile completed successfully.",
      user,
    });
  } catch (error) {
    console.error("COMPLETE_PROFILE_ERROR", error);

    return NextResponse.json(
      { error: "Unable to complete profile right now." },
      { status: 500 }
    );
  }
}