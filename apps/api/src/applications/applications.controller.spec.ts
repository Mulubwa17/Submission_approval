import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { BetterAuthGuard } from "../auth/better-auth.guard";
import { ApplicationsController } from "./applications.controller";
import { ApplicationsService } from "./applications.service";

describe("ApplicationsController authorization", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ApplicationsController],
      providers: [
        {
          provide: ApplicationsService,
          useValue: {
            approve: jest.fn()
          }
        }
      ]
    })
      .overrideGuard(BetterAuthGuard)
      .useValue({
        canActivate: (context: any) => {
          const request = context.switchToHttp().getRequest();
          request.user = {
            email: "applicant@example.com",
            id: "user-1",
            name: "Alex Applicant",
            role: "APPLICANT"
          };
          return true;
        }
      })
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("returns 403 when an applicant calls a reviewer transition endpoint", async () => {
    await request(app.getHttpServer())
      .post("/review/applications/app-1/approve")
      .send({})
      .expect(403);
  });
});
