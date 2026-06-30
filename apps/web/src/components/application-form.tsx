"use client";

import { FormEvent, useState } from "react";
import { applicationCategories } from "@submission/shared";
import type { ApiApplication, ApplicationPayload } from "@/lib/api";

export function ApplicationForm({
  application,
  onSubmit,
  submitLabel
}: {
  application?: ApiApplication;
  onSubmit: (payload: ApplicationPayload) => Promise<void>;
  submitLabel: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSaving(true);

    const formData = new FormData(event.currentTarget);
    const payload: ApplicationPayload = {
      amount: String(formData.get("amount") ?? ""),
      category: String(formData.get("category")) as ApplicationPayload["category"],
      description: String(formData.get("description") ?? ""),
      title: String(formData.get("title") ?? "")
    };

    try {
      await onSubmit(payload);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to save the application."
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="panel form" onSubmit={handleSubmit}>
      <label>
        Title
        <input
          required
          maxLength={120}
          name="title"
          defaultValue={application?.title}
          placeholder="Laptop procurement request"
        />
        <span className="helper">Use a short name reviewers can scan quickly.</span>
      </label>

      <label>
        Category
        <select name="category" defaultValue={application?.category ?? "PROCUREMENT"}>
          {applicationCategories.map((category) => (
            <option key={category} value={category}>
              {category.replace("_", " ")}
            </option>
          ))}
        </select>
      </label>

      <label>
        Amount
        <input
          name="amount"
          inputMode="decimal"
          placeholder="1500.00"
          defaultValue={application?.amount ?? ""}
        />
        <span className="helper">
          Optional. Enter the requested value without currency symbols.
        </span>
      </label>

      <label>
        Description
        <textarea
          name="description"
          rows={6}
          defaultValue={application?.description ?? ""}
          placeholder="Add the business reason and supporting context."
        />
        <span className="helper">Include the reason, timing, and decision context.</span>
      </label>

      {error ? <p className="error">{error}</p> : null}

      <button type="submit" disabled={isSaving}>
        {isSaving ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}
