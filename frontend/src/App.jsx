import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Link, NavLink, useLocation } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import { useAuth } from "./context/useAuth";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Vehicles from "./pages/Vehicles";
import VehicleDetail from "./pages/VehicleDetail";
import AddVehicle from "./pages/AddVehicle";
import MyBookings from "./pages/MyBookings";
import MyFavorites from "./pages/MyFavorites";
import Tours from "./pages/Tours";
import TourDetail from "./pages/TourDetail";
import MyTourBookings from "./pages/MyTourBookings";
import Notifications from "./pages/Notifications";
import AdminDashboard from "./pages/AdminDashboard";
import Footer from "./components/Footer";

function Nav() {
  const { isAuthenticated, isAdmin, unreadCount, logout } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMenuOpen(false), [location.pathname]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <nav className="navbar">
      {location.pathname !== "/" && (
        <Link to="/" className="nav-back" aria-label="Back to home">←</Link>
      )}
      <Link to="/" className="logo">car_<span>ventures</span></Link>

      <button
        type="button"
        className="nav-toggle"
        aria-label={menuOpen ? "Close menu" : "Open menu"}
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((v) => !v)}
      >
        {menuOpen ? (
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
          </svg>
        )}
      </button>

      <div className={`nav-links${menuOpen ? " open" : ""}`}>
        <NavLink to="/vehicles" onClick={closeMenu}>Vehicles</NavLink>
        <NavLink to="/tours" onClick={closeMenu}>Tours</NavLink>
        {isAuthenticated ? (
          <>
            <NavLink to="/bookings" onClick={closeMenu}>My Bookings</NavLink>
            <NavLink to="/tour-bookings" onClick={closeMenu}>My Tour Bookings</NavLink>
            <NavLink to="/favorites" onClick={closeMenu}>My Favorites</NavLink>
            <NavLink to="/notifications" onClick={closeMenu}>
              Notifications
              {unreadCount > 0 && <span className="nav-badge">{unreadCount}</span>}
            </NavLink>
            {isAdmin && <NavLink to="/admin/add-vehicle" onClick={closeMenu}>Add Vehicle</NavLink>}
            {isAdmin && <NavLink to="/admin" end onClick={closeMenu}>Admin</NavLink>}
            <button className="btn-secondary btn-sm" onClick={() => { closeMenu(); logout(); }}>Logout</button>
          </>
        ) : (
          <>
            <NavLink to="/login" onClick={closeMenu}>Login</NavLink>
            <NavLink to="/register" onClick={closeMenu}>Register</NavLink>
          </>
        )}
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
          <Nav />
          <div style={{ flex: 1 }}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/vehicles" element={<Vehicles />} />
              <Route path="/vehicles/:id" element={<VehicleDetail />} />
              <Route path="/admin/add-vehicle" element={<AddVehicle />} />
              <Route path="/bookings" element={<MyBookings />} />
              <Route path="/favorites" element={<MyFavorites />} />
              <Route path="/tours" element={<Tours />} />
              <Route path="/tours/:id" element={<TourDetail />} />
              <Route path="/tour-bookings" element={<MyTourBookings />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Routes>
          </div>
          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}