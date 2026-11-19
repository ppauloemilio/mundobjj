import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role?: "user" | "admin";
    accountType?: "athlete" | "academy" | "professor";
  }

  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: "user" | "admin";
      accountType: "athlete" | "academy" | "professor";
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: "user" | "admin";
    accountType?: "athlete" | "academy" | "professor";
  }
}
