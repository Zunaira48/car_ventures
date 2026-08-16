import { useEffect, useState } from "react";
import api from "../api/client";
import { useAuth } from "../context/useAuth";

function SummaryTab() {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/admin/dashboard")
      .then((res) => setSummary(res.data))
      .catch(() => setError("Could not load dashboard summary."));
  }, []);

  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (!summary) return <p>Loading...</p>;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
      <Stat label="Total Users" value={summary.total_users} />
      <Stat label="Total Vehicles" value={summary.total_vehicles} />
      <Stat label="Pending Approvals" value={summary.pending_vehicle_approvals} />
      <Stat label="Active Bookings" value={summary.active_bookings} />
      <Stat label="Completed Bookings" value={summary.completed_bookings} />
      <Stat label="Revenue Estimate" value={`PKR ${summary.revenue_estimate}`} />
      <p style={{ gridColumn: "1 / -1", fontSize: 13, color: "#888" }}>{summary.note}</p>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 16 }}>
      <div style={{ fontSize: 13, color: "#888" }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: "bold" }}>{value}</div>
    </div>
  );
}

function PendingVehiclesTab() {
  const [vehicles, setVehicles] = useState([]);
  const [error, setError] = useState("");
  const [actingId, setActingId] = useState(null);

  const load = () => {
    api.get("/admin/vehicles/pending")
      .then((res) => setVehicles(res.data))
      .catch(() => setError("Could not load pending vehicles."));
  };

  useEffect(load, []);

  const act = async (id, status) => {
    setActingId(id);
    try {
      await api.put(`/vehicles/${id}`, { status });
      setVehicles((prev) => prev.filter((v) => v.id !== id));
    } catch {
      setError("Could not update that vehicle. Please try again.");
    } finally {
      setActingId(null);
    }
  };

  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (vehicles.length === 0) return <p>No vehicles pending approval.</p>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {vehicles.map((v) => (
        <div key={v.id} style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
          <p><strong>{v.title}</strong> — {v.location}</p>
          <p>{v.transmission} · {v.fuel_type} · {v.year}</p>
          <button onClick={() => act(v.id, "APPROVED")} disabled={actingId === v.id}>Approve</button>{" "}
          <button onClick={() => act(v.id, "REJECTED")} disabled={actingId === v.id}>Reject</button>
        </div>
      ))}
    </div>
  );
}

function BookingsTab() {
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState("");
  const [actingId, setActingId] = useState(null);

  const load = () => {
    api.get("/admin/bookings")
      .then((res) => setBookings(res.data))
      .catch(() => setError("Could not load bookings."));
  };

  useEffect(load, []);

  const setStatus = async (id, newStatus) => {
    setActingId(id);
    try {
      await api.patch(`/bookings/${id}/status`, { status: newStatus });
      setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status: newStatus } : b)));
    } catch {
      setError("Could not update that booking. Please try again.");
    } finally {
      setActingId(null);
    }
  };

  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (bookings.length === 0) return <p>No bookings yet.</p>;

  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
          <th>ID</th><th>Vehicle</th><th>User</th><th>Dates</th><th>Total</th><th>Status</th><th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {bookings.map((b) => (
          <tr key={b.id} style={{ borderBottom: "1px solid #eee" }}>
            <td>{b.id}</td>
            <td>{b.vehicle_id}</td>
            <td>{b.user_id}</td>
            <td>{b.start_date} → {b.end_date}</td>
            <td>PKR {b.total_price}</td>
            <td>{b.status}</td>
            <td>
              {b.status === "PENDING" && (
                <>
                  <button onClick={() => setStatus(b.id, "CONFIRMED")} disabled={actingId === b.id}>Confirm</button>{" "}
                  <button onClick={() => setStatus(b.id, "CANCELLED")} disabled={actingId === b.id}>Cancel</button>
                </>
              )}
              {b.status === "CONFIRMED" && (
                <>
                  <button onClick={() => setStatus(b.id, "COMPLETED")} disabled={actingId === b.id}>Mark Completed</button>{" "}
                  <button onClick={() => setStatus(b.id, "CANCELLED")} disabled={actingId === b.id}>Cancel</button>
                </>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function UsersTab() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/admin/users")
      .then((res) => setUsers(res.data))
      .catch(() => setError("Could not load users."));
  }, []);

  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
          <th>ID</th><th>Name</th><th>Email</th><th>Role</th><th>Joined</th>
        </tr>
      </thead>
      <tbody>
        {users.map((u) => (
          <tr key={u.id} style={{ borderBottom: "1px solid #eee" }}>
            <td>{u.id}</td>
            <td>{u.full_name}</td>
            <td>{u.email}</td>
            <td>{u.role}</td>
            <td>{new Date(u.created_at).toLocaleDateString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const TABS = [
  { key: "summary", label: "Summary", Component: SummaryTab },
  { key: "pending", label: "Pending Vehicles", Component: PendingVehiclesTab },
  { key: "bookings", label: "All Bookings", Component: BookingsTab },
  { key: "users", label: "All Users", Component: UsersTab },
];

export default function AdminDashboard() {
  const { isAuthenticated, isAdmin, userLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("summary");

  if (userLoading) return <p>Loading...</p>;
  if (!isAuthenticated) return <p>Please log in to view this page.</p>;
  if (!isAdmin) return <p>You don't have access to this page.</p>;

  const ActiveComponent = TABS.find((t) => t.key === activeTab).Component;

  return (
    <div style={{ maxWidth: 900, margin: "40px auto" }}>
      <h2>Admin Dashboard</h2>
      <div style={{ display: "flex", gap: 8, marginBottom: 20, borderBottom: "1px solid #ddd" }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            style={{
              padding: "8px 12px",
              border: "none",
              borderBottom: activeTab === t.key ? "2px solid #333" : "2px solid transparent",
              background: "none",
              cursor: "pointer",
              fontWeight: activeTab === t.key ? "bold" : "normal",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
      <ActiveComponent />
    </div>
  );
}