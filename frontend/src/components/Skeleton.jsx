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

export function SkeletonTicket() {
  return (
    <div className="skeleton-ticket">
      <div className="skeleton-ticket-main">
        <div className="skeleton skeleton-line w-40" style={{ height: 10 }} />
        <div className="skeleton skeleton-line title" />
        <div className="skeleton skeleton-line w-50" />
      </div>
      <div className="ticket-divider" />
      <div className="skeleton-ticket-stub">
        <div className="skeleton skeleton-line w-70" style={{ height: 20, borderRadius: 20 }} />
      </div>
    </div>
  );
}

export function SkeletonTicketList({ count = 3 }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonTicket key={i} />
      ))}
    </div>
  );
}

export function SkeletonStatCard() {
  return (
    <div className="stat-card">
      <div className="skeleton skeleton-line w-50" style={{ height: 10, marginBottom: 10 }} />
      <div className="skeleton skeleton-line w-40" style={{ height: 20 }} />
    </div>
  );
}

export function SkeletonStatsGrid({ count = 6 }) {
  return (
    <div className="stats-grid">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonStatCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 5 }) {
  return (
    <table>
      <tbody>
        {Array.from({ length: rows }).map((_, r) => (
          <tr key={r}>
            {Array.from({ length: cols }).map((_, c) => (
              <td key={c}>
                <div className="skeleton skeleton-line" style={{ width: c === 0 ? "30%" : "70%" }} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function SkeletonCardRow() {
  return (
    <div className="card">
      <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div className="skeleton skeleton-line w-70" />
        <div className="skeleton skeleton-line w-40" />
      </div>
    </div>
  );
}

export function SkeletonCardRowList({ count = 3 }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCardRow key={i} />
      ))}
    </div>
  );
}