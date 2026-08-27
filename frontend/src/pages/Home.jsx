import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";

export default function Home() {
  const [vehicles, setVehicles] = useState([]);
  const [tours, setTours] = useState([]);

  useEffect(() => {
    api.get("/vehicles?page_size=9").then((res) => setVehicles(res.data)).catch(() => {});
    api.get("/tours").then((res) => setTours(res.data.slice(0, 3))).catch(() => {});
  }, []);

  return (
    <div>
      <div className="hero">
        <div className="hero-content">
          <p className="eyebrow">Lahore &middot; Karachi &middot; Islamabad &middot; and beyond</p>
          <h1>Rent a car in the city.<br />Book a ride into the mountains.</h1>
          <p>Browse verified vehicles across Pakistan, with server-side booking and pricing, no guesswork.</p>
          <Link to="/vehicles" className="btn btn-primary" style={{ display: "inline-block", textDecoration: "none" }}>
            Browse all vehicles
          </Link>
        </div>
      </div>

      <div className="page">
        <div className="section-head">
          <h2>Featured Vehicles</h2>
          <Link to="/vehicles">View all vehicles &rarr;</Link>
        </div>
        <div className="grid">
          {vehicles.map((v) => (
            <Link key={v.id} to={`/vehicles/${v.id}`} className="card">
              <div className="card-photo">
                {v.images?.[0] && <img src={v.images[0]} alt={v.title} />}
              </div>
              <div className="card-body">
                <p className="card-tag">{v.category || v.transmission}</p>
                <h3>{v.title}</h3>
                <p className="card-spec">{v.location} &middot; {v.transmission} &middot; {v.fuel_type}</p>
                {v.rental_price && (
                  <span className="card-price mono">PKR {v.rental_price} <span className="unit">/day</span></span>
                )}
              </div>
            </Link>
          ))}
        </div>

        {tours.length > 0 && (
          <>
            <div className="section-head" style={{ marginTop: 44 }}>
              <h2>Explore Tours</h2>
              <Link to="/tours">View all tours &rarr;</Link>
            </div>
            <div className="grid">
              {tours.map((t) => (
                <Link key={t.id} to={`/tours/${t.id}`} className="card">
                  <div className="card-photo">
                    {t.images?.[0] && <img src={t.images[0]} alt={t.title} />}
                  </div>
                  <div className="card-body">
                    <p className="card-tag">{t.tour_type === "GROUP_BUS" ? "Group Bus Tour" : "Private Car + Guide"}</p>
                    <h3>{t.title}</h3>
                    <p className="card-spec">{t.destination}</p>
                    <span className="card-price mono">
                      PKR {t.price} <span className="unit">{t.tour_type === "GROUP_BUS" ? "/ person" : "/ day"}</span>
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}