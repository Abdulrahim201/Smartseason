import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/Navbar.css";

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">🌾 SmartSeason</Link>
      </div>
      <div className="navbar-links">
        <Link to="/">Dashboard</Link>
        <Link to="/fields">Fields</Link>
        {user?.role === "admin" && <Link to="/fields/new">+ New Field</Link>}
      </div>
      <div className="navbar-user">
        <span className={`role-badge role-${user?.role}`}>{user?.role === "admin" ? "Admin" : "Field Agent"}</span>
        <span className="username">{user?.username}</span>
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </div>
    </nav>
  );
}

export default Navbar;
