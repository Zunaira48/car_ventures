import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";
import { SkeletonTicketList } from "../components/Skeleton";

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancellingId, setCancellingId] = useState(null);

  const loadBookings = () => {
    setLoading(true);
    api.get("/bookings/my")
      .then((res) => setBookings(res.data))
      .catch(() => setError("Could not load your bookings. Please try again."))
      .finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(loadBookings, []);

  const handleCancel = async (bookingId) => {
    setCancellingId(bookingId);
    try {
      await api.patch(`/bookings/${bookingId}/cancel`);
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: "CANCELLED" } : b))
      );
    } catch {
      setError("Could not cancel that booking. Please try again.");
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="page">
      <h2>My Bookings</h2>

      {loading && <SkeletonTicketList count={3} />}
      {error && <p className="alert-error">{error}</p>}

      {!loading && !error && bookings.length === 0 && (
        <p className="muted">
          You have no bookings yet. <Link to="/vehicles">Browse vehicles</Link>.
        </p>
      )}

      {!loading && !error && bookings.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {bookings.map((b) => (
            <div key={b.id} className="ticket">
              <div className="ticket-main">
                <p className="label">Vehicle Booking &middot; #{b.id}</p>
                <p className="title mono">{b.start_date} &rarr; {b.end_date}</p>
                {b.pickup_location && <p className="meta">Pickup: {b.pickup_location}</p>}
                {b.total_price && <p className="meta mono">PKR {b.total_price}</p>}
              </div>
              <div className="ticket-divider" />
              <div className="ticket-stub">
                <span className={`status-pill status-${b.status.toLowerCase()}`}>{b.status}</span>
                {(b.status === "PENDING" || b.status === "CONFIRMED") && (
                  <button className="btn-danger btn-sm" onClick={() => handleCancel(b.id)} disabled={cancellingId === b.id}>
                    {cancellingId === b.id ? "Cancelling..." : "Cancel"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}