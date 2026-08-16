import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../context/useAuth";

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
    </div>
  );
}