import type { Role } from "@prisma/client";

export type RequestUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
};
