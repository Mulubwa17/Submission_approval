import { Module } from "@nestjs/common";
import { WorkflowService } from "./workflow.service";

@Module({
  exports: [WorkflowService],
  providers: [WorkflowService]
})
export class WorkflowModule {}
