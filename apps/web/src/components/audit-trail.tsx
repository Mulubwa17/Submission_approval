import type { AuditLogEntry } from "@submission/shared";

export function AuditTrail({ entries }: { entries?: AuditLogEntry[] }) {
  return (
    <aside className="panel">
      <h2>Audit trail</h2>
      {entries?.length ? (
        <div className="timeline">
          {entries.map((entry) => (
            <div key={entry.id} className="timeline-item">
              <strong>
                {entry.fromStatus ?? "CREATED"} to {entry.toStatus}
              </strong>
              <p className="muted">
                {entry.actor.name} on{" "}
                {new Date(entry.createdAt).toLocaleString()}
              </p>
              {entry.comment ? <p>{entry.comment}</p> : null}
            </div>
          ))}
        </div>
      ) : (
        <p className="muted">No transitions recorded yet.</p>
      )}
    </aside>
  );
}
