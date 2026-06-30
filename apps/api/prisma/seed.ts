import { PrismaClient, Role } from "@prisma/client";
import { createBetterAuth } from "../src/auth/better-auth";

const prisma = new PrismaClient();
const authPromise = createBetterAuth(prisma);

async function ensureUser(input: {
  email: string;
  name: string;
  password: string;
  role: Role;
}) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });

  if (!existing) {
    const auth = await authPromise;
    await auth.api.signUpEmail({
      body: {
        email: input.email,
        name: input.name,
        password: input.password
      }
    });
  }

  await prisma.user.update({
    where: { email: input.email },
    data: {
      emailVerified: true,
      name: input.name,
      role: input.role
    }
  });
}

async function main() {
  await ensureUser({
    email: "applicant@example.com",
    name: "Alex Applicant",
    password: "password123",
    role: Role.APPLICANT
  });

  await ensureUser({
    email: "reviewer@example.com",
    name: "Riley Reviewer",
    password: "password123",
    role: Role.REVIEWER
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
