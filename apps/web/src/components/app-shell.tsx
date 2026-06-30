"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ReactNode } from "react";
import { authClient } from "@/lib/auth-client";
import type { SessionUser } from "@/lib/api";

export function AppShell({
  children,
  user
}: {
  children: ReactNode;
  user: SessionUser;
}) {
  const router = useRouter();
  const home =
    user.role === "REVIEWER" ? "/reviewer/applications" : "/applicant/applications";

  async function signOut() {
    await authClient.signOut();
    router.replace("/login");
  }

  return (
    <main className="shell">
      <header className="topbar">
        <Link href={home} className="brand">
          Submission Workflow
        </Link>
        <div className="account">
          <span>{user.name}</span>
          <span className="badge">{user.role}</span>
          <button type="button" className="ghost" onClick={signOut}>
            Sign out
          </button>
        </div>
      </header>
      {children}
    </main>
  );
}
