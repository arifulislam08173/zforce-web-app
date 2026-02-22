import React, { useContext, useState } from "react";
import { Outlet } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

import Sidebar from "../../components/Layout/Sidebar";
import Navbar from "../../components/Layout/Navbar";
import "../../styles/layout.css";

const Dashboard = () => {
  const { user } = useContext(AuthContext);

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="ff-app">
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      <div className="ff-main">
        <Navbar onMenuClick={() => setMobileOpen(true)} user={user} />
        <main className="ff-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
