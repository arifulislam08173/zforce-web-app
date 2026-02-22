// import React, { useEffect, useState } from 'react';
// import api from '../../api/api';
// import Loader from '../../components/Common/Loader';

// const Collection = () => {
//   const [collections, setCollections] = useState([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const fetchCollections = async () => {
//       try {
//         const res = await api.get('/collection');
//         setCollections(res.data);
//       } catch (err) {
//         console.error(err);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchCollections();
//   }, []);

//   if (loading) return <Loader />;

//   return (
//     <div>
//       <h2>Collections</h2>
//       <table border="1" cellPadding="8">
//         <thead>
//           <tr>
//             <th>User</th>
//             <th>Customer</th>
//             <th>Date</th>
//             <th>Amount</th>
//             <th>Status</th>
//           </tr>
//         </thead>
//         <tbody>
//           {collections.map((c) => (
//             <tr key={c.id}>
//               <td>{c.userName}</td>
//               <td>{c.customerName}</td>
//               <td>{c.date}</td>
//               <td>{c.amount}</td>
//               <td>{c.status}</td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );
// };

// export default Collection;





// import React, { useEffect, useMemo, useState, useContext } from "react";
// import { useNavigate } from "react-router-dom";
// import api from "../../api/api";
// import Loader from "../../components/Common/Loader";
// import "./collection.css";

// import { FiEye, FiPlus, FiFilter, FiCheck, FiXCircle, FiX } from "react-icons/fi";
// import { AuthContext } from "../../context/AuthContext";

// const isoDate = (d) => {
//   const x = new Date(d);
//   const yyyy = x.getFullYear();
//   const mm = String(x.getMonth() + 1).padStart(2, "0");
//   const dd = String(x.getDate()).padStart(2, "0");
//   return `${yyyy}-${mm}-${dd}`;
// };

// const money = (n) => Number(n || 0).toFixed(2);

// const StatusBadge = ({ status }) => {
//   const s = String(status || "PENDING").toUpperCase();
//   const cls =
//     s === "APPROVED"
//       ? "col-badge col-badge-approved"
//       : s === "REJECTED"
//       ? "col-badge col-badge-rejected"
//       : "col-badge col-badge-pending";
//   return <span className={cls}>{s}</span>;
// };

// const IconButton = ({ title, onClick, variant = "default", children, disabled }) => {
//   return (
//     <button
//       type="button"
//       className={`col-icon-btn ${variant}`}
//       title={title}
//       onClick={onClick}
//       disabled={disabled}
//     >
//       {children}
//     </button>
//   );
// };

// const Modal = ({ open, title, subtitle, onClose, children, footer }) => {
//   if (!open) return null;
//   return (
//     <div className="col-modal-overlay" onMouseDown={onClose}>
//       <div className="col-modal" onMouseDown={(e) => e.stopPropagation()}>
//         <div className="col-modal-header">
//           <div>
//             <div className="col-modal-title">{title}</div>
//             {subtitle ? <div className="col-modal-subtitle">{subtitle}</div> : null}
//           </div>
//           <button className="col-icon-btn" type="button" onClick={onClose} title="Close">
//             <FiX size={18} />
//           </button>
//         </div>

//         <div className="col-modal-body">{children}</div>

//         {footer ? <div className="col-modal-footer">{footer}</div> : null}
//       </div>
//     </div>
//   );
// };

// const CollectionViewModal = ({ open, row, userName, onClose }) => {
//   const [orderLoading, setOrderLoading] = useState(false);
//   const [order, setOrder] = useState(null);
//   const [err, setErr] = useState("");

//   useEffect(() => {
//     const loadOrder = async () => {
//       if (!open || !row?.orderId) return;
//       try {
//         setOrderLoading(true);
//         setErr("");
//         setOrder(null);
//         // Order details endpoint already exists in your project (used in Order page)
//         const res = await api.get(`/orders/${row.orderId}`);
//         setOrder(res.data);
//       } catch (e) {
//         // not fatal, we can still show collection info
//         setErr(e?.response?.data?.message || "Could not load order details");
//       } finally {
//         setOrderLoading(false);
//       }
//     };
//     loadOrder();
//   }, [open, row?.orderId]);

//   return (
//     <Modal
//       open={open}
//       title="Collection Details"
//       subtitle={row?.id}
//       onClose={onClose}
//       footer={
//         <div className="col-modal-actions">
//           <button className="col-btn-secondary" type="button" onClick={onClose}>
//             Close
//           </button>
//         </div>
//       }
//     >
//       {!row ? (
//         <div className="col-empty">No data</div>
//       ) : (
//         <div className="col-modal-grid">
//           <div className="col-modal-card">
//             <div className="col-kv">
//               <div className="col-k">User</div>
//               <div className="col-v">{userName || row.userId || "-"}</div>
//             </div>

//             <div className="col-kv">
//               <div className="col-k">Amount</div>
//               <div className="col-v">{money(row.amount)}</div>
//             </div>

//             <div className="col-kv">
//               <div className="col-k">Payment</div>
//               <div className="col-v">{row.paymentType || "-"}</div>
//             </div>

//             <div className="col-kv">
//               <div className="col-k">Status</div>
//               <div className="col-v">
//                 <StatusBadge status={row.status} />
//               </div>
//             </div>
//           </div>

//           <div className="col-modal-card">
//             <div className="col-kv">
//               <div className="col-k">Collected At</div>
//               <div className="col-v">
//                 {row.collectedAt
//                   ? String(row.collectedAt).slice(0, 19).replace("T", " ")
//                   : "-"}
//               </div>
//             </div>

//             <div className="col-kv">
//               <div className="col-k">Order ID</div>
//               <div className="col-v" style={{ wordBreak: "break-all" }}>
//                 {row.orderId || "-"}
//               </div>
//             </div>

//             <div className="col-kv">
//               <div className="col-k">Receipt</div>
//               <div className="col-v">
//                 {row.receiptUrl ? (
//                   <a href={row.receiptUrl} target="_blank" rel="noreferrer">
//                     Open
//                   </a>
//                 ) : (
//                   <span className="col-muted">None</span>
//                 )}
//               </div>
//             </div>
//           </div>

//           <div className="col-modal-notes">
//             <div className="col-k" style={{ marginBottom: 6 }}>
//               Order Info
//             </div>

//             {orderLoading ? (
//               <div className="col-muted">Loading order…</div>
//             ) : err ? (
//               <div className="col-muted">{err}</div>
//             ) : order ? (
//               <div style={{ display: "grid", gap: 6 }}>
//                 <div className="col-v" style={{ fontWeight: 600 }}>
//                   Customer: {order.customer?.name || "-"}
//                   {order.customer?.phone ? (
//                     <span className="col-muted"> ({order.customer.phone})</span>
//                   ) : null}
//                 </div>
//                 <div className="col-muted">Order Total: {money(order.totalAmount)}</div>
//                 <div className="col-muted">
//                   Order Date: {order.date ? String(order.date).slice(0, 10) : "-"}
//                 </div>
//               </div>
//             ) : (
//               <div className="col-muted">No order data</div>
//             )}
//           </div>
//         </div>
//       )}
//     </Modal>
//   );
// };

// const Collection = () => {
//   const navigate = useNavigate();
//   const { user } = useContext(AuthContext);

//   const role = String(user?.role || "").toUpperCase();
//   const isField = role === "FIELD";
//   const isAdminManager = role === "ADMIN" || role === "MANAGER";

//   const [loading, setLoading] = useState(true);
//   const [rows, setRows] = useState([]);
//   const [error, setError] = useState("");

//   // dropdown users (Admin/Manager)
//   const [users, setUsers] = useState([]);

//   // filters
//   const [fromDate, setFromDate] = useState(isoDate(new Date()));
//   const [toDate, setToDate] = useState(isoDate(new Date()));
//   const [userId, setUserId] = useState("");
//   const [status, setStatus] = useState("");

//   // view modal
//   const [viewOpen, setViewOpen] = useState(false);
//   const [viewRow, setViewRow] = useState(null);

//   // simple client pagination
//   const [page, setPage] = useState(1);
//   const limit = 10;

//   const userMap = useMemo(() => {
//     const m = new Map();
//     (users || []).forEach((u) => m.set(String(u.id), u.name));
//     if (user?.id && user?.name) m.set(String(user.id), user.name);
//     return m;
//   }, [users, user]);

//   const fetchUsersDropdown = async () => {
//     const res = await api.get("/users/dropdown");
//     setUsers(res.data || []);
//   };

//   const fetchCollections = async () => {
//     setError("");
//     setLoading(true);
//     try {
//       if (isField) {
//         // FIELD: GET /collections/my
//         const res = await api.get("/collections/my");
//         setRows(res.data?.data || []);
//       } else {
//         // ADMIN/MANAGER: GET /collections/report?fromDate&toDate&userId
//         const params = new URLSearchParams();
//         params.set("fromDate", fromDate);
//         params.set("toDate", toDate);
//         if (userId) params.set("userId", userId);
//         if (status) params.set("status", status);

//         const res = await api.get(`/collections/report?${params.toString()}`);
//         setRows(res.data?.data || []);
//       }
//       setPage(1);
//     } catch (e) {
//       console.error(e);
//       setError(e?.response?.data?.message || "Failed to load collections");
//       setRows([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     const init = async () => {
//       try {
//         setLoading(true);
//         if (isAdminManager) await fetchUsersDropdown();
//         await fetchCollections();
//       } finally {
//         setLoading(false);
//       }
//     };
//     init();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   const filteredRows = useMemo(() => {
//     let data = [...(rows || [])];
//     if (status) data = data.filter((r) => String(r.status || "").toUpperCase() === status);
//     return data;
//   }, [rows, status]);

//   const total = filteredRows.length;
//   const totalPages = Math.max(1, Math.ceil(total / limit));
//   const pageSafe = Math.min(page, totalPages);
//   const start = (pageSafe - 1) * limit;
//   const pageRows = filteredRows.slice(start, start + limit);

//   const openView = (r) => {
//     setViewRow(r);
//     setViewOpen(true);
//   };

//   const approveReject = async (id, nextStatus) => {
//     const ok = window.confirm(`Are you sure you want to ${nextStatus.toLowerCase()} this collection?`);
//     if (!ok) return;

//     try {
//       // PATCH /collections/:id/status
//       await api.patch(`/collections/${id}/status`, { status: nextStatus });
//       await fetchCollections();
//     } catch (e) {
//       console.error(e);
//       alert(e?.response?.data?.message || "Status update failed");
//     }
//   };

//   const onSearch = async (e) => {
//     e.preventDefault();
//     await fetchCollections();
//   };

//   if (loading) return <Loader />;

//   return (
//     <div className="col-page">
//       <div className="col-header">
//         <div>
//           <h2 className="col-title">Collections</h2>
//           <p className="col-subtitle">
//             {isField ? "Submit & track your collections" : "Review & approve field collections"}
//           </p>
//         </div>

//         {isField ? (
//           <button className="col-btn-primary" type="button" onClick={() => navigate("/collection/add")}>
//             <FiPlus style={{ marginRight: 8 }} />
//             Add Collection
//           </button>
//         ) : null}
//       </div>

//       {error ? <div className="col-alert-error">{error}</div> : null}

//       {/* Filters */}
//       <form className="col-card col-filters" onSubmit={onSearch}>
//         {isAdminManager ? (
//           <>
//             <div>
//               <label className="col-label">From</label>
//               <input className="col-input" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
//             </div>

//             <div>
//               <label className="col-label">To</label>
//               <input className="col-input" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
//             </div>

//             <div>
//               <label className="col-label">User</label>
//               <select className="col-input" value={userId} onChange={(e) => setUserId(e.target.value)}>
//                 <option value="">All users</option>
//                 {users.map((u) => (
//                   <option key={u.id} value={u.id}>
//                     {u.name}
//                   </option>
//                 ))}
//               </select>
//             </div>
//           </>
//         ) : null}

//         <div>
//           <label className="col-label">Status</label>
//           <select className="col-input" value={status} onChange={(e) => setStatus(e.target.value)}>
//             <option value="">All status</option>
//             <option value="PENDING">PENDING</option>
//             <option value="APPROVED">APPROVED</option>
//             <option value="REJECTED">REJECTED</option>
//           </select>
//         </div>

//         <button className="col-btn-secondary" type="submit" title="Apply filters">
//           <FiFilter style={{ marginRight: 8 }} />
//           Search
//         </button>
//       </form>

//       {/* Table */}
//       <div className="col-card">
//         <div className="col-table-wrap">
//           <table className="col-table">
//             <thead>
//               <tr>
//                 <th style={{ width: 70 }}>#</th>
//                 <th>User</th>
//                 <th>Order</th>
//                 <th style={{ textAlign: "right" }}>Amount</th>
//                 <th>Payment</th>
//                 <th>Collected</th>
//                 <th>Status</th>
//                 <th className="col-th-actions">Actions</th>
//               </tr>
//             </thead>

//             <tbody>
//               {pageRows.length ? (
//                 pageRows.map((r, index) => {
//                   const rowNo = (pageSafe - 1) * limit + index + 1;
//                   const uName = userMap.get(String(r.userId)) || "-";

//                   return (
//                     <tr key={r.id || `${r.userId}-${rowNo}`}>
//                       <td>{rowNo}</td>
//                       <td>{uName}</td>
//                       <td title={r.orderId} style={{ maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis" }}>
//                         {r.orderId ? String(r.orderId).slice(0, 10) + "…" : "-"}
//                       </td>
//                       <td style={{ textAlign: "right" }}>{money(r.amount)}</td>
//                       <td>{r.paymentType || "-"}</td>
//                       <td>{r.collectedAt ? String(r.collectedAt).slice(0, 10) : "-"}</td>
//                       <td>
//                         <StatusBadge status={r.status} />
//                       </td>
//                       <td className="col-actions">
//                         <div className="col-action-row">
//                           <IconButton title="View" onClick={() => openView(r)}>
//                             <FiEye size={18} />
//                           </IconButton>

//                           {isAdminManager ? (
//                             <>
//                               <IconButton
//                                 title="Approve"
//                                 variant="success"
//                                 onClick={() => approveReject(r.id, "APPROVED")}
//                                 disabled={String(r.status || "").toUpperCase() === "APPROVED"}
//                               >
//                                 <FiCheck size={18} />
//                               </IconButton>

//                               <IconButton
//                                 title="Reject"
//                                 variant="danger"
//                                 onClick={() => approveReject(r.id, "REJECTED")}
//                                 disabled={String(r.status || "").toUpperCase() === "REJECTED"}
//                               >
//                                 <FiXCircle size={18} />
//                               </IconButton>
//                             </>
//                           ) : null}
//                         </div>
//                       </td>
//                     </tr>
//                   );
//                 })
//               ) : (
//                 <tr>
//                   <td colSpan={8} className="col-empty">
//                     No collections found
//                   </td>
//                 </tr>
//               )}
//             </tbody>
//           </table>
//         </div>

//         {/* Pager */}
//         <div className="col-pager">
//           <div className="col-pager-info">
//             Page {pageSafe} of {totalPages} • Total {total}
//           </div>

//           <button
//             className="col-btn-secondary"
//             type="button"
//             disabled={pageSafe <= 1}
//             onClick={() => setPage((p) => Math.max(1, p - 1))}
//           >
//             Prev
//           </button>

//           <button
//             className="col-btn-secondary"
//             type="button"
//             disabled={pageSafe >= totalPages}
//             onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
//           >
//             Next
//           </button>
//         </div>
//       </div>

//       <CollectionViewModal
//         open={viewOpen}
//         row={viewRow}
//         userName={viewRow ? userMap.get(String(viewRow.userId)) : ""}
//         onClose={() => setViewOpen(false)}
//       />
//     </div>
//   );
// };

// export default Collection;






import React, { useEffect, useMemo, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";
import Loader from "../../components/Common/Loader";
import "./collection.css";

import { FiEye, FiPlus, FiFilter, FiCheck, FiXCircle, FiX } from "react-icons/fi";
import { AuthContext } from "../../context/AuthContext";
import Pagination from "../../components/Common/Pagination";

const isoDate = (d) => {
  const x = new Date(d);
  const yyyy = x.getFullYear();
  const mm = String(x.getMonth() + 1).padStart(2, "0");
  const dd = String(x.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};


const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
};


const money = (n) => Number(n || 0).toFixed(2);

const StatusBadge = ({ status }) => {
  const s = String(status || "PENDING").toUpperCase();
  const cls =
    s === "APPROVED"
      ? "col-badge col-badge-approved"
      : s === "REJECTED"
      ? "col-badge col-badge-rejected"
      : "col-badge col-badge-pending";
  return <span className={cls}>{s}</span>;
};

const IconButton = ({ title, onClick, variant = "default", children, disabled }) => {
  return (
    <button
      type="button"
      className={`col-icon-btn ${variant}`}
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
    <div className="col-modal-overlay" onMouseDown={onClose}>
      <div className="col-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="col-modal-header">
          <div>
            <div className="col-modal-title">{title}</div>
            {subtitle ? <div className="col-modal-subtitle">{subtitle}</div> : null}
          </div>
          <button className="col-icon-btn" type="button" onClick={onClose} title="Close">
            <FiX size={18} />
          </button>
        </div>

        <div className="col-modal-body">{children}</div>

        {footer ? <div className="col-modal-footer">{footer}</div> : null}
      </div>
    </div>
  );
};

const CollectionViewModal = ({ open, row, userName, onClose }) => {
  const [orderLoading, setOrderLoading] = useState(false);
  const [order, setOrder] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    const loadOrder = async () => {
      if (!open || !row?.orderId) return;
      try {
        setOrderLoading(true);
        setErr("");
        setOrder(null);
        const res = await api.get(`/orders/${row.orderId}`);
        setOrder(res.data);
      } catch (e) {
        setErr(e?.response?.data?.message || "Could not load order details");
      } finally {
        setOrderLoading(false);
      }
    };
    loadOrder();
  }, [open, row?.orderId]);

  return (
    <Modal
      open={open}
      title="Collection Details"
      subtitle={row?.id}
      onClose={onClose}
    //   footer={
    //     <div className="col-modal-actions">
    //       <button className="col-btn-secondary" type="button" onClick={onClose}>
    //         Close
    //       </button>
          
    //     </div>
    //   }

    footer={
  <div className="col-modal-actions">
    <button className="col-btn-secondary" type="button" onClick={onClose}>
      Close
    </button>

    <button
      className="col-btn-primary"
      type="button"
      onClick={async () => {
        try {
          const res = await api.get(`/collections/${row.id}/receipt.pdf`, { responseType: "blob" });
          downloadBlob(res.data, `receipt-${row.id}.pdf`);
        } catch (e) {
          alert(e?.response?.data?.message || "Receipt download failed");
        }
      }}
    >
      Download Receipt (PDF)
    </button>
  </div>
}

    >
      {!row ? (
        <div className="col-empty">No data</div>
      ) : (
        <div className="col-modal-grid">
          <div className="col-modal-card">
            <div className="col-kv">
              <div className="col-k">User</div>
              <div className="col-v">{userName || row.userId || "-"}</div>
            </div>

            <div className="col-kv">
              <div className="col-k">Amount</div>
              <div className="col-v">{money(row.amount)}</div>
            </div>

            <div className="col-kv">
              <div className="col-k">Payment</div>
              <div className="col-v">{row.paymentType || "-"}</div>
            </div>

            <div className="col-kv">
              <div className="col-k">Status</div>
              <div className="col-v">
                <StatusBadge status={row.status} />
              </div>
            </div>
          </div>

          <div className="col-modal-card">
            <div className="col-kv">
              <div className="col-k">Collected At</div>
              <div className="col-v">
                {row.collectedAt ? String(row.collectedAt).slice(0, 19).replace("T", " ") : "-"}
              </div>
            </div>

            <div className="col-kv">
              <div className="col-k">Order ID</div>
              <div className="col-v" style={{ wordBreak: "break-all" }}>
                {row.orderId || "-"}
              </div>
            </div>

            <div className="col-kv">
              <div className="col-k">Receipt</div>
              <div className="col-v">
                {row.receiptUrl ? (
                  <a href={row.receiptUrl} target="_blank" rel="noreferrer">
                    Open
                  </a>
                ) : (
                  <span className="col-muted">None</span>
                )}
              </div>
            </div>
          </div>

          <div className="col-modal-notes">
            <div className="col-k" style={{ marginBottom: 6 }}>
              Order Info
            </div>

            {orderLoading ? (
              <div className="col-muted">Loading order…</div>
            ) : err ? (
              <div className="col-muted">{err}</div>
            ) : order ? (
              <div style={{ display: "grid", gap: 6 }}>
                <div className="col-v" style={{ fontWeight: 600 }}>
                  Customer: {order.customer?.name || "-"}
                  {order.customer?.phone ? <span className="col-muted"> ({order.customer.phone})</span> : null}
                </div>
                <div className="col-muted">Order Total: {money(order.totalAmount)}</div>
                <div className="col-muted">Order Date: {order.date ? String(order.date).slice(0, 10) : "-"}</div>
              </div>
            ) : (
              <div className="col-muted">No order data</div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
};

const Collection = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const role = String(user?.role || "").toUpperCase();
  const isField = role === "FIELD";
  const isAdminManager = role === "ADMIN" || role === "MANAGER";

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");

  const [users, setUsers] = useState([]);

  const [fromDate, setFromDate] = useState(isoDate(new Date()));
  const [toDate, setToDate] = useState(isoDate(new Date()));
  const [userId, setUserId] = useState("");
  const [status, setStatus] = useState("");

  const [viewOpen, setViewOpen] = useState(false);
  const [viewRow, setViewRow] = useState(null);

  const [orderNoMap, setOrderNoMap] = useState(new Map());

  // server pagination
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

  const fetchCollections = async (page = 1, limit = pagination.limit) => {
  setError("");
  setLoading(true);

  try {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(limit));

    if (status) params.set("status", status);

    if (isField) {
      const res = await api.get(`/collections/my?${params.toString()}`);
      const list = res.data?.data || [];
      setRows(list);

      const ids = [...new Set(list.map((x) => x.orderId).filter(Boolean))];
      ids.forEach((id) => getOrderNumber(id));

      setPagination(res.data?.pagination || { page, limit, total: 0, totalPages: 1 });
    } else {
      params.set("fromDate", fromDate);
      params.set("toDate", toDate);
      if (userId) params.set("userId", userId);

      const res = await api.get(`/collections/report?${params.toString()}`);
      const list = res.data?.data || [];
      setRows(list);

      const ids = [...new Set(list.map((x) => x.orderId).filter(Boolean))];
      ids.forEach((id) => getOrderNumber(id));

      setPagination(res.data?.pagination || { page, limit, total: 0, totalPages: 1 });
    }
  } catch (e) {
    console.error(e);
    setError(e?.response?.data?.message || "Failed to load collections");
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
        if (isAdminManager) await fetchUsersDropdown();
        await fetchCollections(1, pagination.limit);
      } finally {
        setLoading(false);
      }
    };
    init();
    // eslint-disable-next-line
  }, []);

  const openView = (r) => {
    setViewRow(r);
    setViewOpen(true);
  };

  const approveReject = async (id, nextStatus) => {
    const ok = window.confirm(`Are you sure you want to ${nextStatus.toLowerCase()} this collection?`);
    if (!ok) return;

    try {
      await api.patch(`/collections/${id}/status`, { status: nextStatus });
      await fetchCollections(1, pagination.limit);
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.message || "Status update failed");
    }
  };

  const onSearch = async (e) => {
    e.preventDefault();
    await fetchCollections(1, pagination.limit);
  };

  const getOrderNumber = async (orderId) => {
  if (!orderId) return "-";
  const key = String(orderId);

  // cached
  if (orderNoMap.has(key)) return orderNoMap.get(key);

  try {
    const res = await api.get(`/orders/${orderId}`);
    const ord = res.data;

    const orderNo = ord?.orderNumber || ord?.orderNo || ord?.invoiceNo || "-";

    setOrderNoMap((prev) => {
      const next = new Map(prev);
      next.set(key, orderNo);
      return next;
    });

    return orderNo;
  } catch (e) {
    setOrderNoMap((prev) => {
      const next = new Map(prev);
      next.set(key, "-");
      return next;
    });
    return "-";
  }
};



  if (loading) return <Loader />;

  return (
    <div className="col-page">
      <div className="col-header">
        <div>
          <h2 className="col-title">Collections</h2>
          <p className="col-subtitle">
            {isField ? "Submit & track your collections" : "Review & approve field collections"}
          </p>
        </div>

        {isField ? (
          <button className="col-btn-primary" type="button" onClick={() => navigate("/collection/add")}>
            <FiPlus style={{ marginRight: 8 }} />
            Add Collection
          </button>
        ) : null}
      </div>

      {error ? <div className="col-alert-error">{error}</div> : null}

      <form className="col-card col-filters" onSubmit={onSearch}>
        {isAdminManager ? (
          <>
            <div>
              <label className="col-label">From</label>
              <input className="col-input" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            </div>

            <div>
              <label className="col-label">To</label>
              <input className="col-input" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </div>

            <div>
              <label className="col-label">User</label>
              <select className="col-input" value={userId} onChange={(e) => setUserId(e.target.value)}>
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
          <label className="col-label">Status</label>
          <select className="col-input" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All status</option>
            <option value="PENDING">PENDING</option>
            <option value="APPROVED">APPROVED</option>
            <option value="REJECTED">REJECTED</option>
          </select>
        </div>

        <button className="col-btn-secondary" type="submit" title="Apply filters">
          <FiFilter style={{ marginRight: 8 }} />
          Search
        </button>
      </form>

      <div className="col-card">
        <div className="col-table-wrap">
          <table className="col-table">
            <thead>
              <tr>
                <th style={{ width: 70 }}>#</th>
                <th>User</th>
                <th>Order</th>
                <th style={{ textAlign: "right" }}>Amount</th>
                <th>Payment</th>
                <th>Collected</th>
                <th>Status</th>
                <th className="col-th-actions">Actions</th>
              </tr>
            </thead>

            <tbody>
              {rows.length ? (
                rows.map((r, index) => {
                  const rowNo = (pagination.page - 1) * pagination.limit + index + 1;
                  const uName = userMap.get(String(r.userId)) || r.user?.name || "-";

                  return (
                    <tr key={r.id || `${r.userId}-${rowNo}`}>
                      <td>{rowNo}</td>
                      <td>{uName}</td>

                      {/* <td title={r.orderId} style={{ maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis" }}>
                        {r.orderId ? String(r.orderId).slice(0, 10) + "…" : "-"}
                      </td> */}

                      <td title={r.orderId}>
                        {r.orderId ? (orderNoMap.get(String(r.orderId)) || "Loading...") : "-"}
                      </td>

                      <td style={{ textAlign: "right" }}>{money(r.amount)}</td>
                      <td>{r.paymentType || "-"}</td>
                      <td>{r.collectedAt ? String(r.collectedAt).slice(0, 10) : "-"}</td>
                      <td>
                        <StatusBadge status={r.status} />
                      </td>

                      <td className="col-actions">
                        <div className="col-action-row">
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
                  <td colSpan={8} className="col-empty">
                    No collections found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          pagination={pagination}
          onPageChange={(p) => fetchCollections(p, pagination.limit)}
          onLimitChange={(newLimit) => fetchCollections(1, newLimit)}
          limitOptions={[10, 20, 50]}
        />
      </div>

      <CollectionViewModal
        open={viewOpen}
        row={viewRow}
        userName={viewRow ? userMap.get(String(viewRow.userId)) || viewRow.user?.name : ""}
        onClose={() => setViewOpen(false)}
      />
    </div>
  );
};

export default Collection;
