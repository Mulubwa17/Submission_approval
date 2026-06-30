"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { SessionGate } from "@/components/session-gate";
import { StatusPill } from "@/components/status-pill";
import {
  apiFetch,
  transitionApplication,
  type ApiApplication
} from "@/lib/api";

export default function ApplicantApplicationDetailPage() {
  return (
    <SessionGate role="APPLICANT">
      {(user) => (
        <AppShell user={user}>
          <ApplicantDetail />
        </AppShell>
      )}
    </SessionGate>
  );
}

function ApplicantDetail() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [application, setApplication] = useState<ApiApplication | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<ApiApplication>(`/applications/${params.id}`)
      .then(setApplication)
      .catch((loadError: unknown) =>
        setError(loadError instanceof Error ? loadError.message : "Unable to load.")
      )
      .finally(() => setIsLoading(false));
  }, [params.id]);

  async function runAction(path: string) {
    setActionError(null);
    try {
      const updated = await transitionApplication(path);
      setApplication((current) =>
        current ? { ...current, status: updated.status } : updated
      );
      router.refresh();
    } catch (transitionError) {
      setActionError(
        transitionError instanceof Error
          ? transitionError.message
          : "Unable to update status."
      );
    }
  }

  if (isLoading) {
    return (
      <section className="panel loading-state" aria-label="Loading application">
        <div className="loading-line" />
        <div className="loading-line short" />
      </section>
    );
  }

  if (error || !application) {
    return <section className="panel error">{error ?? "Application not found."}</section>;
  }

  return (
    <section className="detail-layout">
      <article className="panel document-panel">
        <div className="row">
          <div>
            <p className="eyebrow">Application detail</p>
            <h1>{application.title}</h1>
            <p className="muted">{application.category}</p>
          </div>
          <StatusPill status={application.status} />
        </div>

        <div className="document-row">
          <span className="document-label">Description</span>
          <p>{application.description || "No description provided."}</p>
        </div>
        <div className="document-row">
          <span className="document-label">Amount</span>
          <p>{application.amount ?? "Not provided"}</p>
        </div>

        <div className="actions">
          {application.status === "DRAFT" ? (
            <>
              <Link
                href={`/applicant/applications/${application.id}/edit`}
                className="button secondary"
              >
                Edit draft
              </Link>
              <button
                type="button"
                onClick={() => runAction(`/applications/${application.id}/submit`)}
              >
                Submit
              </button>
            </>
          ) : null}
          {application.status === "RETURNED" ? (
            <button
              type="button"
              onClick={() => runAction(`/applications/${application.id}/reopen`)}
            >
              Reopen as draft
            </button>
          ) : null}
        </div>

        {actionError ? <p className="error">{actionError}</p> : null}
      </article>

      <aside className="panel">
        <h2>Audit trail</h2>
        {application.auditLogs?.length ? (
          <div className="timeline">
            {application.auditLogs.map((entry) => (
              <div key={entry.id} className="timeline-item">
                <strong>
                  {entry.fromStatus ?? "CREATED"} to {entry.toStatus}
                </strong>
                <p className="muted">
                  {entry.actor.name} on {new Date(entry.createdAt).toLocaleString()}
                </p>
                {entry.comment ? <p>{entry.comment}</p> : null}
              </div>
            ))}
          </div>
        ) : (
          <p className="muted">No transitions recorded yet.</p>
        )}
      </aside>
    </section>
  );
}
