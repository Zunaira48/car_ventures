import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../context/useAuth";
import { SkeletonGrid } from "../components/Skeleton";

export default function Vehicles() {
  const { isAuthenticated } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filters, setFilters] = useState({
    location: "",
    category: "",
    transmission: "",
    fuel_type: "",
    min_price: "",
    max_price: "",
  });

  const updateFilter = (field, value) => setFilters((prev) => ({ ...prev, [field]: value }));

  const buildQuery = (f) => {
    const params = new URLSearchParams({ page_size: "100" });
    if (f.location) params.set("location", f.location);
    if (f.category) params.set("category", f.category);
    if (f.transmission) params.set("transmission", f.transmission);
    if (f.fuel_type) params.set("fuel_type", f.fuel_type);
    if (f.min_price) params.set("min_price", f.min_price);
    if (f.max_price) params.set("max_price", f.max_price);
    return params.toString();
  };

  const loadVehicles = (f) => {
    setLoading(true);
    setError("");
    api.get(`/vehicles?${buildQuery(f)}`)
      .then((res) => setVehicles(res.data))
      .catch(() => setError("Could not load vehicles. Please try again."))
      .finally(() => setLoading(false));
  };

  // Intentionally mount-only: filters are applied via the Search button (loadVehicles),
  // not reactively as the user types, so filters/loadVehicles are excluded on purpose.
  // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect
  useEffect(() => loadVehicles(filters), []);

  const handleSearch = (e) => {
    e.preventDefault();
    loadVehicles(filters);
  };

  const clearFilters = () => {
    const cleared = { location: "", category: "", transmission: "", fuel_type: "", min_price: "", max_price: "" };
    setFilters(cleared);
    loadVehicles(cleared);
  };

  const hasActiveFilters = Object.values(filters).some((v) => v !== "");

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

      <form onSubmit={handleSearch} className="filter-bar">
        <label>
          Location
          <input
            type="text"
            placeholder="e.g. Lahore"
            value={filters.location}
            onChange={(e) => updateFilter("location", e.target.value)}
          />
        </label>
        <label>
          Category
          <select value={filters.category} onChange={(e) => updateFilter("category", e.target.value)}>
            <option value="">Any</option>
            <option value="Economy">Economy</option>
            <option value="Hatchback">Hatchback</option>
            <option value="Sedan">Sedan</option>
            <option value="SUV">SUV</option>
            <option value="Luxury">Luxury</option>
            <option value="Hybrid">Hybrid</option>
            <option value="Pickup">Pickup</option>
          </select>
        </label>
        <label>
          Transmission
          <select value={filters.transmission} onChange={(e) => updateFilter("transmission", e.target.value)}>
            <option value="">Any</option>
            <option value="Automatic">Automatic</option>
            <option value="Manual">Manual</option>
          </select>
        </label>
        <label>
          Fuel
          <select value={filters.fuel_type} onChange={(e) => updateFilter("fuel_type", e.target.value)}>
            <option value="">Any</option>
            <option value="Petrol">Petrol</option>
            <option value="Diesel">Diesel</option>
            <option value="Hybrid">Hybrid</option>
          </select>
        </label>
        <label>
          Min PKR/day
          <input
            type="number"
            min="0"
            placeholder="0"
            value={filters.min_price}
            onChange={(e) => updateFilter("min_price", e.target.value)}
          />
        </label>
        <label>
          Max PKR/day
          <input
            type="number"
            min="0"
            placeholder="Any"
            value={filters.max_price}
            onChange={(e) => updateFilter("max_price", e.target.value)}
          />
        </label>
        <div className="filter-actions">
          <button type="submit" className="btn-primary btn-sm">Search</button>
          {hasActiveFilters && (
            <button type="button" className="btn-secondary btn-sm" onClick={clearFilters}>Clear</button>
          )}
        </div>
      </form>

      {loading && <SkeletonGrid count={6} />}
      {error && <p className="alert-error">{error}</p>}
      {!loading && !error && vehicles.length === 0 && (
        <p className="muted">{hasActiveFilters ? "No vehicles match those filters." : "No vehicles available yet."}</p>
      )}

      {!loading && (
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
      )}
    </div>
  );
}