"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";
import { homePathForRole, type Role } from "@submission/shared";
import { LoadingState } from "@/components/loading-state";
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

  async function signOut() {
    await authClient.signOut();
    router.replace("/login");
  }

  if (isPending) {
    return (
      <main className="shell">
        <section className="panel">
          <LoadingState label="Loading session" />
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
            Signed in as {user.role.toLowerCase()}. Open your own workspace or
            sign in with a different account.
          </p>
          <div className="actions">
            <Link href={homePathForRole(user.role)} className="button">
              Go to my workspace
            </Link>
            <button type="button" className="ghost" onClick={signOut}>
              Sign out
            </button>
          </div>
        </section>
      </main>
    );
  }

  return <>{children(user)}</>;
}
