import { All, Controller, Req, Res } from "@nestjs/common";
import type { Request, Response } from "express";
import { BetterAuthService } from "./better-auth.service";

@Controller("auth")
export class AuthProxyController {
  constructor(private readonly auth: BetterAuthService) {}

  @All("*path")
  async handleAuth(@Req() request: Request, @Res() response: Response) {
    const [{ toNodeHandler }, auth] = await Promise.all([
      import("better-auth/node"),
      this.auth.get()
    ]);

    return toNodeHandler(auth)(request, response);
  }
}
