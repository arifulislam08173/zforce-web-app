import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";
import Loader from "../../components/Common/Loader";
import "./order.css";
import { FiEye, FiEdit2, FiTrash2, FiX } from "react-icons/fi";
import Pagination from "../../components/Common/Pagination";
import { AuthContext } from "../../context/AuthContext";

const formatDate = (v) => (v ? String(v).slice(0, 10) : "-");
const money = (n) => Number(n || 0).toFixed(2);

const StatusBadge = ({ status }) => {
  const s = String(status || "PENDING").toUpperCase();
  const cls =
    s === "COMPLETED"
      ? "badge badge-completed"
      : s === "CANCELLED"
        ? "badge badge-cancelled"
        : "badge badge-pending";
  return <span className={cls}>{s}</span>;
};

const IconButton = ({ title, onClick, variant = "default", children }) => {
  return (
    <button
      type="button"
      className={`icon-btn ${variant}`}
      title={title}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

const OrderViewModal = ({ open, orderId, onClose, onEdit }) => {
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    const load = async () => {
      if (!open || !orderId) return;
      try {
        setLoading(true);
        setErr("");
        setOrder(null);
        const res = await api.get(`/orders/${orderId}`);
        setOrder(res.data);
      } catch (e) {
        console.error(e);
        setErr(e?.response?.data?.message || "Failed to load order details");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [open, orderId]);

  if (!open) return null;

  // const orderNo = order?.orderNumber || order?.orderNo || orderId;

  const items = order?.items || [];
  const computedTotal = items.reduce(
    (sum, it) =>
      sum + Number(it.total ?? Number(it.price) * Number(it.quantity) ?? 0),
    0,
  );
  const total = order?.totalAmount ?? computedTotal;

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-head-left">
            <div className="modal-title">Order Details</div>
            {/* <div className="modal-subtitle">{orderId}</div> */}
            <div className="modal-subtitle">
              {loading ? (
                "Loading…"
              ) : order?.orderNumber ? (
                <>
                  Order No: <b>{order.orderNumber}</b>
                </>
              ) : (
                "-"
              )}
            </div>
          </div>

          <div className="modal-head-right">
            <button
              className="btn-secondary"
              type="button"
              onClick={async () => {
                try {
                  const res = await api.get(`/orders/${orderId}/invoice.pdf`, {
                    responseType: "blob",
                  });
                  const url = window.URL.createObjectURL(res.data);
                  const a = document.createElement("a");
                  a.href = url;
                  // a.download = `invoice-${orderId}.pdf`;
                  const fileNo = order?.orderNumber || orderId;
                  a.download = `invoice-${fileNo}.pdf`;
                  document.body.appendChild(a);
                  a.click();
                  a.remove();
                  window.URL.revokeObjectURL(url);
                } catch (e) {
                  alert(
                    e?.response?.data?.message || "Invoice download failed",
                  );
                }
              }}
            >
              Download Invoice (PDF)
            </button>

            <button
              className="icon-btn modal-close-btn"
              type="button"
              onClick={onClose}
              title="Close"
            >
              <FiX size={18} />
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: 16 }}>
            <Loader />
          </div>
        ) : err ? (
          <div className="alert-error" style={{ marginTop: 12 }}>
            {err}
          </div>
        ) : order ? (
          <>
            <div className="modal-grid">
              <div className="modal-ordercard">
                <div className="kv">
                  <div className="k">Customer</div>
                  <div className="v">
                    {order.customer?.name || "-"}
                    {order.customer?.phone ? (
                      <span className="muted"> ({order.customer.phone})</span>
                    ) : null}
                  </div>
                </div>

                <div className="kv">
                  <div className="k">User</div>
                  <div className="v">{order.user?.name || "-"}</div>
                </div>
              </div>

              <div className="modal-ordercard">
                <div className="kv">
                  <div className="k">Date</div>
                  <div className="v">{formatDate(order.date)}</div>
                </div>
                <div className="kv">
                  <div className="k">Status</div>
                  <div className="v">
                    <StatusBadge status={order.status} />
                  </div>
                </div>
              </div>
            </div>

            {order.notes ? (
              <div className="modal-notes">
                <div className="k">Notes</div>
                <div className="v" style={{ fontWeight: 500 }}>
                  {order.notes}
                </div>
              </div>
            ) : null}

            <div className="modal-table-wrap">
              <table className="table modal-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>SKU</th>
                    <th style={{ textAlign: "right" }}>Qty</th>
                    <th style={{ textAlign: "right" }}>Price</th>
                    <th style={{ textAlign: "right" }}>Line Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it) => (
                    <tr key={it.id}>
                      <td>{it.product?.name || it.productId}</td>
                      <td>{it.product?.sku || "-"}</td>
                      <td style={{ textAlign: "right" }}>{it.quantity}</td>
                      <td style={{ textAlign: "right" }}>{money(it.price)}</td>
                      <td style={{ textAlign: "right" }}>
                        {money(
                          it.total ?? Number(it.price) * Number(it.quantity),
                        )}
                      </td>
                    </tr>
                  ))}
                  {!items.length ? (
                    <tr>
                      <td colSpan={5} className="empty">
                        No items found
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>

            <div className="modal-footer">
              <div className="modal-total">
                Total: <span>{money(total)}</span>
              </div>

              <div className="modal-actions">
                <button
                  className="btn-secondary"
                  type="button"
                  onClick={onClose}
                >
                  Close
                </button>
                <button className="btn-primary" type="button" onClick={onEdit}>
                  Edit Order
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="empty">No data</div>
        )}
      </div>
    </div>
  );
};

const Order = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const role = String(user?.role || "").toUpperCase();
  const isAdminManager = role === "ADMIN" || role === "MANAGER";

  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  // filters
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [userId, setUserId] = useState("");
  const [customerId, setCustomerId] = useState("");

  // dropdowns (admin/manager)
  const [users, setUsers] = useState([]);
  const [customers, setCustomers] = useState([]);

  // view modal
  const [viewId, setViewId] = useState("");
  const [viewOpen, setViewOpen] = useState(false);

  const fetchDropdowns = async () => {
    if (!isAdminManager) return;
    const [uRes, cRes] = await Promise.all([
      api.get("/users/dropdown"),
      api.get("/customers/dropdown"),
    ]);
    setUsers(uRes.data || []);
    setCustomers(cRes.data || []);
  };

  const fetchOrders = async (page = 1, limit = pagination.limit) => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(limit));

      if (status) params.set("status", status);
      if (q.trim()) params.set("q", q.trim());

      if (fromDate) params.set("fromDate", fromDate);
      if (toDate) params.set("toDate", toDate);

      if (isAdminManager && userId) params.set("userId", userId);
      if (customerId) params.set("customerId", customerId);

      const res = await api.get(`/orders?${params.toString()}`);
      setOrders(res.data?.data || []);
      setPagination(
        res.data?.pagination || { page, limit, total: 0, totalPages: 1 },
      );
    } catch (err) {
      console.error(err);
      setOrders([]);
      setPagination({ page: 1, limit, total: 0, totalPages: 1 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await fetchDropdowns();
      await fetchOrders(1, pagination.limit);
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSearch = (e) => {
    e.preventDefault();
    fetchOrders(1, pagination.limit);
  };

  const openView = (id) => {
    setViewId(id);
    setViewOpen(true);
  };

  const goEdit = (id) => navigate(`/order/edit/${id}`);

  const onDelete = async (id) => {
    const ok = window.confirm("Are you sure you want to delete this order?");
    if (!ok) return;

    try {
      await api.delete(`/orders/${id}`);
      fetchOrders(pagination.page, pagination.limit);
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Delete failed");
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="order-page">
      <div className="order-header">
        <div>
          <h2 className="order-title">Orders</h2>
          <p className="order-subtitle">
            Manage orders, items and stock updates
          </p>
        </div>

        <button
          className="btn-primary"
          type="button"
          onClick={() => navigate("/order/add")}
        >
          + Create Order
        </button>
      </div>

      <form className="ordercard order-filters" onSubmit={onSearch}>
        <input
          className="input of-input of-search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search (customer / user / phone / order id)"
        />

        <input
          className="input of-input of-date"
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          title="From date"
        />

        <input
          className="input of-input of-date"
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          title="To date"
        />

        {isAdminManager ? (
          <>
            <select
              className="input of-input of-select"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            >
              <option value="">All users</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>

            <select
              className="input of-input of-select"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
            >
              <option value="">All customers</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.phone ? `(${c.phone})` : ""}
                </option>
              ))}
            </select>
          </>
        ) : null}

        <select
          className="input of-input of-select"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All status</option>
          <option value="PENDING">PENDING</option>
          <option value="COMPLETED">COMPLETED</option>
          <option value="CANCELLED">CANCELLED</option>
        </select>

        <button className="btn-secondary of-btn" type="submit">
          Search
        </button>
      </form>

      <div className="ordercard">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 60 }}>#</th>
                <th>Date</th>
                <th>User</th>
                <th>Customer</th>
                <th>Phone</th>
                <th>Total</th>
                <th>Status</th>
                <th className="th-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.length ? (
                orders.map((o, index) => (
                  <tr key={o.id || index}>
                    <td>
                      {(pagination.page - 1) * pagination.limit + index + 1}
                    </td>
                    <td>{formatDate(o.date)}</td>
                    <td>{o.user?.name || "-"}</td>
                    <td>{o.customer?.name || "-"}</td>
                    <td>{o.customer?.phone || "-"}</td>
                    <td>{money(o.totalAmount)}</td>
                    <td>
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="actions">
                      <div className="action-row">
                        <IconButton title="View" onClick={() => openView(o.id)}>
                          <FiEye size={18} />
                        </IconButton>

                        <IconButton title="Edit" onClick={() => goEdit(o.id)}>
                          <FiEdit2 size={18} />
                        </IconButton>

                        <IconButton
                          title="Delete"
                          variant="danger"
                          onClick={() => onDelete(o.id)}
                        >
                          <FiTrash2 size={18} />
                        </IconButton>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="empty">
                    No orders found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          pagination={pagination}
          onPageChange={(p) => fetchOrders(p, pagination.limit)}
          onLimitChange={(newLimit) => fetchOrders(1, newLimit)}
          limitOptions={[10, 20, 50]}
        />
      </div>

      <OrderViewModal
        open={viewOpen}
        orderId={viewId}
        onClose={() => setViewOpen(false)}
        onEdit={() => {
          setViewOpen(false);
          goEdit(viewId);
        }}
      />
    </div>
  );
};

export default Order;
