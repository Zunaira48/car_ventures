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
    api.get("/vehicles?page_size=100")
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
      .catch(() => {});
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
      if (isFavorited) await api.delete(`/favorites/${vehicleId}`);
      else await api.post(`/favorites/${vehicleId}`);
    } catch {
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        isFavorited ? next.add(vehicleId) : next.delete(vehicleId);
        return next;
      });
    }
  };

  return (
    <div className="page">
      <div className="section-head">
        <h2>Available Vehicles</h2>
        {!loading && <span className="muted">{vehicles.length} result{vehicles.length !== 1 ? "s" : ""}</span>}
      </div>

      {loading && <p className="muted">Loading vehicles...</p>}
      {error && <p className="alert-error">{error}</p>}
      {!loading && !error && vehicles.length === 0 && <p className="muted">No vehicles available yet.</p>}

      <div className="grid">
        {vehicles.map((v) => (
          <Link key={v.id} to={`/vehicles/${v.id}`} className="card">
            <div className="card-photo">
              {v.images?.[0] ? (
                <img src={v.images[0]} alt={v.title} />
              ) : (
                <svg className="card-photo-fallback" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="4" width="18" height="16" rx="2" />
                  <circle cx="8.5" cy="9.5" r="1.5" />
                  <path d="M21 16l-5-5-4 4-3-3-6 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            {isAuthenticated && (
              <button className="favorite-btn" onClick={(e) => toggleFavorite(e, v.id)}>
                {favoriteIds.has(v.id) ? "\u2764\ufe0f" : "\ud83e\udd0d"}
              </button>
            )}
            <div className="card-body">
              <p className="card-tag">{v.category || v.transmission}</p>
              <h3>{v.title}</h3>
              <p className="card-spec">{v.location} &middot; {v.transmission} &middot; {v.fuel_type}</p>
              <div className="card-foot">
                {v.rental_price && (
                  <span className="card-price mono">PKR {v.rental_price} <span className="unit">/day</span></span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}