import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";

export default function Tours() {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/tours")
      .then((res) => setTours(res.data))
      .catch(() => setError("Could not load tours. Please try again."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page">
      <h2>Tours</h2>

      {loading && <p className="muted">Loading tours...</p>}
      {error && <p className="alert-error">{error}</p>}
      {!loading && !error && tours.length === 0 && <p className="muted">No tours available yet.</p>}

      <div className="grid">
        {tours.map((t) => (
          <Link key={t.id} to={`/tours/${t.id}`} className="card">
            <div className="card-photo">
              {t.images?.[0] && <img src={t.images[0]} alt={t.title} />}
            </div>
            <div className="card-body">
              <p className="card-tag">{t.tour_type === "GROUP_BUS" ? "Group Bus Tour" : "Private Car + Guide"}</p>
              <h3>{t.title}</h3>
              <p className="card-spec">{t.destination}{t.duration_days ? ` · ${t.duration_days} day${t.duration_days > 1 ? "s" : ""}` : ""}</p>
              <div className="card-foot">
                <span className="card-price mono">PKR {t.price} <span className="unit">{t.tour_type === "GROUP_BUS" ? "/ person" : "/ day"}</span></span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}