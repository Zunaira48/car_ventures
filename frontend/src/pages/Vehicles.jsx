import { useEffect, useState } from "react";
import api from "../api/client";

export default function Vehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/vehicles")
      .then((res) => setVehicles(res.data))
      .catch(() => setError("Could not load vehicles. Please try again."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading vehicles...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (vehicles.length === 0) return <p>No vehicles available yet.</p>;

  return (
    <div style={{ maxWidth: 900, margin: "40px auto" }}>
      <h2>Available Vehicles</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 16 }}>
        {vehicles.map((v) => (
          <div key={v.id} style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
            {v.images?.[0] && <img src={v.images[0]} alt={v.title} style={{ width: "100%", height: 140, objectFit: "cover", borderRadius: 6 }} />}
            <h3>{v.title}</h3>
            <p>{v.location} · {v.transmission} · {v.fuel_type}</p>
            {v.rental_price && <p><strong>PKR {v.rental_price}/day</strong></p>}
          </div>
        ))}
      </div>
    </div>
  );
}