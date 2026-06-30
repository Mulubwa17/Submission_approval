import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException
} from "@nestjs/common";
import type { Request } from "express";
import { getBetterAuth } from "./better-auth";
import type { RequestUser } from "./request-user";

type AuthenticatedRequest = Request & { user?: RequestUser };

@Injectable()
export class BetterAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const [{ fromNodeHeaders }, auth] = await Promise.all([
      import("better-auth/node"),
      getBetterAuth()
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
      role: session.user.role
    };

    return true;
  }
}
