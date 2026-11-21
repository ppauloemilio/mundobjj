import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { decode } from "next-auth/jwt";
import { z } from "zod";
import { getDb } from "@/db";
import { profiles, users } from "@/db/schema";
import {
  limitAuthorize,
  markLoginSuccess,
} from "@/lib/rate-limit";

const credentialsSchema = z.object({
  email: z.string().email(),
  // min 6 keeps existing accounts; new registers require 8 in actions
  password: z.string().min(6),
});

const isProd = process.env.NODE_ENV === "production";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },
  pages: {
    signIn: "/entrar",
  },
  cookies: {
    sessionToken: {
      name: isProd
        ? "__Secure-authjs.session-token"
        : "authjs.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: isProd,
      },
    },
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      authorize: async (credentials, request) => {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const email = parsed.data.email.trim().toLowerCase();
        const ip =
          request?.headers?.get("x-forwarded-for")?.split(",")[0]?.trim() ||
          request?.headers?.get("x-real-ip") ||
          "unknown";

        const limited = limitAuthorize(email, ip.slice(0, 64));
        if (!limited.ok) return null;

        const db = getDb();
        if (!db) return null;

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        if (!user?.passwordHash || user.blockedAt || user.suspendedAt) {
          return null;
        }

        const valid = await compare(parsed.data.password, user.passwordHash);
        if (!valid) return null;

        markLoginSuccess(email, ip.slice(0, 64));

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
          accountType: user.accountType,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user?.id) {
        token.sub = user.id;
        token.role = user.role ?? "user";
        token.accountType = user.accountType ?? "athlete";
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.role = (token.role as "user" | "admin") ?? "user";
        session.user.accountType =
          (token.accountType as
            | "athlete"
            | "academy"
            | "professor"
            | "admin") ?? "athlete";
      }
      return session;
    },
  },
});

/**
 * Read-only session for layout/shell — avoids Auth.js CSRF mint
 * (crypto.getRandomValues) during Cache Components prerender.
 */
export async function getShellSession() {
  const jar = await cookies();
  const cookieName = isProd
    ? "__Secure-authjs.session-token"
    : "authjs.session-token";
  const raw =
    jar.get(cookieName)?.value ||
    jar.get("authjs.session-token")?.value ||
    jar.get("__Secure-authjs.session-token")?.value;

  if (!raw || !process.env.AUTH_SECRET) return null;

  const salts = [
    cookieName,
    "authjs.session-token",
    "__Secure-authjs.session-token",
  ];

  for (const salt of salts) {
    try {
      const token = await decode({
        token: raw,
        secret: process.env.AUTH_SECRET,
        salt,
      });
      if (!token?.sub) continue;
      return {
        user: {
          id: String(token.sub),
          role: (token.role as "user" | "admin") ?? "user",
          accountType:
            (token.accountType as
              | "athlete"
              | "academy"
              | "professor"
              | "admin") ?? "athlete",
        },
      };
    } catch {
      // try next salt
    }
  }
  return null;
}

export function homePathForUser(user: {
  role?: string | null;
  accountType?: string | null;
}) {
  if (user.role === "admin" || user.accountType === "admin") return "/admin";
  if (user.accountType === "academy") return "/painel/academia";
  if (user.accountType === "professor") return "/painel/professor";
  return "/painel";
}

/** Login de quem já completou o onboarding → home; senão → painel. */
export async function postLoginPathForUser(user: {
  id?: string;
  role?: string | null;
  accountType?: string | null;
}) {
  if (user.role === "admin" || user.accountType === "admin") return "/admin";
  if (user.accountType === "academy") return "/painel/academia";
  if (user.accountType === "professor") return "/painel/professor";

  if (user.id) {
    const db = getDb();
    if (db) {
      const [profile] = await db
        .select({ done: profiles.onboardingCompletedAt })
        .from(profiles)
        .where(eq(profiles.userId, user.id))
        .limit(1);
      if (profile?.done) return "/";
    }
  }

  return "/painel";
}
