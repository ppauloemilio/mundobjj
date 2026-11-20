import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { users } from "@/db/schema";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/entrar",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      authorize: async (credentials) => {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const db = getDb();
        if (!db) return null;

        const email = parsed.data.email.trim().toLowerCase();
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        if (!user?.passwordHash || user.blockedAt) return null;

        const valid = await compare(parsed.data.password, user.passwordHash);
        if (!valid) return null;

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

export function homePathForUser(user: {
  role?: string | null;
  accountType?: string | null;
}) {
  if (user.role === "admin" || user.accountType === "admin") return "/admin";
  if (user.accountType === "academy") return "/painel/academia";
  if (user.accountType === "professor") return "/painel/professor";
  return "/painel";
}
