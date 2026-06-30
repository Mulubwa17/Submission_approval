"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { SessionGate } from "@/components/session-gate";
import { StatusPill } from "@/components/status-pill";
import { apiFetch, type ApiApplication } from "@/lib/api";

export default function ApplicantApplicationsPage() {
  return (
    <SessionGate role="APPLICANT">
      {(user) => (
        <AppShell user={user}>
          <ApplicantApplications />
        </AppShell>
      )}
    </SessionGate>
  );
}

function ApplicantApplications() {
  const [applications, setApplications] = useState<ApiApplication[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const draftCount = applications.filter(
    (application) =>
      application.status === "DRAFT" || application.status === "RETURNED"
  ).length;
  const approvedCount = applications.filter(
    (application) => application.status === "APPROVED"
  ).length;

  useEffect(() => {
    apiFetch<ApiApplication[]>("/applications/me")
      .then(setApplications)
      .catch((loadError: unknown) =>
        setError(loadError instanceof Error ? loadError.message : "Unable to load.")
      )
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <section className="grid">
      <div className="page-hero">
        <div>
          <p className="eyebrow">My applications</p>
          <h1>Create drafts and track decisions.</h1>
          <p className="muted">
            Create drafts, submit requests, and follow each application through
            review.
          </p>
        </div>
      </div>

      <div className="stats-row" aria-label="Application summary">
        <div className="metric">
          <strong>{applications.length}</strong>
          <p className="muted">total requests</p>
        </div>
        <div className="metric">
          <strong>{draftCount}</strong>
          <p className="muted">needs action</p>
        </div>
        <div className="metric">
          <strong>{approvedCount}</strong>
          <p className="muted">approved</p>
        </div>
      </div>

      <div className="table-heading-row">
        <h2>Applications</h2>
        <Link href="/applicant/applications/new" className="button">
          New submission
        </Link>
      </div>

      <div className="panel table-panel">
        {isLoading ? (
          <div className="loading-state" aria-label="Loading applications">
            <div className="loading-line" />
            <div className="loading-line short" />
            <div className="loading-line" />
          </div>
        ) : null}
        {error ? <p className="error">{error}</p> : null}
        {!isLoading && !error && applications.length === 0 ? (
          <div className="empty-state">
            <strong>No applications yet</strong>
            <p>Create a draft to start the workflow.</p>
          </div>
        ) : null}
        {applications.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Status</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((application) => (
                <tr key={application.id}>
                  <td>
                    <Link
                      href={`/applicant/applications/${application.id}`}
                      className="table-title"
                    >
                      <strong>{application.title}</strong>
                      <span className="helper">Open application detail</span>
                    </Link>
                  </td>
                  <td>{application.category}</td>
                  <td>
                    <StatusPill status={application.status} />
                  </td>
                  <td>{new Date(application.updatedAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </div>
    </section>
  );
}
