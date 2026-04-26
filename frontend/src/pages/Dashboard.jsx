import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import { StatusBadge, StageBadge } from "../components/StatusBadge";
import "../styles/Dashboard.css";

function StatCard({ label, value, color, sub }) {
  return (
    <div className="stat-card" style={{ borderTopColor: color }}>
      <div className="stat-value" style={{ color }}>{value}</div>
      <div className="stat-label">{label}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/api/dashboard/")
      .then((res) => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-loading">Loading dashboard...</div>;
  if (!data) return <div className="page-error">Failed to load dashboard.</div>;

  const { total_fields, stage_breakdown = {}, status_breakdown = {}, total_agents, recent_updates = [] } = data;

  return (
    <div className="dashboard">
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="page-subtitle">
            {user?.role === "admin" ? "All fields overview" : "Your assigned fields"}
          </p>
        </div>
        {user?.role === "admin" && (
          <Link to="/fields/new" className="btn btn-primary">+ New Field</Link>
        )}
      </div>

      {/* Summary stats */}
      <div className="stats-grid">
        <StatCard label="Total Fields" value={total_fields} color="#3b82f6" />
        <StatCard label="Active" value={status_breakdown.active || 0} color="#22c55e"
          sub={`${total_fields ? Math.round(((status_breakdown.active || 0) / total_fields) * 100) : 0}% of fields`} />
        <StatCard label="At Risk" value={status_breakdown.at_risk || 0} color="#f59e0b"
          sub="Needs attention" />
        <StatCard label="Completed" value={status_breakdown.completed || 0} color="#64748b"
          sub="Harvested" />
        {user?.role === "admin" && (
          <StatCard label="Field Agents" value={total_agents || 0} color="#8b5cf6" />
        )}
      </div>

      {/* Stage breakdown */}
      <div className="section">
        <h2>Fields by Stage</h2>
        <div className="stage-bars">
          {["planted", "growing", "ready", "harvested"].map((stage) => {
            const count = stage_breakdown[stage] || 0;
            const pct = total_fields ? (count / total_fields) * 100 : 0;
            return (
              <div key={stage} className="stage-bar-row">
                <StageBadge stage={stage} />
                <div className="stage-bar-track">
                  <div className="stage-bar-fill" style={{ width: `${pct}%` }} data-stage={stage} />
                </div>
                <span className="stage-count">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent updates (admin only) */}
      {user?.role === "admin" && recent_updates.length > 0 && (
        <div className="section">
          <h2>Recent Updates</h2>
          <div className="updates-list">
            {recent_updates.map((u) => (
              <div key={u.id} className="update-item">
                <div className="update-meta">
                  <Link to={`/fields/${u.field}`} className="update-field-link">Field #{u.field}</Link>
                  <span className="update-agent">by {u.agent_username}</span>
                </div>
                <StageBadge stage={u.new_stage} />
                {u.notes && <p className="update-notes">{u.notes}</p>}
                <span className="update-time">{new Date(u.created_at).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="section">
        <div className="section-header">
          <h2>Quick Access</h2>
          <Link to="/fields" className="btn btn-outline">View All Fields →</Link>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
