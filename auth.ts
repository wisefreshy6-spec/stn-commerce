import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { db } from "@/lib/db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: {
    strategy: "jwt",
  },
  providers: [
    Google({
      allowDangerousEmailAccountLinking: false,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "google") {
        return true;
      }

      const email = user.email?.toLowerCase().trim();

      if (!email) {
        return false;
      }

      const existingUser = await db.user.findUnique({
        where: { email },
        select: {
          id: true,
          authProvider: true,
        },
      });

      if (existingUser && existingUser.authProvider === "CREDENTIALS") {
        return "/auth/login?error=google_account_conflict";
      }

      if (!existingUser) {
        const nameParts = (user.name ?? "").trim().split(/\s+/).filter(Boolean);
        const firstName = nameParts[0] ?? "Google";
        const lastName =
          nameParts.length > 1 ? nameParts.slice(1).join(" ") : "User";

        await db.user.create({
          data: {
            firstName,
            lastName,
            email,
            passwordHash: null,
            authProvider: "GOOGLE",
            onboardingCompleted: false,
            emailVerified: true,
            emailVerifiedAt: new Date(),
            status: "ACTIVE",
            role: "CUSTOMER",
          },
        });
      }

      return true;
    },

    async jwt({ token, user }) {
      if (user?.email) {
        token.email = user.email.toLowerCase().trim();
      }

      if (typeof token.email === "string") {
        const dbUser = await db.user.findUnique({
          where: { email: token.email },
          select: {
            id: true,
            role: true,
            onboardingCompleted: true,
            authProvider: true,
            emailVerified: true,
          },
        });

        if (dbUser) {
          token.userId = dbUser.id;
          token.role = dbUser.role;
          token.onboardingCompleted = dbUser.onboardingCompleted;
          token.authProvider = dbUser.authProvider;
          token.emailVerified = dbUser.emailVerified;
        }
      }

      return token;
    },

    async session({ session, token }) {
      (session as any).userId =
        typeof token.userId === "string" ? token.userId : null;
      (session as any).role =
        typeof token.role === "string" ? token.role : null;
      (session as any).onboardingCompleted =
        typeof token.onboardingCompleted === "boolean"
          ? token.onboardingCompleted
          : false;
      (session as any).authProvider =
        typeof token.authProvider === "string" ? token.authProvider : null;
      (session as any).emailVerified =
        typeof token.emailVerified === "boolean"
          ? token.emailVerified
          : false;

      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },
});