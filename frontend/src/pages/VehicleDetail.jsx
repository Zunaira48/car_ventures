import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../context/useAuth";

function ReviewsSection({ vehicleId }) {
  const { isAuthenticated, user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const load = () => {
    api.get(`/vehicles/${vehicleId}/reviews`)
      .then((res) => setData(res.data))
      .catch(() => setError("Could not load reviews."));
  };

  useEffect(load, [vehicleId]);

  const myReview = data?.reviews.find((r) => r.user_id === user?.id);

  useEffect(() => {
    if (myReview) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRating(myReview.rating);
      setComment(myReview.comment || "");
    }
  }, [myReview]);

  const submit = async (e) => {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);
    try {
      if (myReview) {
        await api.put(`/reviews/${vehicleId}`, { rating, comment });
      } else {
        await api.post("/reviews", { vehicle_id: Number(vehicleId), rating, comment });
      }
      load();
    } catch (err) {
      setFormError(err.response?.data?.detail || "Could not save your review.");
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async () => {
    setSubmitting(true);
    try {
      await api.delete(`/reviews/${vehicleId}`);
      setComment("");
      setRating(5);
      load();
    } catch {
      setFormError("Could not delete your review.");
    } finally {
      setSubmitting(false);
    }
  };

  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (!data) return <p>Loading reviews...</p>;

  return (
    <div style={{ marginTop: 32 }}>
      <h3>Reviews {data.count > 0 && `(${data.average_rating} ★ · ${data.count})`}</h3>

      {data.reviews.length === 0 ? (
        <p>No reviews yet.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
          {data.reviews.map((r) => (
            <div key={r.id} style={{ border: "1px solid #eee", borderRadius: 6, padding: 10 }}>
              <p><strong>{r.reviewer_name}</strong> — {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</p>
              {r.comment && <p>{r.comment}</p>}
            </div>
          ))}
        </div>
      )}

      {isAuthenticated ? (
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 360 }}>
          <label>
            Your rating
            <select value={rating} onChange={(e) => setRating(Number(e.target.value))}>
              {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} star{n > 1 ? "s" : ""}</option>)}
            </select>
          </label>
          <label>
            Comment
            <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} />
          </label>
          {formError && <p style={{ color: "red" }}>{formError}</p>}
          <div>
            <button type="submit" disabled={submitting}>{myReview ? "Update review" : "Submit review"}</button>{" "}
            {myReview && <button type="button" onClick={remove} disabled={submitting}>Delete review</button>}
          </div>
        </form>
      ) : (
        <p>Log in to leave a review.</p>
      )}
    </div>
  );
}

export default function VehicleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [pickupLocation, setPickupLocation] = useState("");
  const [dropoffLocation, setDropoffLocation] = useState("");
  const [withChauffeur, setWithChauffeur] = useState("no");

  const [submitting, setSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState(null);

  useEffect(() => {
    api.get(`/vehicles/${id}`)
      .then((res) => setVehicle(res.data))
      .catch(() => setError("Could not load this vehicle. It may not exist or is no longer available."))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBookingError("");
    setBookingSuccess(null);

    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    if (!startDate || !endDate) {
      setBookingError("Please select both a start and end date.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post("/bookings", {
        vehicle_id: Number(id),
        start_date: startDate,
        end_date: endDate,
        pickup_location: pickupLocation || null,
        dropoff_location: dropoffLocation || null,
        with_chauffeur: withChauffeur,
      });
      setBookingSuccess(res.data);
    } catch (err) {
      if (err.response?.status === 409) {
        setBookingError("This vehicle is already booked for part or all of the selected dates.");
      } else if (err.response?.status === 404) {
        setBookingError("This vehicle is not available for booking.");
      } else if (err.response?.data?.detail) {
        setBookingError(typeof err.response.data.detail === "string" ? err.response.data.detail : "Please check your booking details.");
      } else {
        setBookingError("Could not create booking. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p>Loading vehicle...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (!vehicle) return null;

  return (
    <div style={{ maxWidth: 700, margin: "40px auto" }}>
      {vehicle.images?.[0] && (
        <img
          src={vehicle.images[0]}
          alt={vehicle.title}
          style={{ width: "100%", height: 280, objectFit: "cover", borderRadius: 8 }}
        />
      )}
      <h2>{vehicle.title}</h2>
      <p>{vehicle.location} · {vehicle.transmission} · {vehicle.fuel_type} · {vehicle.year}</p>
      {vehicle.rental_price && <p><strong>PKR {vehicle.rental_price}/day</strong></p>}
      {vehicle.description && <p>{vehicle.description}</p>}

      <h3 style={{ marginTop: 32 }}>Book this vehicle</h3>

      {bookingSuccess ? (
        <div style={{ padding: 12, background: "#eaffea", border: "1px solid #8c8", borderRadius: 6 }}>
          <p>Booking created — status: {bookingSuccess.status}.</p>
          {bookingSuccess.total_price && <p>Total: PKR {bookingSuccess.total_price}</p>}
          <button onClick={() => navigate("/bookings")}>View my bookings</button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 360 }}>
          <label>
            Start date
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
          </label>
          <label>
            End date
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
          </label>
          <label>
            Pickup location
            <input type="text" value={pickupLocation} onChange={(e) => setPickupLocation(e.target.value)} />
          </label>
          <label>
            Dropoff location
            <input type="text" value={dropoffLocation} onChange={(e) => setDropoffLocation(e.target.value)} />
          </label>
          <label>
            <input
              type="checkbox"
              checked={withChauffeur === "yes"}
              onChange={(e) => setWithChauffeur(e.target.checked ? "yes" : "no")}
            />
            {" "}With chauffeur
          </label>

          {bookingError && <p style={{ color: "red" }}>{bookingError}</p>}

          <button type="submit" disabled={submitting}>
            {submitting ? "Booking..." : isAuthenticated ? "Book now" : "Log in to book"}
          </button>
        </form>
      )}

      <ReviewsSection vehicleId={id} />
    </div>
  );
}