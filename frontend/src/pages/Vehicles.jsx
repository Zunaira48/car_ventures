import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../context/useAuth";

export default function Vehicles() {
  const { isAuthenticated } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/vehicles")
      .then((res) => setVehicles(res.data))
      .catch(() => setError("Could not load vehicles. Please try again."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFavoriteIds(new Set());
      return;
    }
    api.get("/favorites")
      .then((res) => setFavoriteIds(new Set(res.data.map((v) => v.id))))
      .catch(() => {}); // non-critical - hearts just won't be pre-filled
  }, [isAuthenticated]);

  const toggleFavorite = async (e, vehicleId) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) return;

    const isFavorited = favoriteIds.has(vehicleId);
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      isFavorited ? next.delete(vehicleId) : next.add(vehicleId);
      return next;
    });
    try {
      if (isFavorited) {
        await api.delete(`/favorites/${vehicleId}`);
      } else {
        await api.post(`/favorites/${vehicleId}`);
      }
    } catch {
      // revert on failure
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        isFavorited ? next.add(vehicleId) : next.delete(vehicleId);
        return next;
      });
    }
  };

  if (loading) return <p>Loading vehicles...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (vehicles.length === 0) return <p>No vehicles available yet.</p>;

  return (
    <div style={{ maxWidth: 900, margin: "40px auto" }}>
      <h2>Available Vehicles</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 16 }}>
        {vehicles.map((v) => (
          <Link
            key={v.id}
            to={`/vehicles/${v.id}`}
            style={{ position: "relative", border: "1px solid #ddd", borderRadius: 8, padding: 12, color: "inherit", textDecoration: "none" }}
          >
            {isAuthenticated && (
              <button
                onClick={(e) => toggleFavorite(e, v.id)}
                aria-label={favoriteIds.has(v.id) ? "Remove from favorites" : "Add to favorites"}
                style={{
                  position: "absolute", top: 8, right: 8, border: "none", background: "rgba(255,255,255,0.85)",
                  borderRadius: "50%", width: 32, height: 32, cursor: "pointer", fontSize: 16,
                }}
              >
                {favoriteIds.has(v.id) ? "❤️" : "🤍"}
              </button>
            )}
            {v.images?.[0] && <img src={v.images[0]} alt={v.title} style={{ width: "100%", height: 140, objectFit: "cover", borderRadius: 6 }} />}
            <h3>{v.title}</h3>
            <p>{v.location} · {v.transmission} · {v.fuel_type}</p>
            {v.rental_price && <p><strong>PKR {v.rental_price}/day</strong></p>}
          </Link>
        ))}
      </div>
    </div>
  );
}