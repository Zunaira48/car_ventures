import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancellingId, setCancellingId] = useState(null);

  useEffect(() => {
    api.get("/bookings/my")
      .then((res) => setBookings(res.data))
      .catch(() => setError("Could not load your bookings. Please try again."))
      .finally(() => setLoading(false));
  }, []);

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

  if (loading) return <p>Loading your bookings...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div style={{ maxWidth: 700, margin: "40px auto" }}>
      <h2>My Bookings</h2>
      {bookings.length === 0 ? (
        <p>
          You have no bookings yet. <Link to="/vehicles">Browse vehicles</Link>.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {bookings.map((b) => (
            <div key={b.id} style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
              <p><strong>Booking #{b.id}</strong> — {b.status}</p>
              <p>{b.start_date} to {b.end_date}</p>
              {b.pickup_location && <p>Pickup: {b.pickup_location}</p>}
              {b.total_price && <p>Total: PKR {b.total_price}</p>}
              {(b.status === "PENDING" || b.status === "CONFIRMED") && (
                <button onClick={() => handleCancel(b.id)} disabled={cancellingId === b.id}>
                  {cancellingId === b.id ? "Cancelling..." : "Cancel booking"}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}