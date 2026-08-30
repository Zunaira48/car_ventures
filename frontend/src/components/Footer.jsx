import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div>
          <p className="footer-logo">car_<span>ventures</span></p>
          <p className="muted" style={{ maxWidth: 320 }}>
            A full-stack vehicle rental, marketplace, and tourism platform built to
            showcase production-style engineering &mdash; REST APIs, relational data
            modeling, and AI-assisted pricing. Demo data only, not a live business.
          </p>
        </div>
        <div>
          <p className="footer-heading">Quick Links</p>
          <Link to="/vehicles">Vehicles</Link>
          <Link to="/tours">Tours</Link>
          <Link to="/login">Login</Link>
          <Link to="/register">Register</Link>
        </div>
        <div>
          <p className="footer-heading">Account</p>
          <Link to="/bookings">My Bookings</Link>
          <Link to="/tour-bookings">My Tour Bookings</Link>
          <Link to="/favorites">My Favorites</Link>
          <Link to="/notifications">Notifications</Link>
        </div>
      </div>
      <p className="footer-bottom muted">car_ventures &mdash; a portfolio project. Demo data only.</p>
    </footer>
  );
}