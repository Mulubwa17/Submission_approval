"use client";

import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { ApplicationForm } from "@/components/application-form";
import { SessionGate } from "@/components/session-gate";
import { createApplication, type ApplicationPayload } from "@/lib/api";

export default function NewApplicationPage() {
  const router = useRouter();

  async function handleSubmit(payload: ApplicationPayload) {
    const application = await createApplication(payload);
    router.replace(`/applicant/applications/${application.id}`);
  }

  return (
    <SessionGate role="APPLICANT">
      {(user) => (
        <AppShell user={user}>
          <section className="form-layout">
            <div className="page-copy">
              <p className="eyebrow">New application</p>
              <h1>Create a request reviewers can act on.</h1>
              <p className="muted">
                Saved requests start as drafts, so you can prepare the request
                before submitting it for review.
              </p>
              <div className="panel">
                <h2>Draft workflow</h2>
                <div className="timeline">
                  <div className="timeline-item">
                    <strong>Describe the request</strong>
                    <p className="muted">Add the title, category, amount, and context.</p>
                  </div>
                  <div className="timeline-item">
                    <strong>Save as draft</strong>
                    <p className="muted">Review your details before submission.</p>
                  </div>
                  <div className="timeline-item">
                    <strong>Submit when ready</strong>
                    <p className="muted">Reviewers can then record a decision.</p>
                  </div>
                </div>
              </div>
            </div>
            <ApplicationForm onSubmit={handleSubmit} submitLabel="Save draft" />
          </section>
        </AppShell>
      )}
    </SessionGate>
  );
}
