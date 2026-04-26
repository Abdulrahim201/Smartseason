import { Link } from "react-router-dom";

function NotFound() {
  return (
    <div style={{ textAlign: "center", padding: "80px 20px" }}>
      <div style={{ fontSize: "64px" }}>🌾</div>
      <h1 style={{ fontSize: "48px", margin: "16px 0 8px" }}>404</h1>
      <p style={{ color: "#64748b", marginBottom: "24px" }}>This page couldn't be found.</p>
      <Link to="/" className="btn btn-primary">Go to Dashboard</Link>
    </div>
  );
}

export default NotFound;
