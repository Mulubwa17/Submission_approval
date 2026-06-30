"use client";

import { useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";
import type { Role } from "@submission/shared";
import { authClient } from "@/lib/auth-client";
import type { SessionUser } from "@/lib/api";

export function SessionGate({
  children,
  role
}: {
  children: (user: SessionUser) => ReactNode;
  role: Role;
}) {
  const router = useRouter();
  const { data, isPending } = authClient.useSession();
  const user = data?.user as SessionUser | undefined;

  useEffect(() => {
    if (!isPending && !user) {
      router.replace("/login");
    }
  }, [isPending, router, user]);

  if (isPending) {
    return (
      <main className="shell">
        <section className="panel loading-state" aria-label="Loading session">
          <div className="loading-line" />
          <div className="loading-line short" />
        </section>
      </main>
    );
  }

  if (!user) {
    return <main className="shell">Redirecting...</main>;
  }

  if (user.role !== role) {
    return (
      <main className="shell">
        <section className="panel">
          <h1>Wrong workspace</h1>
          <p>
            Signed in as {user.role.toLowerCase()}. Use the correct seeded
            account for this area.
          </p>
        </section>
      </main>
    );
  }

  return <>{children(user)}</>;
}
