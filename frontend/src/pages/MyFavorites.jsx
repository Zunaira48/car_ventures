import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";
import { SkeletonGrid } from "../components/Skeleton";

export default function MyFavorites() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [removingId, setRemovingId] = useState(null);

  const load = () => {
    setLoading(true);
    api.get("/favorites")
      .then((res) => setVehicles(res.data))
      .catch(() => setError("Could not load your favorites. Please try again."))
      .finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(load, []);

  const remove = async (e, vehicleId) => {
    e.preventDefault();
    e.stopPropagation();
    setRemovingId(vehicleId);
    try {
      await api.delete(`/favorites/${vehicleId}`);
      setVehicles((prev) => prev.filter((v) => v.id !== vehicleId));
    } catch {
      setError("Could not remove that favorite. Please try again.");
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="page">
      <div className="section-head">
        <h2>My Favorites</h2>
        {!loading && <span className="muted">{vehicles.length} saved</span>}
      </div>

      {loading && <SkeletonGrid count={3} />}
      {error && <p className="alert-error">{error}</p>}
      {!loading && !error && vehicles.length === 0 && (
        <p className="muted">
          No favorites yet. <Link to="/vehicles">Browse vehicles</Link>.
        </p>
      )}

      {!loading && vehicles.length > 0 && (
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
              <button
                className="favorite-btn"
                onClick={(e) => remove(e, v.id)}
                disabled={removingId === v.id}
                title="Remove from favorites"
              >
                {removingId === v.id ? "\u2026" : "\u2764\ufe0f"}
              </button>
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
      )}
    </div>
  );
}