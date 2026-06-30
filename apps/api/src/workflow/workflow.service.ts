import { BadRequestException, ForbiddenException, Injectable } from "@nestjs/common";
import { ApplicationStatus, Role } from "@prisma/client";

type TransitionInput = {
  actorId: string;
  actorRole: Role;
  ownerId: string;
  from: ApplicationStatus;
  to: ApplicationStatus;
  comment?: string;
};

const reviewerStatuses = new Set<ApplicationStatus>([
  ApplicationStatus.SUBMITTED,
  ApplicationStatus.UNDER_REVIEW
]);

@Injectable()
export class WorkflowService {
  assertTransition(input: TransitionInput) {
    if (input.actorRole === Role.APPLICANT) {
      this.assertApplicantTransition(input);
      return;
    }

    if (input.actorRole === Role.REVIEWER) {
      this.assertReviewerTransition(input);
      return;
    }

    throw new ForbiddenException({
      code: "ROLE_NOT_ALLOWED",
      message: "This role cannot transition applications."
    });
  }

  private assertApplicantTransition(input: TransitionInput) {
    if (input.actorId !== input.ownerId) {
      throw new ForbiddenException({
        code: "OWNER_ONLY",
        message: "Only the application owner can perform this action."
      });
    }

    const legal =
      (input.from === ApplicationStatus.DRAFT &&
        input.to === ApplicationStatus.SUBMITTED) ||
      (input.from === ApplicationStatus.RETURNED &&
        input.to === ApplicationStatus.DRAFT);

    if (!legal) {
      throw new BadRequestException({
        code: "ILLEGAL_TRANSITION",
        message: `Applicants cannot transition ${input.from} to ${input.to}.`
      });
    }
  }

  private assertReviewerTransition(input: TransitionInput) {
    if (!reviewerStatuses.has(input.from)) {
      throw new BadRequestException({
        code: "ILLEGAL_TRANSITION",
        message: `Reviewers cannot transition applications from ${input.from}.`
      });
    }

    const legalTargets = new Set<ApplicationStatus>([
      ApplicationStatus.UNDER_REVIEW,
      ApplicationStatus.APPROVED,
      ApplicationStatus.REJECTED,
      ApplicationStatus.RETURNED
    ]);

    if (!legalTargets.has(input.to) || input.from === input.to) {
      throw new BadRequestException({
        code: "ILLEGAL_TRANSITION",
        message: `Reviewers cannot transition ${input.from} to ${input.to}.`
      });
    }

    const commentRequired =
      input.to === ApplicationStatus.REJECTED ||
      input.to === ApplicationStatus.RETURNED;

    if (commentRequired && !input.comment?.trim()) {
      throw new BadRequestException({
        code: "COMMENT_REQUIRED",
        message: "Rejecting or returning an application requires a comment."
      });
    }
  }
}
