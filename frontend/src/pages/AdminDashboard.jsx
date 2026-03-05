import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3001/api/analytics",
  timeout: 15000,
});

function AdminDashboard() {
  const { isAdmin, isLoggedIn, loading: authLoading, token } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!authLoading && (!isLoggedIn || !isAdmin)) navigate("/login");
  }, [authLoading, isLoggedIn, isAdmin]);

  useEffect(() => {
    if (!token || !isAdmin) return;
    setLoading(true);
    api.get("/dashboard", { headers: { Authorization: `Bearer ${token}` } })
      .then(({ data }) => setData(data))
      .catch((err) => setError(err.response?.data?.error || "Failed to load dashboard"))
      .finally(() => setLoading(false));
  }, [token, isAdmin]);

  if (authLoading || loading) {
    return (
      <div className="admin-page container">
        <div className="loading"><div className="spinner" /></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-page container">
        <div className="error-message"><p>{error}</p></div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="admin-page container">
      <h1 className="admin-title">Admin Dashboard</h1>

      {/* Overview Cards */}
      <div className="admin-cards">
        <div className="admin-stat-card">
          <span className="admin-stat-value">{data.overview.totalUsers}</span>
          <span className="admin-stat-label">Total Users</span>
        </div>
        <div className="admin-stat-card">
          <span className="admin-stat-value">{data.overview.totalEvents.toLocaleString()}</span>
          <span className="admin-stat-label">Total Events</span>
        </div>
        <div className="admin-stat-card">
          <span className="admin-stat-value">{data.overview.events24h.toLocaleString()}</span>
          <span className="admin-stat-label">Events (24h)</span>
        </div>
        <div className="admin-stat-card">
          <span className="admin-stat-value">{data.overview.events7d.toLocaleString()}</span>
          <span className="admin-stat-label">Events (7d)</span>
        </div>
      </div>

      <div className="admin-grid">
        {/* Top Anime */}
        <div className="admin-panel">
          <h2>Top Watched Anime (30d)</h2>
          <div className="admin-table">
            <div className="admin-table-header">
              <span>Anime</span>
              <span>Views</span>
              <span>Unique</span>
            </div>
            {data.topAnime.map((a) => (
              <div key={a._id} className="admin-table-row">
                <span className="admin-table-title">{a._id}</span>
                <span>{a.views}</span>
                <span>{a.uniqueUsers}</span>
              </div>
            ))}
            {data.topAnime.length === 0 && <p className="admin-empty">No data yet</p>}
          </div>
        </div>

        {/* Top Searches */}
        <div className="admin-panel">
          <h2>Top Searches (30d)</h2>
          <div className="admin-table">
            <div className="admin-table-header">
              <span>Query</span>
              <span>Count</span>
            </div>
            {data.topSearches.map((s) => (
              <div key={s._id} className="admin-table-row">
                <span className="admin-table-title">{s._id}</span>
                <span>{s.count}</span>
              </div>
            ))}
            {data.topSearches.length === 0 && <p className="admin-empty">No data yet</p>}
          </div>
        </div>

        {/* Country Breakdown */}
        <div className="admin-panel">
          <h2>Traffic by Country (30d)</h2>
          <div className="admin-table">
            <div className="admin-table-header">
              <span>Country</span>
              <span>Events</span>
              <span>Unique</span>
            </div>
            {data.countryBreakdown.map((c) => (
              <div key={c._id} className="admin-table-row">
                <span className="admin-table-title">{c._id}</span>
                <span>{c.count}</span>
                <span>{c.uniqueUsers}</span>
              </div>
            ))}
            {data.countryBreakdown.length === 0 && <p className="admin-empty">No data yet</p>}
          </div>
        </div>

        {/* Daily Views */}
        <div className="admin-panel">
          <h2>Daily Activity (30d)</h2>
          <div className="admin-table">
            <div className="admin-table-header">
              <span>Date</span>
              <span>Events</span>
              <span>Unique</span>
            </div>
            {data.dailyViews.map((d) => (
              <div key={d._id} className="admin-table-row">
                <span className="admin-table-title">{d._id}</span>
                <span>{d.count}</span>
                <span>{d.uniqueUsers}</span>
              </div>
            ))}
            {data.dailyViews.length === 0 && <p className="admin-empty">No data yet</p>}
          </div>
        </div>
      </div>

      {/* Recent Events */}
      <div className="admin-panel admin-full-width">
        <h2>Recent Events</h2>
        <div className="admin-table">
          <div className="admin-table-header admin-events-header">
            <span>Type</span>
            <span>Details</span>
            <span>Country</span>
            <span>Time</span>
          </div>
          {data.recentEvents.map((e, i) => (
            <div key={i} className="admin-table-row admin-events-row">
              <span className="admin-event-type">{e.type.replace("_", " ")}</span>
              <span className="admin-table-title">
                {e.animeTitle || e.searchQuery || "-"}
                {e.episodeNumber ? ` Ep ${e.episodeNumber}` : ""}
              </span>
              <span>{e.country || "-"}</span>
              <span>{new Date(e.createdAt).toLocaleTimeString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
