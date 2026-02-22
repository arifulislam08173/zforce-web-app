import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";
import Loader from "../../components/Common/Loader";
import { FiPlus, FiEdit2 } from "react-icons/fi";
import "./company.css";

const Company = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/companies");
      setRows(res.data?.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <Loader />;

  return (
    <div className="co-page">
      <div className="co-header">
        <div>
          <h2 className="co-title">Companies</h2>
          <p className="co-subtitle">Manage company master data</p>
        </div>
        <div className="co-actions">
          <button className="co-btn primary" onClick={() => navigate("/company/add")}>
            <FiPlus /> Add Company
          </button>
        </div>
      </div>

      <div className="co-card">
        <table className="co-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Contact</th>
              <th>Email</th>
              <th>BIN</th>
              <th>TIN</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td>{c.contactNo || "-"}</td>
                <td>{c.email || "-"}</td>
                <td>{c.binNo || "-"}</td>
                <td>{c.tiinNo || "-"}</td>
                <td>
                  <button className="co-btn" onClick={() => navigate(`/company/edit/${c.id}`)}>
                    <FiEdit2 /> Edit
                  </button>
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={6} style={{ opacity: 0.7, padding: 14 }}>
                  No companies found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Company;
