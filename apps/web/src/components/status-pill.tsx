import type { ApplicationStatus } from "@submission/shared";

export function StatusPill({ status }: { status: ApplicationStatus }) {
  return <span className={`status status-${status.toLowerCase()}`}>{status}</span>;
}
