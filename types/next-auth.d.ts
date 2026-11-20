import { DefaultSession } from "next-auth";

export type AppAccountType = "athlete" | "academy" | "professor" | "admin";

declare module "next-auth" {
  interface User {
    role?: "user" | "admin";
    accountType?: AppAccountType;
  }

  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: "user" | "admin";
      accountType: AppAccountType;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: "user" | "admin";
    accountType?: AppAccountType;
  }
}
