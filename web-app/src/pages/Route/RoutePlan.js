import React, { useEffect, useMemo, useState, useContext } from "react";
import { Link } from "react-router-dom";
import api from "../../api/api";
import Loader from "../../components/Common/Loader";
import "./RoutePlan.css";
import { FiEye, FiEdit2, FiTrash2, FiPlus, FiRefreshCw, FiX } from "react-icons/fi";
import { AuthContext } from "../../context/AuthContext";
import Pagination from "../../components/Common/Pagination";

const IconButton = ({ title, onClick, variant = "default", children, disabled }) => {
  return (
    <button
      type="button"
      className={`rt-iconBtn ${variant}`}
      title={title}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

const RouteViewModal = ({ open, data, onClose }) => {
  if (!open) return null;

  return (
    <div className="rt-modalOverlay" onMouseDown={onClose}>
      <div className="rt-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="rt-modalHeader">
          <div>
            <div className="rt-modalTitle">Route Details</div>
            <div className="rt-modalSubtitle">{data?.id || "-"}</div>
          </div>
          <button className="rt-iconBtn" type="button" onClick={onClose} title="Close">
            <FiX size={18} />
          </button>
        </div>

        <div className="rt-modalGrid">
          <div className="rt-modalCard">
            <div className="rt-kv">
              <div className="rt-k">User</div>
              <div className="rt-v">{data?.userName || "-"}</div>
            </div>
            <div className="rt-kv">
              <div className="rt-k">Customer</div>
              <div className="rt-v">{data?.customerName || "-"}</div>
            </div>
          </div>

          <div className="rt-modalCard">
            <div className="rt-kv">
              <div className="rt-k">Date</div>
              <div className="rt-v">{data?.date || "-"}</div>
            </div>
            <div className="rt-kv">
              <div className="rt-k">Notes</div>
              <div className="rt-v">{data?.notes || "-"}</div>
            </div>
          </div>
        </div>

        <div className="rt-modalFooter">
          <button className="rt-btnSecondary" type="button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const RoutePlan = () => {
  const { user } = useContext(AuthContext);

  const role = String(user?.role || "").toUpperCase();
  const isField = role === "FIELD";
  const canManage = role === "ADMIN" || role === "MANAGER";

  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  // Filters
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [userId, setUserId] = useState("");
  const [customerId, setCustomerId] = useState("");

  // Dropdowns
  const [users, setUsers] = useState([]);
  const [customers, setCustomers] = useState([]);

  // Modal
  const [viewOpen, setViewOpen] = useState(false);
  const [viewData, setViewData] = useState(null);

  const queryParams = useMemo(
    () => ({
      page: meta.page,
      limit: meta.limit,
      search: search.trim() || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      userId: !isField && userId ? userId : undefined,
      customerId: customerId ? customerId : undefined,
    }),
    [meta.page, meta.limit, search, dateFrom, dateTo, userId, customerId, isField]
  );

  const fetchRoutes = async (keepLoading = false) => {
    try {
      if (!keepLoading) setLoading(true);
      const res = await api.get("/route", { params: queryParams });

      setRows(res.data?.data || []);
      setMeta((m) => ({
        ...m,
        ...(res.data?.meta || {}),
      }));
    } catch (err) {
      console.error("Error fetching routes:", err);
    } finally {
      setLoading(false);
    }
  };

  // FIXED: Role-safe dropdown fetching
  const fetchDropdowns = async () => {
    try {
      // Customers dropdown is safe for all roles (FIELD uses it in many screens)
      const cRes = await api.get("/customers/dropdown");
      setCustomers(cRes.data || []);

      // Users dropdown should be ADMIN/MANAGER only
      if (canManage) {
        const uRes = await api.get("/users/dropdown");
        setUsers(uRes.data || []);
      } else {
        // FIELD doesn't need users dropdown, but keep array stable
        setUsers(user?.id ? [{ id: user.id, name: user.name || "Me" }] : []);
      }
    } catch (e) {
      console.error("Dropdown load failed:", e);
      // Don’t break the page if dropdown fails
      setUsers(user?.id ? [{ id: user.id, name: user.name || "Me" }] : []);
      setCustomers([]);
    }
  };

  useEffect(() => {
    fetchDropdowns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canManage]);

  useEffect(() => {
    fetchRoutes(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryParams]);

  const onReset = () => {
    setSearch("");
    setDateFrom("");
    setDateTo("");
    setUserId("");
    setCustomerId("");
    setMeta((m) => ({ ...m, page: 1 }));
  };

  const onDelete = async (id) => {
    if (!canManage) return;
    const ok = window.confirm("Are you sure you want to delete this route?");
    if (!ok) return;

    try {
      setBusyId(id);
      await api.delete(`/route/${id}`);
      fetchRoutes(true);
    } catch (err) {
      console.error("Error deleting route:", err);
      alert(err.response?.data?.message || "Delete failed.");
    } finally {
      setBusyId(null);
    }
  };

  const openView = (row) => {
    setViewData(row);
    setViewOpen(true);
  };

  if (loading) return <Loader />;

  return (
    <div className="rt-page">
      <div className="rt-header">
        <div>
          <h2 className="rt-title">Route Plans</h2>
          <p className="rt-subtitle">
            {isField ? "View your assigned routes." : "Create and manage route planning."}
          </p>
        </div>

        {canManage ? (
          <Link to="/route/add" className="rt-btnPrimary rt-btnWithIcon">
            <FiPlus />
            <span>Create Route</span>
          </Link>
        ) : null}
      </div>

      <div className="rt-card rt-filters">
        <input
          className="rt-input"
          value={search}
          onChange={(e) => {
            setMeta((m) => ({ ...m, page: 1 }));
            setSearch(e.target.value);
          }}
          placeholder="Search (user / customer)"
        />

        <input
          className="rt-input"
          type="date"
          value={dateFrom}
          onChange={(e) => {
            setMeta((m) => ({ ...m, page: 1 }));
            setDateFrom(e.target.value);
          }}
          title="Date From"
        />

        <input
          className="rt-input"
          type="date"
          value={dateTo}
          onChange={(e) => {
            setMeta((m) => ({ ...m, page: 1 }));
            setDateTo(e.target.value);
          }}
          title="Date To"
        />

        {!isField ? (
          <select
            className="rt-input"
            value={userId}
            onChange={(e) => {
              setMeta((m) => ({ ...m, page: 1 }));
              setUserId(e.target.value);
            }}
          >
            <option value="">All users</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        ) : null}

        <select
          className="rt-input"
          value={customerId}
          onChange={(e) => {
            setMeta((m) => ({ ...m, page: 1 }));
            setCustomerId(e.target.value);
          }}
        >
          <option value="">All customers</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <button className="rt-btnSecondary rt-btnWithIcon" type="button" onClick={onReset}>
          <FiRefreshCw />
          Reset
        </button>
      </div>

      <div className="rt-card">
        <div className="rt-tableWrap">
          <table className="rt-table">
            <thead>
              <tr>
                <th style={{ width: 60 }}>#</th>
                <th>Date</th>
                <th>User</th>
                <th>Customer</th>
                <th className="rt-thActions">Actions</th>
              </tr>
            </thead>

            <tbody>
              {rows.length ? (
                rows.map((r, index) => (
                  <tr key={r.id}>
                    <td>{(meta.page - 1) * meta.limit + index + 1}</td>
                    <td>{r.date || "-"}</td>
                    <td className="rt-strong">{r.userName || "-"}</td>
                    <td>{r.customerName || "-"}</td>

                    <td className="rt-actionsCell">
                      <div className="rt-actionRow">
                        <IconButton title="View" onClick={() => openView(r)}>
                          <FiEye size={18} />
                        </IconButton>

                        {canManage ? (
                          <>
                            <Link className="rt-iconLink" to={`/route/edit/${r.id}`} title="Edit">
                              <span className="rt-iconBtn">
                                <FiEdit2 size={18} />
                              </span>
                            </Link>

                            <IconButton
                              title="Delete"
                              variant="danger"
                              onClick={() => onDelete(r.id)}
                              disabled={busyId === r.id}
                            >
                              <FiTrash2 size={18} />
                            </IconButton>
                          </>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="rt-empty">
                    No routes found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          pagination={meta}
          onPageChange={(p) => setMeta((m) => ({ ...m, page: p }))}
          onLimitChange={(newLimit) => setMeta((m) => ({ ...m, page: 1, limit: newLimit }))}
          limitOptions={[10, 20, 50]}
        />
      </div>

      <RouteViewModal open={viewOpen} data={viewData} onClose={() => setViewOpen(false)} />
    </div>
  );
};

export default RoutePlan;

