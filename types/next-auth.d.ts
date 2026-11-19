import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role?: "user" | "admin";
  }

  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: "user" | "admin";
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: "user" | "admin";
  }
}
