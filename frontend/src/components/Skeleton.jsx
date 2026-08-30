export function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton skeleton-photo" />
      <div className="skeleton-body">
        <div className="skeleton skeleton-line w-40" />
        <div className="skeleton skeleton-line title" />
        <div className="skeleton skeleton-line w-70" />
        <div className="skeleton skeleton-line w-50" />
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 6 }) {
  return (
    <div className="grid">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonDetail() {
  return (
    <div className="page-narrow">
      <div className="skeleton" style={{ width: "100%", height: 280, borderRadius: 10, marginBottom: 16 }} />
      <div className="skeleton skeleton-line w-40" style={{ marginBottom: 10 }} />
      <div className="skeleton skeleton-line title" style={{ marginBottom: 10 }} />
      <div className="skeleton skeleton-line w-70" style={{ marginBottom: 10 }} />
      <div className="skeleton skeleton-line w-50" style={{ height: 24 }} />
    </div>
  );
}