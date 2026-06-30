import { All, Controller, Req, Res } from "@nestjs/common";
import type { Request, Response } from "express";
import { getBetterAuth } from "./better-auth";

@Controller("auth")
export class AuthProxyController {
  @All("*path")
  async handleAuth(@Req() request: Request, @Res() response: Response) {
    const [{ toNodeHandler }, auth] = await Promise.all([
      import("better-auth/node"),
      getBetterAuth()
    ]);

    return toNodeHandler(auth)(request, response);
  }
}
