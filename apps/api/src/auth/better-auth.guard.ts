import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException
} from "@nestjs/common";
import { Role } from "@prisma/client";
import type { Request } from "express";
import { BetterAuthService } from "./better-auth.service";
import type { RequestUser } from "./request-user";

type AuthenticatedRequest = Request & { user?: RequestUser };

function toRole(value: unknown): Role {
  return value === Role.REVIEWER ? Role.REVIEWER : Role.APPLICANT;
}

@Injectable()
export class BetterAuthGuard implements CanActivate {
  constructor(private readonly auth: BetterAuthService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const [{ fromNodeHeaders }, auth] = await Promise.all([
      import("better-auth/node"),
      this.auth.get()
    ]);

    const session = await auth.api.getSession({
      headers: fromNodeHeaders(request.headers)
    });

    if (!session?.user?.id) {
      throw new UnauthorizedException({
        code: "UNAUTHENTICATED",
        message: "You must be signed in to access this resource."
      });
    }

    request.user = {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      role: toRole(session.user.role)
    };

    return true;
  }
}
