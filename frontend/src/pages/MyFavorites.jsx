import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";

export default function MyFavorites() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    api.get("/favorites")
      .then((res) => setVehicles(res.data))
      .catch(() => setError("Could not load your favorites."))
      .finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(load, []);

  const remove = async (vehicleId) => {
    try {
      await api.delete(`/favorites/${vehicleId}`);
      setVehicles((prev) => prev.filter((v) => v.id !== vehicleId));
    } catch {
      setError("Could not remove that favorite. Please try again.");
    }
  };

  if (loading) return <p>Loading your favorites...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div style={{ maxWidth: 900, margin: "40px auto" }}>
      <h2>My Favorites</h2>
      {vehicles.length === 0 ? (
        <p>No favorites yet. <Link to="/vehicles">Browse vehicles</Link>.</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 16 }}>
          {vehicles.map((v) => (
            <div key={v.id} style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
              <Link to={`/vehicles/${v.id}`} style={{ color: "inherit", textDecoration: "none" }}>
                {v.images?.[0] && <img src={v.images[0]} alt={v.title} style={{ width: "100%", height: 140, objectFit: "cover", borderRadius: 6 }} />}
                <h3>{v.title}</h3>
                <p>{v.location} · {v.transmission} · {v.fuel_type}</p>
                {v.rental_price && <p><strong>PKR {v.rental_price}/day</strong></p>}
              </Link>
              <button onClick={() => remove(v.id)}>Remove</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}