import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import { useAuth } from "./context/useAuth";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Vehicles from "./pages/Vehicles";
import VehicleDetail from "./pages/VehicleDetail";
import MyBookings from "./pages/MyBookings";
import MyFavorites from "./pages/MyFavorites";
import Tours from "./pages/Tours";
import TourDetail from "./pages/TourDetail";
import MyTourBookings from "./pages/MyTourBookings";
import AdminDashboard from "./pages/AdminDashboard";

function Nav() {
  const { isAuthenticated, isAdmin, logout } = useAuth();
  return (
    <nav style={{ padding: 16, borderBottom: "1px solid #ddd", display: "flex", gap: 16, flexWrap: "wrap" }}>
      <Link to="/vehicles">Vehicles</Link>
      <Link to="/tours">Tours</Link>
      {isAuthenticated ? (
        <>
          <Link to="/bookings">My Bookings</Link>
          <Link to="/tour-bookings">My Tour Bookings</Link>
          <Link to="/favorites">My Favorites</Link>
          {isAdmin && <Link to="/admin">Admin</Link>}
          <button onClick={logout}>Logout</button>
        </>
      ) : (
        <>
          <Link to="/login">Login</Link>
          <Link to="/register">Register</Link>
        </>
      )}
    </nav>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Nav />
        <Routes>
          <Route path="/" element={<Vehicles />} />
          <Route path="/vehicles" element={<Vehicles />} />
          <Route path="/vehicles/:id" element={<VehicleDetail />} />
          <Route path="/bookings" element={<MyBookings />} />
          <Route path="/favorites" element={<MyFavorites />} />
          <Route path="/tours" element={<Tours />} />
          <Route path="/tours/:id" element={<TourDetail />} />
          <Route path="/tour-bookings" element={<MyTourBookings />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}