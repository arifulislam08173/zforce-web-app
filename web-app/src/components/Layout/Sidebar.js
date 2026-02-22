import React, { useContext, useMemo, useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FiGrid,
  FiCalendar,
  FiMap,
  FiMapPin,
  FiTrendingDown,
  FiShoppingCart,
  FiCreditCard,
  FiUsers,
  FiChevronLeft,
  FiChevronRight,
  FiX,
  FiBox,
  FiBriefcase,
  FiBarChart2,
  FiPieChart,
  FiChevronDown,
} from "react-icons/fi";

import { AuthContext } from "../../context/AuthContext";

const Sidebar = ({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) => {
  const location = useLocation();
  const { user } = useContext(AuthContext);

  const role = String(user?.role || "").toUpperCase();
  const canSeeAdminMenu = role === "ADMIN" || role === "MANAGER";
  const isAdmin = role === "ADMIN";

  const closeMobile = () => setMobileOpen(false);

  const mainItems = useMemo(
    () => [
      { name: "Dashboard", path: "/", icon: <FiGrid /> },
      { name: "Attendance", path: "/attendance", icon: <FiCalendar /> },
      { name: "Route Plan", path: "/route", icon: <FiMap /> },
      { name: "Visit", path: "/visit", icon: <FiMapPin /> },
      { name: "Order", path: "/order", icon: <FiShoppingCart /> },
      { name: "Expense", path: "/expense", icon: <FiTrendingDown /> },
      { name: "Collection", path: "/collection", icon: <FiCreditCard /> },
    ],
    []
  );

  const reportItems = useMemo(
    () => [
      { name: "Sales Report (Orders)", path: "/reports/sales", icon: <FiBarChart2 /> },
      { name: "Performance Report", path: "/reports", icon: <FiPieChart /> },
    ],
    []
  );

  const adminItems = useMemo(() => {
    const items = [];

    if (isAdmin) items.push({ name: "Users", path: "/users", icon: <FiUsers /> });

    items.push(
      { name: "Customer", path: "/customer", icon: <FiBriefcase /> },
      { name: "Product", path: "/product", icon: <FiBox /> },
      { name: "Company", path: "/company", icon: <FiBriefcase /> },

      { name: "Company Assign", path: "/assignments/user-company", icon: <FiUsers /> },
      { name: "Customer Assign", path: "/assignments/customers", icon: <FiMap /> }
    );

    return items;
  }, [isAdmin]);

  const matchesPath = (pathname, itemPath) => {
    if (itemPath === "/") return pathname === "/";
    return pathname === itemPath || pathname.startsWith(itemPath + "/");
  };

  const activePath = useMemo(() => {
    const pathname = location.pathname;

    const all = [
      ...mainItems,
      ...(canSeeAdminMenu ? adminItems : []),
      ...(canSeeAdminMenu ? reportItems : []),
    ];

    const matches = all.filter((it) => matchesPath(pathname, it.path));
    if (!matches.length) return null;

    matches.sort((a, b) => b.path.length - a.path.length);
    return matches[0].path;
  }, [location.pathname, mainItems, adminItems, reportItems, canSeeAdminMenu]);

  const [reportsOpen, setReportsOpen] = useState(false);

  useEffect(() => {
    if (!canSeeAdminMenu) return;
    const isReportsRoute = location.pathname === "/reports" || location.pathname.startsWith("/reports/");
    setReportsOpen(isReportsRoute);
  }, [location.pathname, canSeeAdminMenu]);

  return (
    <>
      <div className={`ff-overlay ${mobileOpen ? "open" : ""}`} onClick={closeMobile} />

      <aside className={["ff-sidebar", collapsed ? "collapsed" : "", mobileOpen ? "mobile-open" : ""].join(" ")}>
        <div className="ff-sidebar-top">
          <div className="ff-brand">
            <div className="ff-logo">FF</div>
            {!collapsed && <div className="ff-brand-text">Field Force</div>}
          </div>

          <button
            className="ff-icon-btn ff-collapse-btn"
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            type="button"
          >
            {collapsed ? <FiChevronRight /> : <FiChevronLeft />}
          </button>

          <button className="ff-icon-btn ff-mobile-close" onClick={closeMobile} type="button" title="Close">
            <FiX />
          </button>
        </div>

        <nav className="ff-nav">
          {!collapsed ? <div className="ff-nav-section">Main</div> : null}

          {mainItems.map((item) => {
            const active = item.path === activePath;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`ff-nav-item ${active ? "active" : ""}`}
                onClick={closeMobile}
                title={collapsed ? item.name : undefined}
              >
                <span className="ff-nav-icon">{item.icon}</span>
                {!collapsed && <span className="ff-nav-text">{item.name}</span>}
                {!collapsed && active && <span className="ff-active-pill" />}
              </Link>
            );
          })}

          {canSeeAdminMenu ? (
            <>
              {!collapsed ? <div className="ff-nav-section">Admin</div> : null}

              {adminItems.map((item) => {
                const active = item.path === activePath;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`ff-nav-item ${active ? "active" : ""}`}
                    onClick={closeMobile}
                    title={collapsed ? item.name : undefined}
                  >
                    <span className="ff-nav-icon">{item.icon}</span>
                    {!collapsed && <span className="ff-nav-text">{item.name}</span>}
                    {!collapsed && active && <span className="ff-active-pill" />}
                  </Link>
                );
              })}

              <div className="ff-dropdown">
                {/* Dropdown header */}
                <button
                  type="button"
                  onClick={() => setReportsOpen((s) => !s)}
                  className={`ff-nav-item ff-dropdown-head ${location.pathname.startsWith("/reports") ? "active" : ""}`}
                  title={collapsed ? "Reports" : undefined}
                >
                  <span className="ff-nav-icon">
                    <FiBarChart2 />
                  </span>

                  {!collapsed && <span className="ff-nav-text">Reports</span>}

                  {!collapsed ? (
                    <span className="ff-dropdown-chevron">
                      <FiChevronDown className={`ff-chevron ${reportsOpen ? "open" : ""}`} />
                    </span>
                  ) : null}
                </button>

                {/* Dropdown items */}
                {!collapsed && reportsOpen ? (
                  <div className="ff-dropdown-body">
                    {reportItems.map((item) => {
                      const active = item.path === activePath;
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          className={`ff-nav-item ff-dropdown-item ${active ? "active" : ""}`}
                          onClick={closeMobile}
                        >
                          <span className="ff-nav-icon">{item.icon}</span>
                          <span className="ff-nav-text">{item.name}</span>
                          {active && <span className="ff-active-pill" />}
                        </Link>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            </>
          ) : null}
        </nav>

        {!collapsed && (
          <div className="ff-sidebar-footer">
            <div className="ff-hint">
              <span className="ff-hint-dot" />
              Field Force
            </div>
          </div>
        )}
      </aside>
    </>
  );
};

export default Sidebar;
