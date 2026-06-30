"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { ApplicationForm } from "@/components/application-form";
import { LoadingState } from "@/components/loading-state";
import { SessionGate } from "@/components/session-gate";
import {
  apiFetch,
  updateApplication,
  type ApiApplication,
  type ApplicationPayload
} from "@/lib/api";

export default function EditApplicationPage() {
  return (
    <SessionGate role="APPLICANT">
      {(user) => (
        <AppShell user={user}>
          <EditApplication />
        </AppShell>
      )}
    </SessionGate>
  );
}

function EditApplication() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [application, setApplication] = useState<ApiApplication | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    apiFetch<ApiApplication>(`/applications/${params.id}`)
      .then(setApplication)
      .catch((loadError: unknown) =>
        setError(loadError instanceof Error ? loadError.message : "Unable to load.")
      )
      .finally(() => setIsLoading(false));
  }, [params.id]);

  async function handleSubmit(payload: ApplicationPayload) {
    await updateApplication(params.id, payload);
    router.replace(`/applicant/applications/${params.id}`);
  }

  if (isLoading) {
    return (
      <section className="panel">
        <LoadingState label="Loading draft" />
      </section>
    );
  }

  if (error || !application) {
    return <section className="panel error">{error ?? "Application not found."}</section>;
  }

  return (
    <section className="form-layout">
      <div className="page-copy">
        <p className="eyebrow">Edit draft</p>
        <h1>Update the request before review.</h1>
        <p className="muted">Only draft applications can be edited.</p>
        <div className="notice">
          Changes are saved back to this draft. Submit it from the detail page
          when it is ready for review.
        </div>
      </div>
      <ApplicationForm
        application={application}
        onSubmit={handleSubmit}
        submitLabel="Save changes"
      />
    </section>
  );
}
