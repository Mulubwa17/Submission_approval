"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { AuditTrail } from "@/components/audit-trail";
import { LoadingState } from "@/components/loading-state";
import { SessionGate } from "@/components/session-gate";
import { StatusPill } from "@/components/status-pill";
import {
  apiFetch,
  transitionApplication,
  type ApiApplication
} from "@/lib/api";

export default function ReviewerApplicationDetailPage() {
  return (
    <SessionGate role="REVIEWER">
      {(user) => (
        <AppShell user={user}>
          <ReviewerDetail />
        </AppShell>
      )}
    </SessionGate>
  );
}

function ReviewerDetail() {
  const params = useParams<{ id: string }>();
  const [application, setApplication] = useState<ApiApplication | null>(null);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [success, setSuccess] = useState<string | null>(null);
  const canReview =
    application?.status === "SUBMITTED" || application?.status === "UNDER_REVIEW";

  const loadApplication = useCallback(() => {
    return apiFetch<ApiApplication>(`/applications/${params.id}`)
      .then(setApplication)
      .catch((loadError: unknown) =>
        setError(loadError instanceof Error ? loadError.message : "Unable to load.")
      );
  }, [params.id]);

  useEffect(() => {
    loadApplication().finally(() => setIsLoading(false));
  }, [loadApplication]);

  async function handleTransition(action: "start-review" | "approve" | "reject" | "return") {
    setError(null);
    setSuccess(null);

    try {
      await transitionApplication(
        `/review/applications/${params.id}/${action}`,
        comment
      );
      // Refetch so both the status and the audit trail reflect the change.
      await loadApplication();
      setSuccess("Status updated.");
      setComment("");
    } catch (transitionError) {
      setError(
        transitionError instanceof Error
          ? transitionError.message
          : "Unable to update status."
      );
    }
  }

  if (isLoading) {
    return (
      <section className="panel">
        <LoadingState label="Loading application" />
      </section>
    );
  }

  if (!application) {
    return <section className="panel error">{error ?? "Application not found."}</section>;
  }

  return (
    <section className="detail-layout">
      <article className="panel document-panel">
        <div className="row">
          <div>
            <p className="eyebrow">Application detail</p>
            <h1>{application.title}</h1>
            <p className="muted">
              {application.owner?.name} - {application.category}
            </p>
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

        <div className="form review-actions">
          <div>
            <h2>Review options</h2>
            <p className="muted">
              Decisions are available after opening a submitted application.
            </p>
          </div>

          {canReview ? (
            <>
              <label>
                Decision comment
                <textarea
                  rows={4}
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder="Required for reject or return."
                />
                <span className="helper">Required for reject or return.</span>
              </label>

              <div className="actions">
                <button
                  type="button"
                  disabled={application.status !== "SUBMITTED"}
                  onClick={() => handleTransition("start-review")}
                >
                  Start review
                </button>
                <button type="button" onClick={() => handleTransition("approve")}>
                  Approve
                </button>
                <button
                  type="button"
                  className="ghost"
                  onClick={() => handleTransition("return")}
                >
                  Return
                </button>
                <button
                  type="button"
                  className="danger"
                  onClick={() => handleTransition("reject")}
                >
                  Reject
                </button>
              </div>
            </>
          ) : (
            <p className="muted">
              This application is {application.status.toLowerCase()} and has no
              active review actions.
            </p>
          )}
        </div>

        {error ? <p className="error">{error}</p> : null}
        {success ? <p className="success">{success}</p> : null}
      </article>

      <AuditTrail entries={application.auditLogs} />
    </section>
  );
}
