export function LoadingState({
  label,
  lines = 2
}: {
  label: string;
  lines?: number;
}) {
  return (
    <div className="loading-state" aria-label={label}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={`loading-line${index % 2 === 1 ? " short" : ""}`}
        />
      ))}
    </div>
  );
}
