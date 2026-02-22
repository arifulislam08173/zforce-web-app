import React, { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/api";
import Loader from "../../components/Common/Loader";
import { AuthContext } from "../../context/AuthContext";
import "./user.css";

import { FiArrowLeft, FiSave } from "react-icons/fi";

const UserForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const { user } = useContext(AuthContext);
  const role = String(user?.role || "").toUpperCase();
  const isAdmin = role === "ADMIN";

  const [loading, setLoading] = useState(Boolean(isEdit));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "FIELD",
    isActive: true,
    password: "",
  });

  const title = useMemo(() => (isEdit ? "Edit User" : "Add User"), [isEdit]);

  const loadUser = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await api.get(`/users/${id}`);
      const u = res.data?.data;
      setForm({
        name: u?.name || "",
        email: u?.email || "",
        role: String(u?.role || "FIELD").toUpperCase(),
        isActive: Boolean(u?.isActive),
        password: "",
      });
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.message || "Failed to load user");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isEdit) loadUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const validate = () => {
    if (!form.name.trim()) return "Name is required";
    if (!form.email.trim()) return "Email is required";
    if (!isEdit && !form.password.trim()) return "Password is required";
    return "";
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const msg = validate();
    if (msg) {
      setError(msg);
      return;
    }

    setSaving(true);
    setError("");

    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        role: String(form.role).toUpperCase(),
        isActive: Boolean(form.isActive),
      };

      if (form.password.trim()) payload.password = form.password.trim();

      if (isEdit) {
        await api.patch(`/users/${id}`, payload);
      } else {
        await api.post(`/users`, payload);
      }

      navigate("/users");
    } catch (e2) {
      console.error(e2);
      setError(e2?.response?.data?.message || "Failed to save user");
    } finally {
      setSaving(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="usr-page">
        <div className="usr-card">
          <div className="usr-alert-error">You are not allowed to access Users.</div>
        </div>
      </div>
    );
  }

  if (loading) return <Loader />;

  return (
    <div className="usr-page">
      <div className="usr-header">
        <div>
          <h2 className="usr-title">{title}</h2>
          <p className="usr-subtitle">{isEdit ? "Update user info" : "Create a new user"}</p>
        </div>

        <button className="usr-btn-secondary" type="button" onClick={() => navigate("/users")}>
          <FiArrowLeft style={{ marginRight: 8 }} />
          Back
        </button>
      </div>

      {error ? <div className="usr-alert-error">{error}</div> : null}

      <form className="usr-card" onSubmit={onSubmit}>
        <div className="usr-grid-2">
          <div>
            <label className="usr-label">Name</label>
            <input
              className="usr-input"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Full name"
            />
          </div>

          <div>
            <label className="usr-label">Email</label>
            <input
              className="usr-input"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="email@example.com"
            />
          </div>

          <div>
            <label className="usr-label">Role</label>
            <select
              className="usr-input"
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
            >
              <option value="FIELD">FIELD</option>
              <option value="MANAGER">MANAGER</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </div>

          <div>
            <label className="usr-label">Status</label>
            <select
              className="usr-input"
              value={String(form.isActive)}
              onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.value === "true" }))}
            >
              <option value="true">ACTIVE</option>
              <option value="false">INACTIVE</option>
            </select>
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <label className="usr-label">{isEdit ? "New Password (optional)" : "Password"}</label>
            <input
              className="usr-input"
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              placeholder={isEdit ? "Leave empty to keep current password" : "Set a password"}
            />
          </div>
        </div>

        <div className="usr-form-footer">
          <button className="usr-btn-primary" disabled={saving}>
            <FiSave style={{ marginRight: 8 }} />
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserForm;
