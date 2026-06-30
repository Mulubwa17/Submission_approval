import { Module } from "@nestjs/common";
import { AuthProxyController } from "./auth-proxy.controller";
import { BetterAuthGuard } from "./better-auth.guard";
import { BetterAuthService } from "./better-auth.service";

@Module({
  controllers: [AuthProxyController],
  exports: [BetterAuthGuard, BetterAuthService],
  providers: [BetterAuthGuard, BetterAuthService]
})
export class AuthModule {}
