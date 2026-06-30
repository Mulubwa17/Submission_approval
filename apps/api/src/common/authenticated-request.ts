import type { Request } from "express";
import type { RequestUser } from "../auth/request-user";

export type AuthenticatedRequest = Request & {
  user: RequestUser;
};
