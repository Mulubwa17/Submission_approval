import type { PrismaClient } from "@prisma/client";

export type BetterAuthInstance = Awaited<ReturnType<typeof createBetterAuth>>;

/**
 * Builds a better-auth instance bound to the supplied Prisma client. Callers own
 * the client lifecycle so the whole app can share a single connection pool
 * (the Nest BetterAuthService passes in PrismaService; the seed script passes
 * its own short-lived client).
 */
export function createBetterAuth(prisma: PrismaClient) {
  return Promise.all([
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
      trustedOrigins: [process.env.FRONTEND_ORIGIN ?? "http://localhost:3000"],
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
