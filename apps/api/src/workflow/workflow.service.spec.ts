import { BadRequestException, ForbiddenException } from "@nestjs/common";
import { ApplicationStatus, Role } from "@prisma/client";
import { WorkflowService } from "./workflow.service";

describe("WorkflowService", () => {
  const service = new WorkflowService();

  it("allows an owner applicant to submit a draft", () => {
    expect(() =>
      service.assertTransition({
        actorId: "user-1",
        actorRole: Role.APPLICANT,
        ownerId: "user-1",
        from: ApplicationStatus.DRAFT,
        to: ApplicationStatus.SUBMITTED
      })
    ).not.toThrow();
  });

  it("blocks applicants from approving their own application", () => {
    expect(() =>
      service.assertTransition({
        actorId: "user-1",
        actorRole: Role.APPLICANT,
        ownerId: "user-1",
        from: ApplicationStatus.SUBMITTED,
        to: ApplicationStatus.APPROVED
      })
    ).toThrow(BadRequestException);
  });

  it("blocks non-owners from applicant transitions", () => {
    expect(() =>
      service.assertTransition({
        actorId: "user-2",
        actorRole: Role.APPLICANT,
        ownerId: "user-1",
        from: ApplicationStatus.DRAFT,
        to: ApplicationStatus.SUBMITTED
      })
    ).toThrow(ForbiddenException);
  });

  it("allows a reviewer to start review from submitted", () => {
    expect(() =>
      service.assertTransition({
        actorId: "reviewer-1",
        actorRole: Role.REVIEWER,
        ownerId: "user-1",
        from: ApplicationStatus.SUBMITTED,
        to: ApplicationStatus.UNDER_REVIEW
      })
    ).not.toThrow();
  });

  it("requires a comment when rejecting", () => {
    expect(() =>
      service.assertTransition({
        actorId: "reviewer-1",
        actorRole: Role.REVIEWER,
        ownerId: "user-1",
        from: ApplicationStatus.UNDER_REVIEW,
        to: ApplicationStatus.REJECTED
      })
    ).toThrow(BadRequestException);
  });

  it("requires a comment when returning for changes", () => {
    expect(() =>
      service.assertTransition({
        actorId: "reviewer-1",
        actorRole: Role.REVIEWER,
        ownerId: "user-1",
        from: ApplicationStatus.SUBMITTED,
        to: ApplicationStatus.RETURNED
      })
    ).toThrow(BadRequestException);
  });

  it("allows a returned application to be reopened as draft by the owner", () => {
    expect(() =>
      service.assertTransition({
        actorId: "user-1",
        actorRole: Role.APPLICANT,
        ownerId: "user-1",
        from: ApplicationStatus.RETURNED,
        to: ApplicationStatus.DRAFT
      })
    ).not.toThrow();
  });
});
