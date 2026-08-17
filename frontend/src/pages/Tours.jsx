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

  if (loading) return <p>Loading tours...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (tours.length === 0) return <p>No tours available yet.</p>;

  return (
    <div style={{ maxWidth: 900, margin: "40px auto" }}>
      <h2>Tours</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
        {tours.map((t) => (
          <Link
            key={t.id}
            to={`/tours/${t.id}`}
            style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12, color: "inherit", textDecoration: "none" }}
          >
            {t.images?.[0] && <img src={t.images[0]} alt={t.title} style={{ width: "100%", height: 140, objectFit: "cover", borderRadius: 6 }} />}
            <p style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>
              {t.tour_type === "GROUP_BUS" ? "Group Bus Tour" : "Private Car + Guide"}
            </p>
            <h3>{t.title}</h3>
            <p>{t.destination}{t.duration_days ? ` · ${t.duration_days} day${t.duration_days > 1 ? "s" : ""}` : ""}</p>
            <p>
              <strong>PKR {t.price}</strong> {t.tour_type === "GROUP_BUS" ? "/ person" : "/ day"}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}