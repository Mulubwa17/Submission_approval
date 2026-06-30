import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards
} from "@nestjs/common";
import { ApplicationStatus, Role } from "@prisma/client";
import { BetterAuthGuard } from "../auth/better-auth.guard";
import type { AuthenticatedRequest } from "../common/authenticated-request";
import { ApplicationsService } from "./applications.service";
import {
  CreateApplicationDto,
  TransitionCommentDto,
  UpdateApplicationDto
} from "./dto";

@UseGuards(BetterAuthGuard)
@Controller()
export class ApplicationsController {
  constructor(private readonly applications: ApplicationsService) {}

  @Get("applications/me")
  listMine(@Req() request: AuthenticatedRequest) {
    return this.applications.listMine(request.user);
  }

  @Post("applications")
  create(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreateApplicationDto
  ) {
    return this.applications.create(request.user, dto);
  }

  @Get("applications/:id")
  get(@Req() request: AuthenticatedRequest, @Param("id") id: string) {
    return this.applications.getForUser(request.user, id);
  }

  @Patch("applications/:id")
  update(
    @Req() request: AuthenticatedRequest,
    @Param("id") id: string,
    @Body() dto: UpdateApplicationDto
  ) {
    return this.applications.updateDraft(request.user, id, dto);
  }

  @Post("applications/:id/submit")
  submit(@Req() request: AuthenticatedRequest, @Param("id") id: string) {
    return this.applications.submit(request.user, id);
  }

  @Post("applications/:id/reopen")
  reopen(@Req() request: AuthenticatedRequest, @Param("id") id: string) {
    return this.applications.reopenDraft(request.user, id);
  }

  @Get("review/applications")
  listQueue(
    @Req() request: AuthenticatedRequest,
    @Query("status") status?: ApplicationStatus
  ) {
    this.assertReviewer(request.user.role);
    return this.applications.listQueue(status);
  }

  @Post("review/applications/:id/start-review")
  startReview(@Req() request: AuthenticatedRequest, @Param("id") id: string) {
    this.assertReviewer(request.user.role);
    return this.applications.startReview(request.user, id);
  }

  @Post("review/applications/:id/approve")
  approve(
    @Req() request: AuthenticatedRequest,
    @Param("id") id: string,
    @Body() dto: TransitionCommentDto
  ) {
    this.assertReviewer(request.user.role);
    return this.applications.approve(request.user, id, dto.comment);
  }

  @Post("review/applications/:id/reject")
  reject(
    @Req() request: AuthenticatedRequest,
    @Param("id") id: string,
    @Body() dto: TransitionCommentDto
  ) {
    this.assertReviewer(request.user.role);
    return this.applications.reject(request.user, id, dto.comment);
  }

  @Post("review/applications/:id/return")
  returnForChanges(
    @Req() request: AuthenticatedRequest,
    @Param("id") id: string,
    @Body() dto: TransitionCommentDto
  ) {
    this.assertReviewer(request.user.role);
    return this.applications.returnForChanges(request.user, id, dto.comment);
  }

  private assertReviewer(role: Role) {
    if (role !== Role.REVIEWER) {
      throw new ForbiddenException({
        code: "REVIEWER_ONLY",
        message: "Only reviewers can perform this action."
      });
    }
  }
}
