// import React, { useEffect, useState } from 'react';
// import api from '../../api/api';
// import Loader from '../../components/Common/Loader';

// const Customer = () => {
//   const [customers, setCustomers] = useState([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const fetchCustomers = async () => {
//       try {
//         const res = await api.get('/customer');
//         setCustomers(res.data);
//       } catch (err) {
//         console.error(err);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchCustomers();
//   }, []);

//   if (loading) return <Loader />;

//   return (
//     <div>
//       <h2>Customers</h2>
//       <table border="1" cellPadding="8">
//         <thead>
//           <tr>
//             <th>Name</th>
//             <th>Email</th>
//             <th>Phone</th>
//             <th>Assigned To</th>
//           </tr>
//         </thead>
//         <tbody>
//           {customers.map((c) => (
//             <tr key={c.id}>
//               <td>{c.name}</td>
//               <td>{c.email}</td>
//               <td>{c.phone}</td>
//               <td>{c.assignedUser}</td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );
// };

// export default Customer;







import React, { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";
import Loader from "../../components/Common/Loader";
import Pagination from "../../components/Common/Pagination";
import { AuthContext } from "../../context/AuthContext";

import { FiEdit2, FiEye, FiPlus, FiTrash2, FiX } from "react-icons/fi";
import "./customer.css";

const fmt = (v) => (v ? String(v) : "-");

const StatusBadge = ({ status }) => {
  const s = String(status || "ACTIVE").toUpperCase();
  const cls = s === "INACTIVE" ? "c-badge c-badge-inactive" : "c-badge c-badge-active";
  return <span className={cls}>{s}</span>;
};

const IconButton = ({ title, onClick, children, disabled, variant = "default" }) => (
  <button
    type="button"
    className={`c-icon-btn ${variant}`}
    title={title}
    onClick={onClick}
    disabled={disabled}
  >
    {children}
  </button>
);

const Modal = ({ open, title, subtitle, onClose, children, footer }) => {
  if (!open) return null;
  return (
    <div className="c-modal-overlay" onMouseDown={onClose}>
      <div className="c-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="c-modal-header">
          <div>
            <div className="c-modal-title">{title}</div>
            {subtitle ? <div className="c-modal-subtitle">{subtitle}</div> : null}
          </div>
          <button className="c-icon-btn" type="button" onClick={onClose} title="Close">
            <FiX size={18} />
          </button>
        </div>

        <div className="c-modal-body">{children}</div>

        {footer ? <div className="c-modal-footer">{footer}</div> : null}
      </div>
    </div>
  );
};

const CustomerViewModal = ({ open, onClose, row }) => {
  return (
    <Modal
      open={open}
      title="Customer Details"
      subtitle={row?.id || ""}
      onClose={onClose}
      footer={
        <div className="c-modal-actions">
          <button className="c-btn-secondary" type="button" onClick={onClose}>
            Close
          </button>
        </div>
      }
    >
      <div className="c-kv-grid">
        <div className="c-kv">
          <div className="c-k">Name</div>
          <div className="c-v">{fmt(row?.name)}</div>
        </div>
        <div className="c-kv">
          <div className="c-k">Phone</div>
          <div className="c-v">{fmt(row?.phone)}</div>
        </div>
        <div className="c-kv">
          <div className="c-k">Email</div>
          <div className="c-v">{fmt(row?.email)}</div>
        </div>
        <div className="c-kv">
          <div className="c-k">Status</div>
          <div className="c-v">
            <StatusBadge status={row?.status} />
          </div>
        </div>

        <div className="c-kv" style={{ gridColumn: "1 / -1" }}>
          <div className="c-k">Address</div>
          <div className="c-v">{fmt(row?.address)}</div>
        </div>

        <div className="c-kv">
          <div className="c-k">City</div>
          <div className="c-v">{fmt(row?.city)}</div>
        </div>
        <div className="c-kv">
          <div className="c-k">State</div>
          <div className="c-v">{fmt(row?.state)}</div>
        </div>
        <div className="c-kv">
          <div className="c-k">Zip</div>
          <div className="c-v">{fmt(row?.zip)}</div>
        </div>

        <div className="c-kv" style={{ gridColumn: "1 / -1" }}>
          <div className="c-k">Assigned To</div>
          <div className="c-v">{fmt(row?.fieldUser?.name || row?.assignedTo)}</div>
        </div>
      </div>
    </Modal>
  );
};

const ConfirmDeleteModal = ({ open, onClose, name, onConfirm, loading }) => {
  return (
    <Modal
      open={open}
      title="Delete Customer?"
      subtitle={name ? `This will remove: ${name}` : ""}
      onClose={loading ? () => {} : onClose}
      footer={
        <div className="c-modal-actions">
          <button className="c-btn-secondary" type="button" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button className="c-btn-danger" type="button" onClick={onConfirm} disabled={loading}>
            {loading ? "Deleting..." : "Delete"}
          </button>
        </div>
      }
    >
      <div className="c-hint">
        If this customer is linked to orders/visits, delete may fail depending on DB constraints.
      </div>
    </Modal>
  );
};

const Customer = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const role = String(user?.role || "").toUpperCase();
  const isAdmin = role === "ADMIN";
  const isAdminManager = role === "ADMIN" || role === "MANAGER";

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");

  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  // filters
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [assignedTo, setAssignedTo] = useState("");

  // user dropdown for filter + form
  const [users, setUsers] = useState([]);

  // modals
  const [viewOpen, setViewOpen] = useState(false);
  const [viewRow, setViewRow] = useState(null);

  const [delOpen, setDelOpen] = useState(false);
  const [delRow, setDelRow] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const userMap = useMemo(() => {
    const m = new Map();
    (users || []).forEach((u) => m.set(String(u.id), u));
    return m;
  }, [users]);

  const fetchUsers = async () => {
    if (!isAdminManager) return;
    const res = await api.get("/users/dropdown");
    setUsers(res.data || []);
  };

  const fetchCustomers = async (page = 1, limit = pagination.limit) => {
    setError("");
    setLoading(true);

    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(limit));
      if (q.trim()) params.set("q", q.trim());
      if (status) params.set("status", status);
      if (assignedTo) params.set("assignedTo", assignedTo);

      const res = await api.get(`/customers?${params.toString()}`);
      setRows(res.data?.data || []);
      setPagination(res.data?.pagination || { page, limit, total: 0, totalPages: 1 });
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.message || "Failed to load customers");
      setRows([]);
      setPagination({ page: 1, limit, total: 0, totalPages: 1 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        await fetchUsers();
        await fetchCustomers(1, pagination.limit);
      } finally {
        setLoading(false);
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSearch = async (e) => {
    e.preventDefault();
    await fetchCustomers(1, pagination.limit);
  };

  const openView = (r) => {
    setViewRow(r);
    setViewOpen(true);
  };

  const openDelete = (r) => {
    setDelRow(r);
    setDelOpen(true);
  };

  const doDelete = async () => {
    if (!delRow?.id) return;

    try {
      setDeleting(true);
      await api.delete(`/customers/${delRow.id}`);
      setDelOpen(false);
      setDelRow(null);
      await fetchCustomers(pagination.page, pagination.limit);
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.message || "Failed to delete customer");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="c-page">
      <div className="c-header">
        <div>
          <h2 className="c-title">Customers</h2>
          <p className="c-subtitle">
            {isAdmin ? "Create and manage customers." : "View customer list."}
          </p>
        </div>

        {isAdmin ? (
          <button className="c-btn-primary" type="button" onClick={() => navigate("/customer/add")}>
            <FiPlus style={{ marginRight: 8 }} />
            Add Customer
          </button>
        ) : null}
      </div>

      {error ? <div className="c-alert-error">{error}</div> : null}

      {/* Filters */}
      <form className="c-card c-filters" onSubmit={onSearch}>
        <div>
          <label className="c-label">Search</label>
          <input
            className="c-input"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="name / phone / email / city"
          />
        </div>

        <div>
          <label className="c-label">Status</label>
          <select className="c-input" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
          </select>
        </div>

        {isAdminManager ? (
          <div>
            <label className="c-label">Assigned To</label>
            <select className="c-input" value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)}>
              <option value="">All</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <button className="c-btn-secondary" type="submit">
          Search
        </button>
      </form>

      {/* Table */}
      <div className="c-card">
        <div className="c-table-wrap">
          <table className="c-table">
            <thead>
              <tr>
                <th style={{ width: 60 }}>#</th>
                <th>Name</th>
                <th>Phone</th>
                <th>City</th>
                <th>Status</th>
                <th>Assigned</th>
                <th className="c-th-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length ? (
                rows.map((r, index) => {
                  const assignedName =
                    r?.fieldUser?.name || userMap.get(String(r.assignedTo))?.name || r.assignedTo || "-";

                  return (
                    <tr key={r.id || index}>
                      <td>{(pagination.page - 1) * pagination.limit + index + 1}</td>
                      <td>{r.name || "-"}</td>
                      <td>{r.phone || "-"}</td>
                      <td>{r.city || "-"}</td>
                      <td>
                        <StatusBadge status={r.status} />
                      </td>
                      <td>{assignedName}</td>
                      <td className="c-actions">
                        <div className="c-action-row">
                          <IconButton title="View" onClick={() => openView(r)}>
                            <FiEye size={18} />
                          </IconButton>

                          <IconButton
                            title={isAdmin ? "Edit" : "Edit (admin only)"}
                            onClick={() => navigate(`/customer/edit/${r.id}`)}
                            disabled={!isAdmin}
                          >
                            <FiEdit2 size={18} />
                          </IconButton>

                          <IconButton
                            title={isAdmin ? "Delete" : "Delete (admin only)"}
                            onClick={() => openDelete(r)}
                            disabled={!isAdmin}
                            variant="danger"
                          >
                            <FiTrash2 size={18} />
                          </IconButton>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="c-empty">
                    No customers found
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <Pagination
            pagination={pagination}
            onPageChange={(p) => fetchCustomers(p, pagination.limit)}
            onLimitChange={(newLimit) => fetchCustomers(1, newLimit)}
            limitOptions={[10, 20, 50]}
          />
        </div>
      </div>

      {/* Modals */}
      <CustomerViewModal open={viewOpen} onClose={() => setViewOpen(false)} row={viewRow} />

      <ConfirmDeleteModal
        open={delOpen}
        onClose={() => setDelOpen(false)}
        name={delRow?.name}
        onConfirm={doDelete}
        loading={deleting}
      />
    </div>
  );
};

export default Customer;
