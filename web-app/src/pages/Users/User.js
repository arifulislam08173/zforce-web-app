import React, { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";
import Loader from "../../components/Common/Loader";
import Pagination from "../../components/Common/Pagination";
import { AuthContext } from "../../context/AuthContext";
import "./user.css";

import { FiPlus, FiEdit2, FiTrash2, FiX, FiSearch } from "react-icons/fi";

const Modal = ({ open, title, subtitle, onClose, children, footer }) => {
  if (!open) return null;
  return (
    <div className="usr-modal-overlay" onMouseDown={onClose}>
      <div className="usr-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="usr-modal-header">
          <div>
            <div className="usr-modal-title">{title}</div>
            {subtitle ? <div className="usr-modal-subtitle">{subtitle}</div> : null}
          </div>
          <button className="usr-icon-btn" type="button" onClick={onClose} title="Close">
            <FiX size={18} />
          </button>
        </div>
        <div className="usr-modal-body">{children}</div>
        {footer ? <div className="usr-modal-footer">{footer}</div> : null}
      </div>
    </div>
  );
};

const badgeRole = (role) => {
  const r = String(role || "").toUpperCase();
  const cls =
    r === "ADMIN" ? "usr-badge usr-badge-admin" : r === "MANAGER" ? "usr-badge usr-badge-manager" : "usr-badge";
  return <span className={cls}>{r || "-"}</span>;
};

const badgeActive = (active) => (
  <span className={`usr-pill ${active ? "ok" : "off"}`}>{active ? "ACTIVE" : "INACTIVE"}</span>
);

const User = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const role = String(user?.role || "").toUpperCase();

  const isAdmin = role === "ADMIN";

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");

  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  // filters
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState(""); // "" | true | false

  // delete modal
  const [delOpen, setDelOpen] = useState(false);
  const [delRow, setDelRow] = useState(null);
  const [delSaving, setDelSaving] = useState(false);

  const canDelete = useMemo(() => {
    if (!isAdmin) return false;
    if (!delRow) return false;
    // block deleting yourself (backend also blocks)
    return String(delRow.id) !== String(user?.id);
  }, [isAdmin, delRow, user]);

  const fetchUsers = async (page = 1, limit = pagination.limit) => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(limit));
      if (q.trim()) params.set("q", q.trim());
      if (roleFilter) params.set("role", roleFilter);
      if (activeFilter !== "") params.set("isActive", activeFilter);

      const res = await api.get(`/users?${params.toString()}`);
      setRows(res.data?.data || []);
      setPagination(res.data?.pagination || { page, limit, total: 0, totalPages: 1 });
    } catch (e) {
      console.error(e);
      setRows([]);
      setPagination({ page: 1, limit, total: 0, totalPages: 1 });
      setError(e?.response?.data?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(1, pagination.limit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSearch = (e) => {
    e.preventDefault();
    fetchUsers(1, pagination.limit);
  };

  const openDelete = (row) => {
    setDelRow(row);
    setDelOpen(true);
  };

  const confirmDelete = async () => {
    if (!delRow) return;
    try {
      setDelSaving(true);
      await api.delete(`/users/${delRow.id}`);
      setDelOpen(false);
      setDelRow(null);
      await fetchUsers(pagination.page, pagination.limit);
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.message || "Failed to delete user");
    } finally {
      setDelSaving(false);
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
          <h2 className="usr-title">Users</h2>
          <p className="usr-subtitle">Admin can create and manage users</p>
        </div>

        <button className="usr-btn-primary" type="button" onClick={() => navigate("/users/add")}>
          <FiPlus style={{ marginRight: 8 }} /> Add User
        </button>
      </div>

      {error ? <div className="usr-alert-error">{error}</div> : null}

      <form className="usr-card usr-filters" onSubmit={onSearch}>
        <div className="usr-filter">
          <label className="usr-label">Search</label>
          <div className="usr-search">
            <FiSearch style={{ opacity: 0.7 }} />
            <input
              className="usr-input usr-input-search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="name / email / role"
            />
          </div>
        </div>

        <div className="usr-filter">
          <label className="usr-label">Role</label>
          <select className="usr-input" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="">All</option>
            <option value="FIELD">FIELD</option>
            <option value="MANAGER">MANAGER</option>
            <option value="ADMIN">ADMIN</option>
          </select>
        </div>

        <div className="usr-filter">
          <label className="usr-label">Status</label>
          <select className="usr-input" value={activeFilter} onChange={(e) => setActiveFilter(e.target.value)}>
            <option value="">All</option>
            <option value="true">ACTIVE</option>
            <option value="false">INACTIVE</option>
          </select>
        </div>

        <div className="usr-filter usr-filter-btn">
          <button className="usr-btn-secondary" type="submit">
            Search
          </button>
        </div>
      </form>

      <div className="usr-card">
        <div className="usr-table-wrap">
          <table className="usr-table">
            <thead>
              <tr>
                <th style={{ width: 70 }}>#</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th className="usr-th-actions">Actions</th>
              </tr>
            </thead>

            <tbody>
              {rows.length ? (
                rows.map((r, index) => (
                  <tr key={r.id}>
                    <td>{(pagination.page - 1) * pagination.limit + index + 1}</td>
                    <td>{r.name || "-"}</td>
                    <td>{r.email || "-"}</td>
                    <td>{badgeRole(r.role)}</td>
                    <td>{badgeActive(Boolean(r.isActive))}</td>
                    <td className="usr-actions">
                      <div className="usr-action-row">
                        <button
                          type="button"
                          className="usr-icon-btn"
                          title="Edit"
                          onClick={() => navigate(`/users/edit/${r.id}`)}
                        >
                          <FiEdit2 size={18} />
                        </button>

                        <button
                          type="button"
                          className="usr-icon-btn danger"
                          title="Delete"
                          onClick={() => openDelete(r)}
                          disabled={String(r.id) === String(user?.id)}
                        >
                          <FiTrash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="usr-empty">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <Pagination
            pagination={pagination}
            onPageChange={(p) => fetchUsers(p, pagination.limit)}
            onLimitChange={(newLimit) => fetchUsers(1, newLimit)}
            limitOptions={[10, 20, 50]}
          />
        </div>
      </div>

      <Modal
        open={delOpen}
        title="Delete user?"
        subtitle={delRow ? `${delRow.name || "-"} • ${delRow.email || "-"}` : ""}
        onClose={() => {
          if (delSaving) return;
          setDelOpen(false);
          setDelRow(null);
        }}
        footer={
          <div className="usr-modal-actions">
            <button
              className="usr-btn-secondary"
              type="button"
              onClick={() => {
                setDelOpen(false);
                setDelRow(null);
              }}
              disabled={delSaving}
            >
              Cancel
            </button>

            <button className="usr-btn-danger" type="button" onClick={confirmDelete} disabled={delSaving || !canDelete}>
              {delSaving ? "Deleting..." : "Delete"}
            </button>
          </div>
        }
      >
        {!canDelete ? (
          <div className="usr-alert-error">You cannot delete your own account.</div>
        ) : (
          <div className="usr-muted">
            This will remove the user (soft delete). Other records will still reference their userId.
          </div>
        )}
      </Modal>
    </div>
  );
};

export default User;
