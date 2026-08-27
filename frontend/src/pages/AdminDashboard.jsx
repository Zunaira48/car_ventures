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

function AllVehiclesTab() {
  const [vehicles, setVehicles] = useState([]);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState(null);

  const load = () => {
    api.get("/admin/vehicles")
      .then((res) => setVehicles(res.data))
      .catch(() => setError("Could not load vehicles."));
  };

  useEffect(load, []);

  const setVehicleStatus = async (id, status) => {
    setSavingId(id);
    setError("");
    try {
      await api.put(`/vehicles/${id}`, { status });
      setVehicles((prev) => prev.map((v) => (v.id === id ? { ...v, status } : v)));
    } catch {
      setError("Could not update that vehicle's status. Please try again.");
    } finally {
      setSavingId(null);
    }
  };

  const deleteVehicle = async (v) => {
    if (!window.confirm(`Delete "${v.title}"? This cannot be undone.`)) return;
    setSavingId(v.id);
    setError("");
    try {
      await api.delete(`/vehicles/${v.id}`);
      setVehicles((prev) => prev.filter((x) => x.id !== v.id));
    } catch (err) {
      setError(err.response?.data?.detail || "Could not delete that vehicle.");
    } finally {
      setSavingId(null);
    }
  };

  if (vehicles.length === 0 && !error) return <p>No vehicles yet.</p>;

  return (
    <div>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
            <th>ID</th><th>Title</th><th>Location</th><th>Status</th><th>Change Availability</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {vehicles.map((v) => (
            <tr key={v.id} style={{ borderBottom: "1px solid #eee" }}>
              <td>{v.id}</td>
              <td>{v.title}</td>
              <td>{v.location}</td>
              <td>{v.status}</td>
              <td>
                <select
                  value={v.status}
                  disabled={savingId === v.id}
                  onChange={(e) => setVehicleStatus(v.id, e.target.value)}
                >
                  <option value="PENDING">PENDING</option>
                  <option value="APPROVED">APPROVED</option>
                  <option value="REJECTED">REJECTED</option>
                  <option value="SUSPENDED">SUSPENDED</option>
                </select>
              </td>
              <td>
                <button onClick={() => deleteVehicle(v)} disabled={savingId === v.id}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
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

function ManageToursTab() {
  const [tours, setTours] = useState([]);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const load = () => {
  api.get("/admin/tours")
    .then((res) => setTours(res.data))
    .catch(() => setError("Could not load tours."));
};

  useEffect(load, []);

  const toggleStatus = async (t) => {
    const newStatus = t.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    setBusyId(t.id);
    try {
      await api.put(`/tours/${t.id}`, { status: newStatus });
      setTours((prev) => prev.map((x) => (x.id === t.id ? { ...x, status: newStatus } : x)));
    } catch {
      setError("Could not update that tour's status. Please try again.");
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this tour? This cannot be undone.")) return;
    setBusyId(id);
    try {
      await api.delete(`/tours/${id}`);
      setTours((prev) => prev.filter((t) => t.id !== id));
    } catch {
      setError("Could not delete that tour. It may have existing bookings.");
    } finally {
      setBusyId(null);
    }
  };

  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (tours.length === 0) return <p>No tours yet.</p>;

  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
          <th>ID</th><th>Type</th><th>Title</th><th>Destination</th><th>Price</th><th>Status</th><th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {tours.map((t) => (
          <tr key={t.id} style={{ borderBottom: "1px solid #eee" }}>
            <td>{t.id}</td>
            <td>{t.tour_type === "GROUP_BUS" ? "Group Bus" : "Private Car"}</td>
            <td>{t.title}</td>
            <td>{t.destination}</td>
            <td>PKR {t.price}</td>
            <td>{t.status}</td>
            <td>
              <button onClick={() => toggleStatus(t)} disabled={busyId === t.id}>
                {t.status === "ACTIVE" ? "Deactivate" : "Activate"}
              </button>{" "}
              <button onClick={() => remove(t.id)} disabled={busyId === t.id}>Delete</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const TABS = [
  { key: "summary", label: "Summary", Component: SummaryTab },
  { key: "pending", label: "Pending Vehicles", Component: PendingVehiclesTab },
  { key: "allVehicles", label: "All Vehicles", Component: AllVehiclesTab },
  { key: "bookings", label: "All Bookings", Component: BookingsTab },
  { key: "users", label: "All Users", Component: UsersTab },
  { key: "tours", label: "Manage Tours", Component: ManageToursTab },
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