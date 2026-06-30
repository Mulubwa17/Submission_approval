import { Module } from "@nestjs/common";
import { WorkflowModule } from "../workflow/workflow.module";
import { ApplicationsController } from "./applications.controller";
import { ApplicationsService } from "./applications.service";

@Module({
  controllers: [ApplicationsController],
  imports: [WorkflowModule],
  providers: [ApplicationsService]
})
export class ApplicationsModule {}
