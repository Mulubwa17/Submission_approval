import {
  ApplicationCategory,
  ApplicationStatus,
  PrismaClient,
  Role
} from "@prisma/client";
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

type AuditStep = {
  fromStatus: ApplicationStatus | null;
  toStatus: ApplicationStatus;
  actor: "applicant" | "reviewer";
  comment?: string;
};

type SampleApplication = {
  id: string;
  title: string;
  category: ApplicationCategory;
  description: string;
  amount?: string;
  status: ApplicationStatus;
  steps: AuditStep[];
};

// Fixed ids keep the seed idempotent: re-running replaces these rows instead
// of creating duplicates. Each sample ends in a distinct status so the
// applicant list shows every status and the reviewer queue/filters have data.
const SAMPLE_APPLICATIONS: SampleApplication[] = [
  {
    id: "sample-draft",
    title: "Office supplies restock",
    category: ApplicationCategory.PROCUREMENT,
    description: "Paper, toner, and stationery for the third-floor team.",
    amount: "420.00",
    status: ApplicationStatus.DRAFT,
    steps: []
  },
  {
    id: "sample-submitted",
    title: "Team offsite travel booking",
    category: ApplicationCategory.TRAVEL,
    description: "Flights and lodging for the quarterly planning offsite.",
    amount: "3650.00",
    status: ApplicationStatus.SUBMITTED,
    steps: [
      { fromStatus: ApplicationStatus.DRAFT, toStatus: ApplicationStatus.SUBMITTED, actor: "applicant" }
    ]
  },
  {
    id: "sample-under-review",
    title: "New laptops for engineering",
    category: ApplicationCategory.PROCUREMENT,
    description: "Replacement laptops for four engineers on aging hardware.",
    amount: "9200.00",
    status: ApplicationStatus.UNDER_REVIEW,
    steps: [
      { fromStatus: ApplicationStatus.DRAFT, toStatus: ApplicationStatus.SUBMITTED, actor: "applicant" },
      { fromStatus: ApplicationStatus.SUBMITTED, toStatus: ApplicationStatus.UNDER_REVIEW, actor: "reviewer" }
    ]
  },
  {
    id: "sample-approved",
    title: "Annual software licenses",
    category: ApplicationCategory.FINANCE,
    description: "Renewal of design and analytics tooling for the year.",
    amount: "12500.00",
    status: ApplicationStatus.APPROVED,
    steps: [
      { fromStatus: ApplicationStatus.DRAFT, toStatus: ApplicationStatus.SUBMITTED, actor: "applicant" },
      { fromStatus: ApplicationStatus.SUBMITTED, toStatus: ApplicationStatus.UNDER_REVIEW, actor: "reviewer" },
      {
        fromStatus: ApplicationStatus.UNDER_REVIEW,
        toStatus: ApplicationStatus.APPROVED,
        actor: "reviewer",
        comment: "Within budget and clearly justified. Approved."
      }
    ]
  },
  {
    id: "sample-rejected",
    title: "Premium conference sponsorship",
    category: ApplicationCategory.OTHER,
    description: "Gold-tier sponsorship of an external industry conference.",
    amount: "18000.00",
    status: ApplicationStatus.REJECTED,
    steps: [
      { fromStatus: ApplicationStatus.DRAFT, toStatus: ApplicationStatus.SUBMITTED, actor: "applicant" },
      { fromStatus: ApplicationStatus.SUBMITTED, toStatus: ApplicationStatus.UNDER_REVIEW, actor: "reviewer" },
      {
        fromStatus: ApplicationStatus.UNDER_REVIEW,
        toStatus: ApplicationStatus.REJECTED,
        actor: "reviewer",
        comment: "Outside this quarter's marketing budget. Rejected."
      }
    ]
  },
  {
    id: "sample-returned",
    title: "Contractor onboarding budget",
    category: ApplicationCategory.HR,
    description: "Budget to onboard two short-term contractors next month.",
    amount: "7400.00",
    status: ApplicationStatus.RETURNED,
    steps: [
      { fromStatus: ApplicationStatus.DRAFT, toStatus: ApplicationStatus.SUBMITTED, actor: "applicant" },
      { fromStatus: ApplicationStatus.SUBMITTED, toStatus: ApplicationStatus.UNDER_REVIEW, actor: "reviewer" },
      {
        fromStatus: ApplicationStatus.UNDER_REVIEW,
        toStatus: ApplicationStatus.RETURNED,
        actor: "reviewer",
        comment: "Please itemize the daily rate and expected duration, then resubmit."
      }
    ]
  }
];

async function seedSampleApplications(applicantId: string, reviewerId: string) {
  const sampleIds = SAMPLE_APPLICATIONS.map((sample) => sample.id);
  const actorId = { applicant: applicantId, reviewer: reviewerId } as const;

  // Replace any previous run's samples so the seed stays idempotent.
  await prisma.applicationAuditLog.deleteMany({
    where: { applicationId: { in: sampleIds } }
  });
  await prisma.application.deleteMany({ where: { id: { in: sampleIds } } });

  // Stagger timestamps so the audit trail and lists read chronologically.
  const baseTime = Date.now() - SAMPLE_APPLICATIONS.length * 60 * 60 * 1000;
  let cursor = baseTime;
  const nextTime = () => {
    cursor += 5 * 60 * 1000;
    return new Date(cursor);
  };

  for (const sample of SAMPLE_APPLICATIONS) {
    const createdAt = nextTime();
    const auditLogs = sample.steps.map((step) => ({
      fromStatus: step.fromStatus,
      toStatus: step.toStatus,
      comment: step.comment ?? null,
      actorId: actorId[step.actor],
      createdAt: nextTime()
    }));
    const updatedAt =
      auditLogs.length > 0 ? auditLogs[auditLogs.length - 1].createdAt : createdAt;

    await prisma.application.create({
      data: {
        id: sample.id,
        ownerId: applicantId,
        title: sample.title,
        category: sample.category,
        description: sample.description,
        amount: sample.amount,
        status: sample.status,
        createdAt,
        updatedAt,
        auditLogs: { create: auditLogs }
      }
    });
  }
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

  const applicant = await prisma.user.findUniqueOrThrow({
    where: { email: "applicant@example.com" }
  });
  const reviewer = await prisma.user.findUniqueOrThrow({
    where: { email: "reviewer@example.com" }
  });

  await seedSampleApplications(applicant.id, reviewer.id);
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
