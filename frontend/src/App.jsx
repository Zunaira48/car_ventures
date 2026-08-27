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
  return (
    <nav className="navbar">
      <Link to="/" className="logo">car_<span>ventures</span></Link>
      <NavLink to="/vehicles">Vehicles</NavLink>
      <NavLink to="/tours">Tours</NavLink>
      {isAuthenticated ? (
        <>
          <NavLink to="/bookings">My Bookings</NavLink>
          <NavLink to="/tour-bookings">My Tour Bookings</NavLink>
          <NavLink to="/favorites">My Favorites</NavLink>
          <NavLink to="/notifications">
            Notifications
            {unreadCount > 0 && <span className="nav-badge">{unreadCount}</span>}
          </NavLink>
          {isAdmin && <NavLink to="/admin/add-vehicle">Add Vehicle</NavLink>}
          {isAdmin && <NavLink to="/admin" end>Admin</NavLink>}
          <button className="btn-secondary btn-sm" onClick={logout}>Logout</button>
        </>
      ) : (
        <>
          <NavLink to="/login">Login</NavLink>
          <NavLink to="/register">Register</NavLink>
        </>
      )}
    </nav>
  );
}

function BackToHome() {
  const location = useLocation();
  if (location.pathname === "/") return null;
  return (
    <div className="back-home-bar">
      <Link to="/" className="back-home">← Back to Home</Link>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
          <Nav />
          <BackToHome />
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