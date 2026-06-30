import { Module } from "@nestjs/common";
import { AuthProxyController } from "./auth-proxy.controller";
import { BetterAuthGuard } from "./better-auth.guard";

@Module({
  controllers: [AuthProxyController],
  exports: [BetterAuthGuard],
  providers: [BetterAuthGuard]
})
export class AuthModule {}
