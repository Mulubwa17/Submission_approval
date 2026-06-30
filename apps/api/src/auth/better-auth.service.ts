import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { BetterAuthInstance, createBetterAuth } from "./better-auth";

@Injectable()
export class BetterAuthService {
  private authPromise?: Promise<BetterAuthInstance>;

  constructor(private readonly prisma: PrismaService) {}

  get() {
    if (!this.authPromise) {
      this.authPromise = createBetterAuth(this.prisma);
    }

    return this.authPromise;
  }
}
