import React, { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";
import { FiLogOut, FiMenu } from "react-icons/fi";

const Navbar = ({ onMenuClick }) => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const getPageTitle = () => {
    const p = location.pathname;
    if (p === "/") return "Dashboard";
    if (p.startsWith("/attendance")) return "Attendance";
    if (p.startsWith("/route")) return "Route Plan";
    if (p.startsWith("/visit")) return "Visits";
    if (p.startsWith("/order")) return "Orders";
    if (p.startsWith("/expense")) return "Expenses";
    if (p.startsWith("/collection")) return "Collections";

    if (p.startsWith("/reports/sales")) return "Sales Report";
    if (p.startsWith("/reports")) return "Performance Report";
    return "Field Force";
  };

  return (
    <header className="ff-navbar">
      <div className="ff-navbar-left">
        <button
          className="ff-nav-iconbtn ff-hamburger"
          onClick={onMenuClick}
          type="button"
          aria-label="Open menu"
          title="Menu"
        >
          <FiMenu />
        </button>

        <div className="ff-nav-titlewrap">
          <h1 className="ff-title">{getPageTitle()}</h1>
          <div className="ff-nav-subtitle">Field Force Dashboard</div>
        </div>
      </div>

      <div className="ff-navbar-right">
        <div className="ff-nav-user">
          <div className="ff-nav-avatar">
            {(user?.name?.[0] || "U").toUpperCase()}
          </div>
          <div className="ff-nav-usertext">
            <div className="ff-nav-username">{user?.name || "User"}</div>
            <div className="ff-nav-role">{user?.role || "—"}</div>
          </div>
        </div>

        <button className="ff-nav-logout" onClick={handleLogout} type="button">
          <FiLogOut />
          <span className="ff-nav-logoutText">Logout</span>
        </button>
      </div>
    </header>
  );
};

export default Navbar;
