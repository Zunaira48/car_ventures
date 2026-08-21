import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../context/useAuth";

export default function Notifications() {
  const navigate = useNavigate();
  const { refreshUnreadCount } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    api.get("/notifications/my")
      .then((res) => setNotifications(res.data))
      .catch(() => setError("Could not load notifications."))
      .finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(load, []);

  const handleClick = async (n) => {
    if (!n.is_read) {
      try {
        await api.patch(`/notifications/${n.id}/read`);
        setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)));
        refreshUnreadCount();
      } catch {
        // non-critical - navigation still proceeds
      }
    }
    if (n.link) navigate(n.link);
  };

  const markAllRead = async () => {
    try {
      await api.patch("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      refreshUnreadCount();
    } catch {
      setError("Could not mark all as read.");
    }
  };

  if (loading) return <p>Loading notifications...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  const hasUnread = notifications.some((n) => !n.is_read);

  return (
    <div style={{ maxWidth: 600, margin: "40px auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>Notifications</h2>
        {hasUnread && <button onClick={markAllRead}>Mark all as read</button>}
      </div>
      {notifications.length === 0 ? (
        <p>No notifications yet.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => handleClick(n)}
              style={{
                border: "1px solid #ddd",
                borderRadius: 8,
                padding: 12,
                cursor: n.link ? "pointer" : "default",
                background: n.is_read ? "transparent" : "rgba(100, 100, 255, 0.08)",
                fontWeight: n.is_read ? "normal" : "bold",
              }}
            >
              <p style={{ margin: 0 }}>{n.message}</p>
              <p style={{ margin: "4px 0 0", fontSize: 12, color: "#888", fontWeight: "normal" }}>
                {new Date(n.created_at).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}