import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import { StatusBadge, StageBadge } from "../components/StatusBadge";
import { STAGES } from "../constants";
import "../styles/FieldDetail.css";

function FieldDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [field, setField] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updateStage, setUpdateStage] = useState("");
  const [updateNotes, setUpdateNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [updateError, setUpdateError] = useState("");
  const [updateSuccess, setUpdateSuccess] = useState("");

  const fetchField = () => {
    api.get(`/api/fields/${id}/`)
      .then((res) => {
        setField(res.data);
        setUpdateStage(res.data.current_stage);
      })
      .catch(() => navigate("/fields"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchField(); }, [id]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setUpdateError("");
    setUpdateSuccess("");
    setSubmitting(true);
    try {
      await api.post(`/api/fields/${id}/updates/create/`, {
        new_stage: updateStage,
        notes: updateNotes,
      });
      setUpdateNotes("");
      setUpdateSuccess("Update submitted successfully.");
      fetchField();
    } catch (err) {
      setUpdateError(err.response?.data?.detail || "Failed to submit update.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete field "${field.name}"? This cannot be undone.`)) return;
    await api.delete(`/api/fields/${id}/`);
    navigate("/fields");
  };

  if (loading) return <div className="page-loading">Loading field...</div>;
  if (!field) return null;

  const daysPlanted = Math.floor((new Date() - new Date(field.planting_date)) / (1000 * 60 * 60 * 24));

  return (
    <div className="field-detail">
      <div className="page-header">
        <div>
          <Link to="/fields" className="back-link">← All Fields</Link>
          <h1>{field.name}</h1>
          <div className="field-badges">
            <StageBadge stage={field.current_stage} />
            <StatusBadge status={field.status} />
          </div>
        </div>
        {user?.role === "admin" && (
          <div className="field-actions">
            <Link to={`/fields/${id}/edit`} className="btn btn-outline">Edit Field</Link>
            <button onClick={handleDelete} className="btn btn-danger">Delete</button>
          </div>
        )}
      </div>

      <div className="field-detail-grid">
        {/* Field info card */}
        <div className="card">
          <h2>Field Info</h2>
          <div className="info-rows">
            <div className="info-row">
              <span className="info-label">Crop Type</span>
              <span className="info-value">{field.crop_type}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Planting Date</span>
              <span className="info-value">{new Date(field.planting_date).toLocaleDateString()}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Days in Field</span>
              <span className="info-value">{daysPlanted} days</span>
            </div>
            <div className="info-row">
              <span className="info-label">Current Stage</span>
              <span className="info-value"><StageBadge stage={field.current_stage} /></span>
            </div>
            <div className="info-row">
              <span className="info-label">Status</span>
              <span className="info-value"><StatusBadge status={field.status} /></span>
            </div>
            {user?.role === "admin" && (
              <div className="info-row">
                <span className="info-label">Assigned Agent</span>
                <span className="info-value">{field.assigned_agent_username || <em>Unassigned</em>}</span>
              </div>
            )}
          </div>
        </div>

        {/* Update form */}
        <div className="card">
          <h2>Submit Update</h2>
          <form onSubmit={handleUpdate}>
            {updateError && <div className="form-error">{updateError}</div>}
            {updateSuccess && <div className="form-success">{updateSuccess}</div>}
            <div className="form-group">
              <label>New Stage</label>
              <select value={updateStage} onChange={(e) => setUpdateStage(e.target.value)}>
                {STAGES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Notes / Observations</label>
              <textarea
                value={updateNotes}
                onChange={(e) => setUpdateNotes(e.target.value)}
                placeholder="Describe what you observed in the field..."
                rows={4}
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Update"}
            </button>
          </form>
        </div>
      </div>

      {/* Update history */}
      <div className="card update-history">
        <h2>Update History</h2>
        {field.updates?.length === 0 ? (
          <p className="empty-text">No updates yet.</p>
        ) : (
          <div className="timeline">
            {field.updates?.map((u) => (
              <div key={u.id} className="timeline-item">
                <div className="timeline-dot" />
                <div className="timeline-content">
                  <div className="timeline-header">
                    <StageBadge stage={u.new_stage} />
                    <span className="timeline-agent">by {u.agent_username}</span>
                    <span className="timeline-time">{new Date(u.created_at).toLocaleString()}</span>
                  </div>
                  {u.notes && <p className="timeline-notes">{u.notes}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default FieldDetail;
