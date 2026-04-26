import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import api from "../api";
import { STAGES } from "../constants";
import "../styles/FieldForm.css";

function FieldForm() {
  const { id } = useParams(); // present when editing
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [name, setName] = useState("");
  const [cropType, setCropType] = useState("");
  const [plantingDate, setPlantingDate] = useState("");
  const [currentStage, setCurrentStage] = useState("planted");
  const [assignedAgent, setAssignedAgent] = useState("");
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/api/agents/").then((res) => setAgents(res.data)).catch(console.error);

    if (isEdit) {
      api.get(`/api/fields/${id}/`)
        .then((res) => {
          const f = res.data;
          setName(f.name);
          setCropType(f.crop_type);
          setPlantingDate(f.planting_date);
          setCurrentStage(f.current_stage);
          setAssignedAgent(f.assigned_agent || "");
        })
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const payload = {
      name,
      crop_type: cropType,
      planting_date: plantingDate,
      current_stage: currentStage,
      assigned_agent: assignedAgent || null,
    };
    try {
      if (isEdit) {
        await api.put(`/api/fields/${id}/`, payload);
        navigate(`/fields/${id}`);
      } else {
        const res = await api.post("/api/fields/", payload);
        navigate(`/fields/${res.data.id}`);
      }
    } catch (err) {
      const data = err.response?.data;
      setError(data ? JSON.stringify(data) : "Failed to save field.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="page-loading">Loading...</div>;

  return (
    <div className="field-form-page">
      <div className="page-header">
        <div>
          <Link to={isEdit ? `/fields/${id}` : "/fields"} className="back-link">
            ← {isEdit ? "Back to Field" : "All Fields"}
          </Link>
          <h1>{isEdit ? "Edit Field" : "New Field"}</h1>
        </div>
      </div>

      <div className="card form-card">
        <form onSubmit={handleSubmit}>
          {error && <div className="form-error">{error}</div>}

          <div className="form-row">
            <div className="form-group">
              <label>Field Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. North Paddock"
                required
              />
            </div>
            <div className="form-group">
              <label>Crop Type *</label>
              <input
                type="text"
                value={cropType}
                onChange={(e) => setCropType(e.target.value)}
                placeholder="e.g. Maize, Wheat, Sorghum"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Planting Date *</label>
              <input
                type="date"
                value={plantingDate}
                onChange={(e) => setPlantingDate(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Current Stage</label>
              <select value={currentStage} onChange={(e) => setCurrentStage(e.target.value)}>
                {STAGES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Assign to Field Agent</label>
            <select value={assignedAgent} onChange={(e) => setAssignedAgent(e.target.value)}>
              <option value="">— Unassigned —</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>{a.username}</option>
              ))}
            </select>
          </div>

          <div className="form-actions">
            <Link to={isEdit ? `/fields/${id}` : "/fields"} className="btn btn-outline">Cancel</Link>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? "Saving..." : isEdit ? "Save Changes" : "Create Field"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default FieldForm;
