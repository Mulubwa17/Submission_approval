import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ApplicationsModule } from "./applications/applications.module";
import { AuthModule } from "./auth/auth.module";
import { PrismaModule } from "./prisma/prisma.module";
import { WorkflowModule } from "./workflow/workflow.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ["../../.env", ".env"],
      isGlobal: true
    }),
    PrismaModule,
    AuthModule,
    WorkflowModule,
    ApplicationsModule
  ]
})
export class AppModule {}
