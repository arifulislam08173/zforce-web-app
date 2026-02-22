import React, { useState, useEffect, useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/api";
import Loader from "../../components/Common/Loader";
import "./RouteForm.css";
import { AuthContext } from "../../context/AuthContext";

const RouteForm = () => {
  const { user } = useContext(AuthContext);
  const canManage = user?.role === "ADMIN" || user?.role === "MANAGER";

  const [data, setData] = useState({ userId: "", customerId: "", date: "", notes: "" });

  const [users, setUsers] = useState([]);
  const [customers, setCustomers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  useEffect(() => {
    if (!canManage) {
      navigate("/route");
      return;
    }

    const load = async () => {
      try {
        setLoading(true);
        setError("");

        const [uRes, cRes] = await Promise.all([
          api.get("/users/dropdown"),
          api.get("/customers/dropdown"),
        ]);

        setUsers(uRes.data || []);
        setCustomers(cRes.data || []);

        if (isEdit) {
          const rRes = await api.get(`/route/${id}`);
          const r = rRes.data;

          setData({
            userId: r.userId || "",
            customerId: r.customerId || "",
            date: r.date || "",
            notes: r.notes || "",
          });
        } else {
          setData((d) => ({
            ...d,
            date: new Date().toISOString().slice(0, 10),
          }));
        }
      } catch (e) {
        console.error(e);
        setError("Failed to load form data.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id, isEdit, canManage, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!data.userId || !data.customerId || !data.date) {
      setError("Please fill all required fields.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        userId: data.userId,
        customerId: data.customerId,
        date: data.date,
        notes: data.notes?.trim() || null,
      };

      if (isEdit) await api.put(`/route/${id}`, payload);
      else await api.post("/route", payload);

      navigate("/route");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Save failed. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!canManage) return null;
  if (loading) return <Loader />;

  const disableSave = users.length === 0 || customers.length === 0;

  return (
    <div className="rtf-page">
      <div className="rtf-header">
        <div>
          <h2 className="rtf-title">{isEdit ? "Edit Route" : "Create Route"}</h2>
          <p className="rtf-subtitle">Assign user and customer for a specific date</p>
        </div>

        <button className="rtf-btnSecondary" type="button" onClick={() => navigate("/route")}>
          Back
        </button>
      </div>

      {error ? <div className="rtf-alertError">{error}</div> : null}

      {disableSave ? (
        <div className="rtf-alertError">
          Users or Customers not found. Please create at least one user and one customer first.
        </div>
      ) : null}

      <form className="rtf-card" onSubmit={handleSubmit}>
        <div className="rtf-grid2">
          <div>
            <label className="rtf-label">User *</label>
            <select
              className="rtf-input"
              value={data.userId}
              onChange={(e) => setData((d) => ({ ...d, userId: e.target.value }))}
            >
              <option value="">Select user</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="rtf-label">Customer *</label>
            <select
              className="rtf-input"
              value={data.customerId}
              onChange={(e) => setData((d) => ({ ...d, customerId: e.target.value }))}
            >
              <option value="">Select customer</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.phone ? `(${c.phone})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="rtf-label">Date *</label>
            <input
              className="rtf-input"
              type="date"
              value={data.date}
              onChange={(e) => setData((d) => ({ ...d, date: e.target.value }))}
            />
          </div>

          <div>
            <label className="rtf-label">Notes</label>
            <input
              className="rtf-input"
              value={data.notes}
              onChange={(e) => setData((d) => ({ ...d, notes: e.target.value }))}
              placeholder="Optional"
            />
          </div>
        </div>

        <div className="rtf-footer">
          <div className="rtf-muted">* Required fields</div>

          <button className="rtf-btnPrimary" type="submit" disabled={saving || disableSave}>
            {saving ? "Saving..." : isEdit ? "Update Route" : "Create Route"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RouteForm;
