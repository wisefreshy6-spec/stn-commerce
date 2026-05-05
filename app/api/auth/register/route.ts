import { NextResponse } from "next/server";
import {
  COUNTRY_PHONE_RULES,
  EAST_AFRICA_COUNTRIES,
  type EastAfricaCountry,
} from "@/lib/constants/countries";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { resolveRoleFromEmail } from "@/lib/auth/admin";
import { createRawToken, hashToken } from "@/lib/auth/tokens";
import { sendEmail } from "@/lib/email";
import { verificationEmailTemplate } from "@/lib/emailTemplates";
import {
  sanitizeLocalPhoneDigits,
  validateConfirmPassword,
  validateEmail,
  validateName,
  validatePassword,
} from "@/lib/validators/auth";

type RegisterBody = {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  country?: string;
  city?: string;
  password?: string;
  confirmPassword?: string;
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

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RegisterBody;

    const firstName = body.firstName?.trim() ?? "";
    const lastName = body.lastName?.trim() ?? "";
    const email = body.email?.trim().toLowerCase() ?? "";
    const phone = body.phone?.trim() ?? "";
    const address = body.address?.trim() ?? "";
    const country = body.country?.trim() ?? "";
    const city = body.city?.trim() ?? "";
    const password = body.password ?? "";
    const confirmPassword = body.confirmPassword ?? "";

    const firstNameError = validateName(firstName, "First name");
    if (firstNameError) {
      return NextResponse.json({ error: firstNameError }, { status: 400 });
    }

    const lastNameError = validateName(lastName, "Last name");
    if (lastNameError) {
      return NextResponse.json({ error: lastNameError }, { status: 400 });
    }

    const emailError = validateEmail(email);
    if (emailError) {
      return NextResponse.json({ error: emailError }, { status: 400 });
    }

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

    const passwordError = validatePassword(password);
    if (passwordError) {
      return NextResponse.json({ error: passwordError }, { status: 400 });
    }

    const confirmPasswordError = validateConfirmPassword(
      password,
      confirmPassword
    );

    if (confirmPasswordError) {
      return NextResponse.json(
        { error: confirmPasswordError },
        { status: 400 }
      );
    }

    const existingUser = await db.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with that email already exists." },
        { status: 409 }
      );
    }

    const passwordHash = hashPassword(password);
    const role = resolveRoleFromEmail(email);

    const user = await db.user.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        address: address || null,
        country,
        city: city || null,
        passwordHash,
        authProvider: "CREDENTIALS",
        onboardingCompleted: true,
        status: "PENDING",
        role,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    });

    const rawToken = createRawToken();
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24);

    await db.verificationToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    const appUrl = process.env.APP_URL || "http://localhost:3000";
    const verifyUrl = `${appUrl}/api/auth/verify-email?token=${rawToken}`;

    try {
      const name =
        [user.firstName, user.lastName].filter(Boolean).join(" ") || "Customer";

      await sendEmail({
        to: user.email,
        subject: "Verify your STN Commerce account",
        html: verificationEmailTemplate({
          name,
          verifyUrl,
        }),
        text: `Verify your STN Commerce account: ${verifyUrl}`,
      });
    } catch (emailError) {
      console.error("REGISTER_VERIFICATION_EMAIL_ERROR", emailError);
    }

    return NextResponse.json(
      {
        message:
          "Account created successfully. Check your email to verify your account before logging in.",
        developmentVerifyUrl:
          process.env.NODE_ENV === "production" ? undefined : verifyUrl,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("REGISTER_ERROR", error);

    return NextResponse.json(
      { error: "Unable to register right now." },
      { status: 500 }
    );
  }
}