import React, { useEffect, useState } from 'react';
import api from '../../api/api';
import './DashboardHome.css';

const DashboardHome = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCustomers: 0,
    totalVisits: 0,
    totalOrders: 0,
    totalCollections: 0,
    totalExpenses: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/dashboard/stats'); // Backend endpoint for stats
        setStats(res.data);
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) return <p>Loading dashboard...</p>;

  return (
    <div className="dashboard-home">
      <h2>Welcome to the Admin Dashboard</h2>
      <div className="stats-cards">
        <div className="card">
          <h3>Total Users</h3>
          <p>{stats.totalUsers}</p>
        </div>
        <div className="card">
          <h3>Total Customers</h3>
          <p>{stats.totalCustomers}</p>
        </div>
        <div className="card">
          <h3>Total Visits</h3>
          <p>{stats.totalVisits}</p>
        </div>
        <div className="card">
          <h3>Total Orders</h3>
          <p>{stats.totalOrders}</p>
        </div>
        <div className="card">
          <h3>Total Collections</h3>
          <p>{stats.totalCollections}</p>
        </div>
        <div className="card">
          <h3>Total Expenses</h3>
          <p>{stats.totalExpenses}</p>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
