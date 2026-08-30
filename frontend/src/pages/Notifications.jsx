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

  const hasUnread = notifications.some((n) => !n.is_read);

  return (
    <div className="page-narrow">
      <div className="section-head">
        <h2>Notifications</h2>
        {hasUnread && <button className="btn-secondary btn-sm" onClick={markAllRead}>Mark all as read</button>}
      </div>

      {error && <p className="alert-error">{error}</p>}

      {loading ? (
        <div className="notif-list">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="notif-item">
              <div style={{ flex: 1 }}>
                <div className="skeleton skeleton-line w-70" style={{ marginBottom: 8 }} />
                <div className="skeleton skeleton-line w-40" />
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <p className="muted">No notifications yet.</p>
      ) : (
        <div className="notif-list">
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => handleClick(n)}
              className={`notif-item ${n.is_read ? "" : "unread"}`}
              style={{ cursor: n.link ? "pointer" : "default" }}
            >
              {!n.is_read && <span className="notif-dot" />}
              <div>
                <p className="notif-message">{n.message}</p>
                <p className="notif-time mono">{new Date(n.created_at).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}