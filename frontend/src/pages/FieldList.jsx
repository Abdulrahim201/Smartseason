import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import { StatusBadge, StageBadge } from "../components/StatusBadge";
import "../styles/FieldList.css";

function FieldList() {
  const { user } = useAuth();
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    api.get("/api/fields/")
      .then((res) => setFields(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === "all" ? fields : fields.filter((f) => f.status === filter);

  if (loading) return <div className="page-loading">Loading fields...</div>;

  return (
    <div className="field-list-page">
      <div className="page-header">
        <div>
          <h1>Fields</h1>
          <p className="page-subtitle">{fields.length} field{fields.length !== 1 ? "s" : ""} total</p>
        </div>
        {user?.role === "admin" && (
          <Link to="/fields/new" className="btn btn-primary">+ New Field</Link>
        )}
      </div>

      <div className="filter-tabs">
        {["all", "active", "at_risk", "completed"].map((f) => (
          <button
            key={f}
            className={`filter-tab ${filter === f ? "active" : ""}`}
            onClick={() => setFilter(f)}
          >
            {f === "all" ? "All" : f === "at_risk" ? "At Risk" : f.charAt(0).toUpperCase() + f.slice(1)}
            <span className="filter-count">
              {f === "all" ? fields.length : fields.filter((x) => x.status === f).length}
            </span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🌱</div>
          <p>No fields found.</p>
          {user?.role === "admin" && <Link to="/fields/new" className="btn btn-primary">Create your first field</Link>}
        </div>
      ) : (
        <div className="fields-table-wrap">
          <table className="fields-table">
            <thead>
              <tr>
                <th>Field Name</th>
                <th>Crop</th>
                <th>Planted</th>
                <th>Stage</th>
                <th>Status</th>
                {user?.role === "admin" && <th>Assigned To</th>}
                <th>Last Updated</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((field) => (
                <tr key={field.id}>
                  <td><Link to={`/fields/${field.id}`} className="field-name-link">{field.name}</Link></td>
                  <td>{field.crop_type}</td>
                  <td>{new Date(field.planting_date).toLocaleDateString()}</td>
                  <td><StageBadge stage={field.current_stage} /></td>
                  <td><StatusBadge status={field.status} /></td>
                  {user?.role === "admin" && (
                    <td>{field.assigned_agent_username || <span className="unassigned">Unassigned</span>}</td>
                  )}
                  <td>{new Date(field.updated_at).toLocaleDateString()}</td>
                  <td>
                    <Link to={`/fields/${field.id}`} className="btn btn-sm btn-outline">View</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default FieldList;
