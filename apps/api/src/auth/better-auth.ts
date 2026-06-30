import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

let authPromise: Promise<any> | undefined;

export function getBetterAuth() {
  if (!authPromise) {
    authPromise = Promise.all([
      import("better-auth"),
      import("better-auth/adapters/prisma")
    ]).then(([{ betterAuth }, { prismaAdapter }]) =>
      betterAuth({
        basePath: "/api/auth",
        database: prismaAdapter(prisma, {
          provider: "postgresql"
        }),
        emailAndPassword: {
          enabled: true
        },
        secret: process.env.BETTER_AUTH_SECRET,
        trustedOrigins: [
          process.env.FRONTEND_ORIGIN ?? "http://localhost:3000"
        ],
        user: {
          additionalFields: {
            role: {
              type: "string",
              required: false,
              defaultValue: "APPLICANT",
              input: false
            }
          }
        }
      })
    );
  }

  return authPromise;
}
