import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../context/useAuth";
import { SkeletonDetail } from "../components/Skeleton";

export default function TourDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [tour, setTour] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [numPeople, setNumPeople] = useState(1);

  const [submitting, setSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState(null);

  useEffect(() => {
    api.get(`/tours/${id}`)
      .then((res) => setTour(res.data))
      .catch(() => setError("Could not load this tour. It may not exist or is no longer available."))
      .finally(() => setLoading(false));
  }, [id]);

  const isGroup = tour?.tour_type === "GROUP_BUS";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBookingError("");
    setBookingSuccess(null);

    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    if (!startDate) {
      setBookingError("Please select a date.");
      return;
    }
    if (!isGroup && !endDate) {
      setBookingError("Please select an end date.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = isGroup
        ? { tour_id: Number(id), start_date: startDate, num_people: Number(numPeople) }
        : { tour_id: Number(id), start_date: startDate, end_date: endDate };

      const res = await api.post("/tour-bookings", payload);
      setBookingSuccess(res.data);
    } catch (err) {
      if (err.response?.status === 409) {
        setBookingError(err.response.data?.detail || "This tour is not available for the selected date(s).");
      } else if (err.response?.data?.detail) {
        setBookingError(typeof err.response.data.detail === "string" ? err.response.data.detail : "Please check your booking details.");
      } else {
        setBookingError("Could not create booking. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <SkeletonDetail />;
  if (error) return <p className="page alert-error">{error}</p>;
  if (!tour) return null;

  return (
    <div className="page-narrow">
      {tour.images?.[0] && (
        <img
          src={tour.images[0]}
          alt={tour.title}
          style={{ width: "100%", height: 280, objectFit: "cover", borderRadius: 10, marginBottom: 16 }}
        />
      )}
      <p className="card-tag">{isGroup ? "Group Bus Tour" : "Private Car + Guide"}</p>
      <h2>{tour.title}</h2>
      <p className="muted">{tour.destination}{tour.duration_days ? ` · ${tour.duration_days} day${tour.duration_days > 1 ? "s" : ""}` : ""}</p>
      <p className="card-price mono" style={{ fontSize: 20 }}>PKR {tour.price} <span className="unit">{isGroup ? "per person" : "per day"}</span></p>
      {tour.description && <p>{tour.description}</p>}
      {tour.included_facilities?.length > 0 && (
        <p className="muted">Included: {tour.included_facilities.join(", ")}</p>
      )}
      {isGroup && tour.max_group_size && <p className="muted">Group size: up to {tour.max_group_size} people</p>}

      <h3 style={{ marginTop: 32 }}>Book this tour</h3>

      {bookingSuccess ? (
        <div className="alert-success">
          <p style={{ margin: 0 }}>Booking created &mdash; status: <span className="status-pill status-pending">{bookingSuccess.status}</span></p>
          {bookingSuccess.total_price && <p style={{ margin: "8px 0" }}>Total: PKR {bookingSuccess.total_price}</p>}
          <button onClick={() => navigate("/tour-bookings")}>View my tour bookings</button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 360 }}>
          {isGroup ? (
            <>
              <label>
                Departure date
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
              </label>
              <label>
                Number of people
                <input type="number" min="1" value={numPeople} onChange={(e) => setNumPeople(e.target.value)} required />
              </label>
            </>
          ) : (
            <>
              <label>
                Start date
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
              </label>
              <label>
                End date
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
              </label>
            </>
          )}

          {bookingError && <p className="alert-error">{bookingError}</p>}

          <button type="submit" disabled={submitting}>
            {submitting ? "Booking..." : isAuthenticated ? "Book now" : "Log in to book"}
          </button>
        </form>
      )}
    </div>
  );
}