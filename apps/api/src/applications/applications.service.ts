import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { ApplicationStatus, Prisma, Role } from "@prisma/client";
import type { RequestUser } from "../auth/request-user";
import { PrismaService } from "../prisma/prisma.service";
import { WorkflowService } from "../workflow/workflow.service";
import { CreateApplicationDto, UpdateApplicationDto } from "./dto";

@Injectable()
export class ApplicationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workflow: WorkflowService
  ) {}

  create(owner: RequestUser, dto: CreateApplicationDto) {
    if (owner.role !== Role.APPLICANT) {
      throw new ForbiddenException({
        code: "APPLICANTS_ONLY",
        message: "Only applicants can create applications."
      });
    }

    return this.prisma.application.create({
      data: {
        amount: dto.amount ? new Prisma.Decimal(dto.amount) : null,
        category: dto.category,
        description: dto.description,
        ownerId: owner.id,
        title: dto.title
      }
    });
  }

  listMine(owner: RequestUser) {
    return this.prisma.application.findMany({
      orderBy: { updatedAt: "desc" },
      where: { ownerId: owner.id }
    });
  }

  listQueue(status?: ApplicationStatus) {
    return this.prisma.application.findMany({
      include: {
        owner: {
          select: { email: true, name: true }
        }
      },
      orderBy: { updatedAt: "desc" },
      where: status ? { status } : {}
    });
  }

  async getForUser(user: RequestUser, id: string) {
    const application = await this.prisma.application.findUnique({
      include: {
        auditLogs: {
          include: {
            actor: {
              select: { email: true, name: true, role: true }
            }
          },
          orderBy: { createdAt: "asc" }
        },
        owner: {
          select: { email: true, id: true, name: true }
        }
      },
      where: { id }
    });

    if (!application) {
      throw new NotFoundException({
        code: "APPLICATION_NOT_FOUND",
        message: "Application was not found."
      });
    }

    if (user.role === Role.APPLICANT && application.ownerId !== user.id) {
      throw new ForbiddenException({
        code: "OWNER_ONLY",
        message: "Applicants can only view their own applications."
      });
    }

    return application;
  }

  async updateDraft(user: RequestUser, id: string, dto: UpdateApplicationDto) {
    const application = await this.getForUser(user, id);

    if (application.ownerId !== user.id) {
      throw new ForbiddenException({
        code: "OWNER_ONLY",
        message: "Only the application owner can edit this draft."
      });
    }

    if (application.status !== ApplicationStatus.DRAFT) {
      throw new BadRequestException({
        code: "DRAFT_ONLY",
        message: "Applications can only be edited while they are drafts."
      });
    }

    return this.prisma.application.update({
      data: {
        amount: dto.amount ? new Prisma.Decimal(dto.amount) : null,
        category: dto.category,
        description: dto.description,
        title: dto.title
      },
      where: { id }
    });
  }

  submit(user: RequestUser, id: string) {
    return this.transition(user, id, ApplicationStatus.SUBMITTED);
  }

  reopenDraft(user: RequestUser, id: string) {
    return this.transition(user, id, ApplicationStatus.DRAFT, "Reopened for changes");
  }

  startReview(user: RequestUser, id: string) {
    return this.transition(user, id, ApplicationStatus.UNDER_REVIEW);
  }

  approve(user: RequestUser, id: string, comment?: string) {
    return this.transition(user, id, ApplicationStatus.APPROVED, comment);
  }

  reject(user: RequestUser, id: string, comment?: string) {
    return this.transition(user, id, ApplicationStatus.REJECTED, comment);
  }

  returnForChanges(user: RequestUser, id: string, comment?: string) {
    return this.transition(user, id, ApplicationStatus.RETURNED, comment);
  }

  private async transition(
    user: RequestUser,
    id: string,
    toStatus: ApplicationStatus,
    comment?: string
  ) {
    return this.prisma.$transaction(async (tx) => {
      const application = await tx.application.findUnique({ where: { id } });

      if (!application) {
        throw new NotFoundException({
          code: "APPLICATION_NOT_FOUND",
          message: "Application was not found."
        });
      }

      this.workflow.assertTransition({
        actorId: user.id,
        actorRole: user.role,
        comment,
        from: application.status,
        ownerId: application.ownerId,
        to: toStatus
      });

      // Guard against concurrent transitions: only update if the row is still
      // in the status we validated against. A racing actor that already moved
      // it leaves zero rows matched, so we surface a conflict instead of
      // silently recording a second transition from a stale state.
      const result = await tx.application.updateMany({
        data: { status: toStatus },
        where: { id, status: application.status }
      });

      if (result.count === 0) {
        throw new ConflictException({
          code: "CONCURRENT_UPDATE",
          message: "This application was updated by someone else. Reload and try again."
        });
      }

      await tx.applicationAuditLog.create({
        data: {
          actorId: user.id,
          applicationId: id,
          comment,
          fromStatus: application.status,
          toStatus
        }
      });

      return tx.application.findUniqueOrThrow({ where: { id } });
    });
  }
}
