"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import type { SessionUser } from "@/lib/api";

const seededAccounts = [
  {
    email: "applicant@example.com",
    label: "Applicant",
    next: "/applicant/applications",
    summary: "Create drafts, submit requests, and track review status."
  },
  {
    email: "reviewer@example.com",
    label: "Reviewer",
    next: "/reviewer/applications",
    summary: "Open the queue, record decisions, and review audit trails."
  }
] as const;

type AuthMode = "seeded" | "manual" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string>(seededAccounts[0].email);
  const [mode, setMode] = useState<AuthMode>("seeded");
  const [manualEmail, setManualEmail] = useState("");
  const [manualPassword, setManualPassword] = useState("");
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (mode === "signup") {
        if (signupPassword !== signupConfirmPassword) {
          setError("Passwords do not match.");
          return;
        }

        const result = await authClient.signUp.email({
          email: signupEmail.trim(),
          name: signupName.trim(),
          password: signupPassword
        });

        if (result.error) {
          setError(result.error.message ?? "Unable to create account.");
          return;
        }

        router.replace("/applicant/applications");
        return;
      }

      const signInEmail = mode === "seeded" ? email : manualEmail.trim();
      const signInPassword = mode === "seeded" ? "password123" : manualPassword;
      const account = seededAccounts.find((item) => item.email === signInEmail);
      const result = await authClient.signIn.email({
        email: signInEmail,
        password: signInPassword
      });

      if (result.error) {
        setError(result.error.message ?? "Unable to sign in.");
        return;
      }

      const signedInUser = result.data?.user as Partial<SessionUser> | undefined;
      const fallbackPath =
        signedInUser?.role === "REVIEWER"
          ? "/reviewer/applications"
          : "/applicant/applications";

      router.replace(account?.next ?? fallbackPath);
    } catch (signInError) {
      setError(
        signInError instanceof Error ? signInError.message : "Unable to sign in."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="shell login-shell">
      <section className="login-layout">
        <div className="login-copy">
          <div>
            <p className="eyebrow">Submission platform</p>
            <h1>Move requests from draft to decision.</h1>
            <p>
              A quiet workspace for applicants to submit structured requests and
              reviewers to act with a readable audit trail.
            </p>
          </div>
          <div className="role-strip" aria-label="Available workspaces">
            <div>
              <strong>Applicant</strong>
              <p>Create drafts, submit, and reopen returned requests.</p>
            </div>
            <div>
              <strong>Reviewer</strong>
              <p>Filter the queue, record decisions, and track status changes.</p>
            </div>
          </div>
        </div>

        <section className="panel form login-card">
          <div>
            <p className="eyebrow">Access</p>
            <h1>{mode === "signup" ? "Create account" : "Sign in"}</h1>
            <p className="muted">
              Use a seeded account, sign in with credentials, or create a new
              applicant account.
            </p>
          </div>

          <div className="auth-mode-toggle" role="tablist" aria-label="Sign in mode">
            <button
              type="button"
              className={mode === "seeded" ? "active" : ""}
              onClick={() => {
                setMode("seeded");
                setError(null);
              }}
            >
              Seeded accounts
            </button>
            <button
              type="button"
              className={mode === "manual" ? "active" : ""}
              onClick={() => {
                setMode("manual");
                setError(null);
              }}
            >
              Email password
            </button>
          </div>

          <form className="form" onSubmit={handleSubmit}>
            {mode === "seeded" ? (
              <fieldset className="account-options">
                <legend>Choose workspace</legend>
                {seededAccounts.map((account) => (
                  <label
                    key={account.email}
                    className={`account-card ${
                      email === account.email ? "selected" : ""
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={email === account.email}
                      onChange={() => setEmail(account.email)}
                    />
                    <span className="account-card-copy">
                      <strong>{account.label}</strong>
                      <span>{account.email}</span>
                      <span className="helper">{account.summary}</span>
                    </span>
                  </label>
                ))}
              </fieldset>
            ) : mode === "manual" ? (
              <>
                <label>
                  Email
                  <input
                    autoComplete="email"
                    inputMode="email"
                    required={mode === "manual"}
                    type="email"
                    value={manualEmail}
                    onChange={(event) => setManualEmail(event.target.value)}
                    placeholder="name@example.com"
                  />
                </label>

                <label>
                  Password
                  <input
                    autoComplete="current-password"
                    required={mode === "manual"}
                    type="password"
                    value={manualPassword}
                    onChange={(event) => setManualPassword(event.target.value)}
                    placeholder="Enter your password"
                  />
                </label>
              </>
            ) : (
              <>
                <label>
                  Full name
                  <input
                    autoComplete="name"
                    required={mode === "signup"}
                    type="text"
                    value={signupName}
                    onChange={(event) => setSignupName(event.target.value)}
                    placeholder="Your name"
                  />
                </label>

                <label>
                  Email
                  <input
                    autoComplete="email"
                    inputMode="email"
                    required={mode === "signup"}
                    type="email"
                    value={signupEmail}
                    onChange={(event) => setSignupEmail(event.target.value)}
                    placeholder="name@example.com"
                  />
                </label>

                <label>
                  Password
                  <input
                    autoComplete="new-password"
                    minLength={8}
                    required={mode === "signup"}
                    type="password"
                    value={signupPassword}
                    onChange={(event) => setSignupPassword(event.target.value)}
                    placeholder="Create a password"
                  />
                  <span className="helper">Use at least 8 characters.</span>
                </label>

                <label>
                  Confirm password
                  <input
                    autoComplete="new-password"
                    minLength={8}
                    required={mode === "signup"}
                    type="password"
                    value={signupConfirmPassword}
                    onChange={(event) =>
                      setSignupConfirmPassword(event.target.value)
                    }
                    placeholder="Repeat your password"
                  />
                </label>
              </>
            )}

            {error ? <p className="error">{error}</p> : null}

            <button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? mode === "signup"
                  ? "Creating account..."
                  : "Signing in..."
                : mode === "signup"
                  ? "Create account"
                  : "Sign in"}
            </button>

            {mode === "signup" ? (
              <p className="auth-switch-copy">
                Already have an account?{" "}
                <button
                  type="button"
                  className="text-button"
                  onClick={() => {
                    setMode("manual");
                    setError(null);
                  }}
                >
                  Sign in
                </button>
              </p>
            ) : (
              <p className="auth-switch-copy">
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  className="text-button"
                  onClick={() => {
                    setMode("signup");
                    setError(null);
                  }}
                >
                  Sign up
                </button>
              </p>
            )}
          </form>
        </section>
      </section>
    </main>
  );
}
