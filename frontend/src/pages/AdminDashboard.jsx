import { useEffect, useState } from "react";
import api from "../api/client";
import { useAuth } from "../context/useAuth";
import { SkeletonStatsGrid, SkeletonCardRowList, SkeletonTable } from "../components/Skeleton";

function SummaryTab() {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/admin/dashboard")
      .then((res) => setSummary(res.data))
      .catch(() => setError("Could not load dashboard summary."));
  }, []);

  if (error) return <p className="alert-error">{error}</p>;
  if (!summary) return <SkeletonStatsGrid count={6} />;

  return (
    <div className="stats-grid">
      <Stat label="Total Users" value={summary.total_users} />
      <Stat label="Total Vehicles" value={summary.total_vehicles} />
      <Stat label="Pending Approvals" value={summary.pending_vehicle_approvals} />
      <Stat label="Active Bookings" value={summary.active_bookings} />
      <Stat label="Completed Bookings" value={summary.completed_bookings} />
      <Stat label="Revenue Estimate" value={`PKR ${summary.revenue_estimate}`} />
      <p className="muted" style={{ gridColumn: "1 / -1" }}>{summary.note}</p>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="stat-card">
      <div className="label">{label}</div>
      <div className="value">{value}</div>
    </div>
  );
}

function PendingVehiclesTab() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actingId, setActingId] = useState(null);

  const load = () => {
    setLoading(true);
    api.get("/admin/vehicles/pending")
      .then((res) => setVehicles(res.data))
      .catch(() => setError("Could not load pending vehicles."))
      .finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
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

  if (loading) return <SkeletonCardRowList count={3} />;
  if (error) return <p className="alert-error">{error}</p>;
  if (vehicles.length === 0) return <p className="muted">No vehicles pending approval.</p>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {vehicles.map((v) => (
        <div key={v.id} className="card">
          <div className="card-body">
            <p><strong>{v.title}</strong> — {v.location}</p>
            <p className="muted">{v.transmission} · {v.fuel_type} · {v.year}</p>
            <button className="btn-primary btn-sm" onClick={() => act(v.id, "APPROVED")} disabled={actingId === v.id}>Approve</button>{" "}
            <button className="btn-danger btn-sm" onClick={() => act(v.id, "REJECTED")} disabled={actingId === v.id}>Reject</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function AllVehiclesTab() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState(null);

  const load = () => {
    setLoading(true);
    api.get("/admin/vehicles")
      .then((res) => setVehicles(res.data))
      .catch(() => setError("Could not load vehicles."))
      .finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
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

  if (loading) return <SkeletonTable rows={5} cols={6} />;
  if (vehicles.length === 0 && !error) return <p className="muted">No vehicles yet.</p>;

  return (
    <div>
      {error && <p className="alert-error">{error}</p>}
      <table>
        <thead>
          <tr>
            <th>ID</th><th>Title</th><th>Location</th><th>Status</th><th>Change Availability</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {vehicles.map((v) => (
            <tr key={v.id}>
              <td>{v.id}</td>
              <td>{v.title}</td>
              <td>{v.location}</td>
              <td><span className={`status-pill status-${v.status.toLowerCase()}`}>{v.status}</span></td>
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
                <button className="btn-danger btn-sm" onClick={() => deleteVehicle(v)} disabled={savingId === v.id}>Delete</button>
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actingId, setActingId] = useState(null);

  const load = () => {
    setLoading(true);
    api.get("/admin/bookings")
      .then((res) => setBookings(res.data))
      .catch(() => setError("Could not load bookings."))
      .finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(load, []);

  const setStatus = async (id, newStatus) => {
    setActingId(id);
    setError("");
    try {
      await api.patch(`/bookings/${id}/status`, { status: newStatus });
      setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status: newStatus } : b)));
    } catch {
      setError("Could not update that booking. Please try again.");
    } finally {
      setActingId(null);
    }
  };

  if (loading) return <SkeletonTable rows={5} cols={7} />;
  if (bookings.length === 0 && !error) return <p className="muted">No bookings yet.</p>;

  return (
    <div>
      {error && <p className="alert-error">{error}</p>}
      <table>
        <thead>
          <tr>
            <th>ID</th><th>Vehicle</th><th>User</th><th>Dates</th><th>Total</th><th>Status</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((b) => (
            <tr key={b.id}>
              <td>{b.id}</td>
              <td>{b.vehicle_id}</td>
              <td>{b.user_id}</td>
              <td className="mono">{b.start_date} → {b.end_date}</td>
              <td className="mono">PKR {b.total_price}</td>
              <td><span className={`status-pill status-${b.status.toLowerCase()}`}>{b.status}</span></td>
              <td>
                {b.status === "PENDING" && (
                  <>
                    <button className="btn-primary btn-sm" onClick={() => setStatus(b.id, "CONFIRMED")} disabled={actingId === b.id}>Confirm</button>{" "}
                    <button className="btn-danger btn-sm" onClick={() => setStatus(b.id, "CANCELLED")} disabled={actingId === b.id}>Cancel</button>
                  </>
                )}
                {b.status === "CONFIRMED" && (
                  <>
                    <button className="btn-secondary btn-sm" onClick={() => setStatus(b.id, "COMPLETED")} disabled={actingId === b.id}>Mark Completed</button>{" "}
                    <button className="btn-danger btn-sm" onClick={() => setStatus(b.id, "CANCELLED")} disabled={actingId === b.id}>Cancel</button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function UsersTab() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    api.get("/admin/users")
      .then((res) => setUsers(res.data))
      .catch(() => setError("Could not load users."))
      .finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(load, []);

  if (loading) return <SkeletonTable rows={5} cols={5} />;
  if (error) return <p className="alert-error">{error}</p>;

  return (
    <table>
      <thead>
        <tr>
          <th>ID</th><th>Name</th><th>Email</th><th>Role</th><th>Joined</th>
        </tr>
      </thead>
      <tbody>
        {users.map((u) => (
          <tr key={u.id}>
            <td>{u.id}</td>
            <td>{u.full_name}</td>
            <td>{u.email}</td>
            <td>{u.role}</td>
            <td className="mono">{new Date(u.created_at).toLocaleDateString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ManageToursTab() {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const load = () => {
    setLoading(true);
    api.get("/admin/tours")
      .then((res) => setTours(res.data))
      .catch(() => setError("Could not load tours."))
      .finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(load, []);

  const toggleStatus = async (t) => {
    const newStatus = t.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    setBusyId(t.id);
    setError("");
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
    setError("");
    try {
      await api.delete(`/tours/${id}`);
      setTours((prev) => prev.filter((t) => t.id !== id));
    } catch {
      setError("Could not delete that tour. It may have existing bookings.");
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <SkeletonTable rows={5} cols={7} />;
  if (tours.length === 0 && !error) return <p className="muted">No tours yet.</p>;

  return (
    <div>
      {error && <p className="alert-error">{error}</p>}
      <table>
        <thead>
          <tr>
            <th>ID</th><th>Type</th><th>Title</th><th>Destination</th><th>Price</th><th>Status</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {tours.map((t) => (
            <tr key={t.id}>
              <td>{t.id}</td>
              <td>{t.tour_type === "GROUP_BUS" ? "Group Bus" : "Private Car"}</td>
              <td>{t.title}</td>
              <td>{t.destination}</td>
              <td className="mono">PKR {t.price}</td>
              <td><span className={`status-pill status-${t.status.toLowerCase()}`}>{t.status}</span></td>
              <td>
                <button className="btn-secondary btn-sm" onClick={() => toggleStatus(t)} disabled={busyId === t.id}>
                  {t.status === "ACTIVE" ? "Deactivate" : "Activate"}
                </button>{" "}
                <button className="btn-danger btn-sm" onClick={() => remove(t.id)} disabled={busyId === t.id}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
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

  if (userLoading) return <div className="page"><p className="muted">Loading...</p></div>;
  if (!isAuthenticated) return <div className="page"><p className="alert-error">Please log in to view this page.</p></div>;
  if (!isAdmin) return <div className="page"><p className="alert-error">You don't have access to this page.</p></div>;

  const ActiveComponent = TABS.find((t) => t.key === activeTab).Component;

  return (
    <div className="page">
      <h2>Admin Dashboard</h2>
      <div className="tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`tab ${activeTab === t.key ? "active" : ""}`}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <ActiveComponent />
    </div>
  );
}