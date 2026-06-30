"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { ApplicationStatus } from "@submission/shared";
import { applicationStatuses } from "@submission/shared";
import { AppShell } from "@/components/app-shell";
import { LoadingState } from "@/components/loading-state";
import { SessionGate } from "@/components/session-gate";
import { StatusPill } from "@/components/status-pill";
import { apiFetch, type ApiApplication } from "@/lib/api";

export default function ReviewerApplicationsPage() {
  return (
    <SessionGate role="REVIEWER">
      {(user) => (
        <AppShell user={user}>
          <ReviewerQueue />
        </AppShell>
      )}
    </SessionGate>
  );
}

function ReviewerQueue() {
  const [status, setStatus] = useState<ApplicationStatus | "">("");
  const [applications, setApplications] = useState<ApiApplication[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const submittedCount = applications.filter(
    (application) => application.status === "SUBMITTED"
  ).length;
  const inReviewCount = applications.filter(
    (application) => application.status === "UNDER_REVIEW"
  ).length;

  useEffect(() => {
    setIsLoading(true);
    const query = status ? `?status=${status}` : "";
    apiFetch<ApiApplication[]>(`/review/applications${query}`)
      .then(setApplications)
      .catch((loadError: unknown) =>
        setError(loadError instanceof Error ? loadError.message : "Unable to load.")
      )
      .finally(() => setIsLoading(false));
  }, [status]);

  return (
    <section className="grid">
      <div className="page-hero">
        <div>
          <p className="eyebrow">Reviewer queue</p>
          <h1>Review submitted requests and record decisions.</h1>
          <p className="muted">
            Filter by status, open submitted applications, and keep decisions
            tied to an audit trail.
          </p>
        </div>
        <div className="panel form">
          <label>
            Status filter
            <select
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as ApplicationStatus | "")
              }
            >
              <option value="">All statuses</option>
              {applicationStatuses.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="stats-row" aria-label="Review queue summary">
        <div className="metric">
          <strong>{applications.length}</strong>
          <p className="muted">total applications</p>
        </div>
        <div className="metric">
          <strong>{submittedCount}</strong>
          <p className="muted">submitted</p>
        </div>
        <div className="metric">
          <strong>{inReviewCount}</strong>
          <p className="muted">under review</p>
        </div>
      </div>

      <div className="panel table-panel">
        {isLoading ? (
          <LoadingState label="Loading queue" lines={3} />
        ) : null}
        {error ? <p className="error">{error}</p> : null}
        {!isLoading && !error && applications.length === 0 ? (
          <div className="empty-state">
            <strong>No matches</strong>
            <p>No applications match this filter.</p>
          </div>
        ) : null}
        {applications.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Applicant</th>
                <th>Status</th>
                <th>Updated</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((application) => (
                <tr key={application.id}>
                  <td>
                    <span className="table-title">
                      <strong>{application.title}</strong>
                      <span className="helper">Open review detail to decide</span>
                    </span>
                  </td>
                  <td>{application.owner?.name ?? "Unknown"}</td>
                  <td>
                    <StatusPill status={application.status} />
                  </td>
                  <td>{new Date(application.updatedAt).toLocaleString()}</td>
                  <td>
                    <Link
                      href={`/reviewer/applications/${application.id}`}
                      className="button secondary table-action"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </div>
    </section>
  );
}
