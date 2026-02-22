import React, { useEffect, useMemo, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";
import Loader from "../../components/Common/Loader";
import "./expense.css";
import { FiEye, FiCheck, FiXCircle, FiFilter, FiPlus, FiX } from "react-icons/fi";
import { AuthContext } from "../../context/AuthContext";
import Pagination from "../../components/Common/Pagination";

const isoDate = (d) => {
  const x = new Date(d);
  const yyyy = x.getFullYear();
  const mm = String(x.getMonth() + 1).padStart(2, "0");
  const dd = String(x.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const money = (n) => Number(n || 0).toFixed(2);

const StatusBadge = ({ status }) => {
  const s = String(status || "PENDING").toUpperCase();
  const cls =
    s === "APPROVED"
      ? "exp-badge exp-badge-approved"
      : s === "REJECTED"
      ? "exp-badge exp-badge-rejected"
      : "exp-badge exp-badge-pending";
  return <span className={cls}>{s}</span>;
};

const IconButton = ({ title, onClick, variant = "default", children, disabled }) => {
  return (
    <button
      type="button"
      className={`exp-icon-btn ${variant}`}
      title={title}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

const Modal = ({ open, title, subtitle, onClose, children, footer }) => {
  if (!open) return null;
  return (
    <div className="exp-modal-overlay" onMouseDown={onClose}>
      <div className="exp-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="exp-modal-header">
          <div>
            <div className="exp-modal-title">{title}</div>
            {subtitle ? <div className="exp-modal-subtitle">{subtitle}</div> : null}
          </div>
          <button className="exp-icon-btn" type="button" onClick={onClose} title="Close">
            <FiX size={18} />
          </button>
        </div>

        <div className="exp-modal-body">{children}</div>

        {footer ? <div className="exp-modal-footer">{footer}</div> : null}
      </div>
    </div>
  );
};

const ExpenseViewModal = ({ open, expense, userName, onClose }) => {
  return (
    <Modal
      open={open}
      title="Expense Details"
      subtitle={expense?.id}
      onClose={onClose}
      footer={
        <div className="exp-modal-actions">
          <button className="exp-btn-secondary" type="button" onClick={onClose}>
            Close
          </button>
        </div>
      }
    >
      {!expense ? (
        <div className="exp-empty">No data</div>
      ) : (
        <div className="exp-modal-grid">
          <div className="exp-modal-card">
            <div className="exp-kv">
              <div className="exp-k">User</div>
              <div className="exp-v">{userName || expense.userId || "-"}</div>
            </div>
            <div className="exp-kv">
              <div className="exp-k">Category</div>
              <div className="exp-v">{expense.category || "-"}</div>
            </div>
            <div className="exp-kv">
              <div className="exp-k">Amount</div>
              <div className="exp-v">{money(expense.amount)}</div>
            </div>
          </div>

          <div className="exp-modal-card">
            <div className="exp-kv">
              <div className="exp-k">Incurred At</div>
              <div className="exp-v">
                {expense.incurredAt
                  ? String(expense.incurredAt).slice(0, 19).replace("T", " ")
                  : "-"}
              </div>
            </div>
            <div className="exp-kv">
              <div className="exp-k">Status</div>
              <div className="exp-v">
                <StatusBadge status={expense.status} />
              </div>
            </div>
            <div className="exp-kv">
              <div className="exp-k">Receipt</div>
              <div className="exp-v">
                {expense.receiptUrl ? (
                  <a href={expense.receiptUrl} target="_blank" rel="noreferrer">
                    Open
                  </a>
                ) : (
                  <span className="exp-muted">None</span>
                )}
              </div>
            </div>
          </div>

          {expense.description ? (
            <div className="exp-modal-notes">
              <div className="exp-k">Description</div>
              <div className="exp-v" style={{ fontWeight: 500 }}>
                {expense.description}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </Modal>
  );
};

const Expense = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const role = String(user?.role || "").toUpperCase();
  const isField = role === "FIELD";
  const isAdminManager = role === "ADMIN" || role === "MANAGER";

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");

  // dropdown users (for report + name mapping)
  const [users, setUsers] = useState([]);

  // filters
  const [fromDate, setFromDate] = useState(isoDate(new Date()));
  const [toDate, setToDate] = useState(isoDate(new Date()));
  const [userId, setUserId] = useState("");
  const [status, setStatus] = useState("");

  // view modal
  const [viewOpen, setViewOpen] = useState(false);
  const [viewExpense, setViewExpense] = useState(null);

  // client pagination
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  const userMap = useMemo(() => {
    const m = new Map();
    (users || []).forEach((u) => m.set(String(u.id), u.name));
    if (user?.id && user?.name) m.set(String(user.id), user.name);
    return m;
  }, [users, user]);

  const fetchUsersDropdown = async () => {
    const res = await api.get("/users/dropdown");
    setUsers(res.data || []);
  };

  const fetchExpenses = async (page = 1, limit = pagination.limit) => {
    setError("");
    setLoading(true);

    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(limit));

      if (isField) {
        // FIELD list
        if (status) params.set("status", status); // if backend supports; safe to send
        const res = await api.get(`/expenses/my?${params.toString()}`);

        setRows(res.data?.data || []);
        setPagination(res.data?.pagination || { page, limit, total: 0, totalPages: 1 });
      } else {
        // ADMIN/MANAGER report
        params.set("fromDate", fromDate);
        params.set("toDate", toDate);
        if (userId) params.set("userId", userId);
        if (status) params.set("status", status);

        const res = await api.get(`/expenses/report?${params.toString()}`);

        setRows(res.data?.data || []);
        setPagination(res.data?.pagination || { page, limit, total: 0, totalPages: 1 });
      }
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.message || "Failed to load expenses");
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
        if (!isField) await fetchUsersDropdown();
        await fetchExpenses(1, pagination.limit);
      } finally {
        setLoading(false);
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const openView = (exp) => {
    setViewExpense(exp);
    setViewOpen(true);
  };

  const approveReject = async (id, nextStatus) => {
    const ok = window.confirm(`Are you sure you want to ${nextStatus.toLowerCase()} this expense?`);
    if (!ok) return;

    try {
      await api.patch(`/expenses/${id}/status`, { status: nextStatus });
      await fetchExpenses(1, pagination.limit);
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.message || "Status update failed");
    }
  };

  const onSearch = async (e) => {
    e.preventDefault();
    await fetchExpenses(1, pagination.limit);
  };

  if (loading) return <Loader />;

  return (
    <div className="exp-page">
      <div className="exp-header">
        <div>
          <h2 className="exp-title">Expenses</h2>
          <p className="exp-subtitle">
            {isField ? "Submit & track your expenses" : "Review and approve field expenses"}
          </p>
        </div>

        {isField ? (
          <button className="exp-btn-primary" type="button" onClick={() => navigate("/expense/add")}>
            <FiPlus style={{ marginRight: 8 }} />
            Add Expense
          </button>
        ) : null}
      </div>

      {error ? <div className="exp-alert-error">{error}</div> : null}

      {/* Filters */}
      <form className="exp-card exp-filters" onSubmit={onSearch}>
        {!isField ? (
          <>
            <div>
              <label className="exp-label">From</label>
              <input className="exp-input" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            </div>

            <div>
              <label className="exp-label">To</label>
              <input className="exp-input" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </div>

            <div>
              <label className="exp-label">User</label>
              <select className="exp-input" value={userId} onChange={(e) => setUserId(e.target.value)}>
                <option value="">All users</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
          </>
        ) : null}

        <div>
          <label className="exp-label">Status</label>
          <select className="exp-input" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All status</option>
            <option value="PENDING">PENDING</option>
            <option value="APPROVED">APPROVED</option>
            <option value="REJECTED">REJECTED</option>
          </select>
        </div>

        <button className="exp-btn-secondary" type="submit" title="Apply filters">
          <FiFilter style={{ marginRight: 8 }} />
          Search
        </button>
      </form>

      {/* Table */}
      <div className="exp-card">
        <div className="exp-table-wrap">
          <table className="exp-table">
            <thead>
              <tr>
                <th style={{ width: 70 }}>#</th>
                <th>User</th>
                <th>Category</th>
                <th style={{ textAlign: "right" }}>Amount</th>
                <th>Incurred</th>
                <th>Status</th>
                <th className="exp-th-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length ? (
                 rows.map((r, index) => {
                  const rowNo = (pagination.page - 1) * pagination.limit + index + 1;
                  const uName = userMap.get(String(r.userId)) || "-";

                  return (
                    <tr key={r.id || `${r.userId}-${rowNo}`}>
                      <td>{rowNo}</td>
                      <td>{uName}</td>
                      <td>{r.category || "-"}</td>
                      <td style={{ textAlign: "right" }}>{money(r.amount)}</td>
                      <td>{r.incurredAt ? String(r.incurredAt).slice(0, 10) : "-"}</td>
                      <td>
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="exp-actions">
                        <div className="exp-action-row">
                          <IconButton title="View" onClick={() => openView(r)}>
                            <FiEye size={18} />
                          </IconButton>

                          {isAdminManager ? (
                            <>
                              <IconButton
                                title="Approve"
                                variant="success"
                                onClick={() => approveReject(r.id, "APPROVED")}
                                disabled={String(r.status || "").toUpperCase() === "APPROVED"}
                              >
                                <FiCheck size={18} />
                              </IconButton>

                              <IconButton
                                title="Reject"
                                variant="danger"
                                onClick={() => approveReject(r.id, "REJECTED")}
                                disabled={String(r.status || "").toUpperCase() === "REJECTED"}
                              >
                                <FiXCircle size={18} />
                              </IconButton>
                            </>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="exp-empty">
                    No expenses found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pager */}
        {/* <div className="exp-pager">
          <div className="exp-pager-info">
            Page {pageSafe} of {totalPages} • Total {total}
          </div>

          <button
            className="exp-btn-secondary"
            type="button"
            disabled={pageSafe <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Prev
          </button>

          <button
            className="exp-btn-secondary"
            type="button"
            disabled={pageSafe >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </button>
        </div> */}

        <Pagination
          pagination={pagination}
          onPageChange={(p) => fetchExpenses(p, pagination.limit)}
          onLimitChange={(newLimit) => fetchExpenses(1, newLimit)}
          limitOptions={[10, 20, 50]}
        />

      </div>

      {/* View Modal */}
      <ExpenseViewModal
        open={viewOpen}
        expense={viewExpense}
        userName={viewExpense ? userMap.get(String(viewExpense.userId)) : ""}
        onClose={() => setViewOpen(false)}
      />
    </div>
  );
};

export default Expense;
