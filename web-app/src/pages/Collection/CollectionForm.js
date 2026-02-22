// import React, { useEffect, useMemo, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import api from "../../api/api";
// import Loader from "../../components/Common/Loader";
// import "./collection.css";

// import { FiArrowLeft, FiSave } from "react-icons/fi";

// const money = (n) => Number(n || 0).toFixed(2);

// const CollectionForm = () => {
//   const navigate = useNavigate();

//   const [loading, setLoading] = useState(false);
//   const [saving, setSaving] = useState(false);
//   const [error, setError] = useState("");

//   // orders list for dropdown
//   const [orderOptions, setOrderOptions] = useState([]);

//   const [form, setForm] = useState({
//     orderId: "",
//     amount: "",
//     paymentType: "CASH",
//     receiptUrl: "",
//   });

//   const selectedOrder = useMemo(() => {
//     return orderOptions.find((o) => String(o.id) === String(form.orderId)) || null;
//   }, [orderOptions, form.orderId]);

//   const loadOrders = async () => {
//     try {
//       setLoading(true);
//       setError("");

//       // keep it simple: load latest 50 orders
//       const params = new URLSearchParams();
//       params.set("page", "1");
//       params.set("limit", "50");

//       const res = await api.get(`/orders?${params.toString()}`);
//       const data = res.data?.data || [];
//       setOrderOptions(data);
//     } catch (e) {
//       console.error(e);
//       setError(e?.response?.data?.message || "Failed to load orders");
//       setOrderOptions([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     loadOrders();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   useEffect(() => {
//     // autofill amount with order total (optional behavior)
//     if (selectedOrder?.totalAmount && !form.amount) {
//       setForm((f) => ({ ...f, amount: String(selectedOrder.totalAmount) }));
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [selectedOrder]);

//   const validate = () => {
//     if (!form.orderId) return "Order is required";
//     const amountNum = Number(form.amount);
//     if (!Number.isFinite(amountNum) || amountNum <= 0) return "Amount must be > 0";
//     if (!form.paymentType) return "Payment type is required";
//     return "";
//   };

//   const onSubmit = async (e) => {
//     e.preventDefault();
//     const msg = validate();
//     if (msg) {
//       setError(msg);
//       return;
//     }

//     try {
//       setSaving(true);
//       setError("");

//       await api.post("/collections", {
//         orderId: String(form.orderId),
//         amount: Number(form.amount),
//         paymentType: form.paymentType,
//         receiptUrl: form.receiptUrl?.trim() || "",
//       });

//       navigate("/collection");
//     } catch (err) {
//       console.error(err);
//       setError(err?.response?.data?.message || "Failed to create collection");
//     } finally {
//       setSaving(false);
//     }
//   };

//   return (
//     <div className="col-page">
//       <div className="col-header">
//         <div>
//           <h2 className="col-title">Add Collection</h2>
//           <p className="col-subtitle">Record a customer payment collection</p>
//         </div>

//         <button className="col-btn-secondary" type="button" onClick={() => navigate("/collection")}>
//           <FiArrowLeft style={{ marginRight: 8 }} />
//           Back
//         </button>
//       </div>

//       {error ? <div className="col-alert-error">{error}</div> : null}

//       {/* Order Select */}
//       <div className="col-card">
//         {loading ? (
//           <div style={{ padding: 10 }}>
//             <Loader />
//           </div>
//         ) : (
//           <div>
//             <label className="col-label">Select Order</label>
//             <select
//               className="col-input"
//               value={form.orderId}
//               onChange={(e) => setForm((f) => ({ ...f, orderId: e.target.value, amount: "" }))}
//             >
//               <option value="">Select…</option>
//               {orderOptions.map((o) => (
//                 <option key={o.id} value={o.id}>
//                   {String(o.id).slice(0, 8)}… • {o.customer?.name || "Customer"} • Total {money(o.totalAmount)}
//                 </option>
//               ))}
//             </select>

//             {selectedOrder ? (
//               <div className="col-hint" style={{ marginTop: 10 }}>
//                 Customer: <b>{selectedOrder.customer?.name || "-"}</b>
//                 {selectedOrder.customer?.phone ? (
//                   <span className="col-muted"> ({selectedOrder.customer.phone})</span>
//                 ) : null}
//               </div>
//             ) : null}

//             {!loading && orderOptions.length === 0 ? (
//               <div className="col-hint" style={{ marginTop: 10 }}>
//                 No orders found.
//               </div>
//             ) : null}
//           </div>
//         )}
//       </div>

//       {/* Form */}
//       <form className="col-card" onSubmit={onSubmit}>
//         <div className="col-grid-2">
//           <div>
//             <label className="col-label">Amount</label>
//             <input
//               className="col-input"
//               type="number"
//               min="0"
//               value={form.amount}
//               onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
//               placeholder="e.g. 500"
//             />
//           </div>

//           <div>
//             <label className="col-label">Payment Type</label>
//             <select
//               className="col-input"
//               value={form.paymentType}
//               onChange={(e) => setForm((f) => ({ ...f, paymentType: e.target.value }))}
//             >
//               <option value="CASH">CASH</option>
//               <option value="UPI">UPI</option>
//               <option value="CHEQUE">CHEQUE</option>
//             </select>
//           </div>

//           <div style={{ gridColumn: "1 / -1" }}>
//             <label className="col-label">Receipt URL (optional)</label>
//             <input
//               className="col-input"
//               value={form.receiptUrl}
//               onChange={(e) => setForm((f) => ({ ...f, receiptUrl: e.target.value }))}
//               placeholder="https://..."
//             />
//           </div>
//         </div>

//         <div className="col-form-footer">
//           <button className="col-btn-primary" disabled={saving}>
//             <FiSave style={{ marginRight: 8 }} />
//             {saving ? "Saving..." : "Save Collection"}
//           </button>
//         </div>
//       </form>
//     </div>
//   );
// };

// export default CollectionForm;





import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";
import Loader from "../../components/Common/Loader";
import "./collection.css";

import { FiArrowLeft, FiSave } from "react-icons/fi";

const money = (n) => Number(n || 0).toFixed(2);

const CollectionForm = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // dropdowns
  const [customers, setCustomers] = useState([]);
  const [customerId, setCustomerId] = useState("");

  // open orders for selected customer
  const [orderOptions, setOrderOptions] = useState([]);

  const [form, setForm] = useState({
    orderId: "",
    amount: "",
    paymentType: "CASH",
    receiptUrl: "",
  });

  const selectedOrder = useMemo(() => {
    return orderOptions.find((o) => String(o.id) === String(form.orderId)) || null;
  }, [orderOptions, form.orderId]);

  // Load customers once
  const loadCustomers = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/customers/dropdown");
      setCustomers(res.data || []);
    } catch (e) {
      console.error(e);
      setCustomers([]);
      setError(e?.response?.data?.message || "Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  // Load open orders for selected customer
  const loadOpenOrders = async (cid) => {
    if (!cid) {
      setOrderOptions([]);
      setForm((f) => ({ ...f, orderId: "", amount: "" }));
      return;
    }

    try {
      setLoading(true);
      setError("");

      const res = await api.get("/orders/open-for-collection", {
        params: { customerId: cid },
      });

      const data = res.data?.data || [];
      setOrderOptions(data);

      // reset order + amount whenever customer changes
      setForm((f) => ({ ...f, orderId: "", amount: "" }));
    } catch (e) {
      console.error(e);
      setOrderOptions([]);
      setError(e?.response?.data?.message || "Failed to load customer orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // when customer changes, load open orders
  useEffect(() => {
    loadOpenOrders(customerId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId]);

  // when order selected, autofill amount with DUE (not total)
  useEffect(() => {
    if (selectedOrder) {
      const due = Number(selectedOrder.dueAmount || 0);
      setForm((f) => ({ ...f, amount: due > 0 ? String(due) : "" }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOrder?.id]);

  const validate = () => {
    if (!customerId) return "Customer is required";
    if (!form.orderId) return "Order is required";

    const amountNum = Number(form.amount);
    if (!Number.isFinite(amountNum) || amountNum <= 0) return "Amount must be > 0";

    const due = Number(selectedOrder?.dueAmount || 0);
    if (due <= 0) return "This order has no due amount";
    if (amountNum > due) return `Amount cannot exceed due (${money(due)})`;

    if (!form.paymentType) return "Payment type is required";
    return "";
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const msg = validate();
    if (msg) {
      setError(msg);
      return;
    }

    try {
      setSaving(true);
      setError("");

      await api.post("/collections", {
        orderId: String(form.orderId),
        amount: Number(form.amount),
        paymentType: form.paymentType,
        receiptUrl: form.receiptUrl?.trim() || "",
      });

      navigate("/collection");
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || "Failed to create collection");
    } finally {
      setSaving(false);
    }
  };

  const selectedCustomer = useMemo(() => {
    return customers.find((c) => String(c.id) === String(customerId)) || null;
  }, [customers, customerId]);

  return (
    <div className="col-page">
      <div className="col-header">
        <div>
          <h2 className="col-title">Add Collection</h2>
          <p className="col-subtitle">Collect payment against an order (partial supported)</p>
        </div>

        <button className="col-btn-secondary" type="button" onClick={() => navigate("/collection")}>
          <FiArrowLeft style={{ marginRight: 8 }} />
          Back
        </button>
      </div>

      {error ? <div className="col-alert-error">{error}</div> : null}

      {/* Step 1: Customer Select */}
      <div className="col-card">
        {loading ? (
          <div style={{ padding: 10 }}>
            <Loader />
          </div>
        ) : (
          <>
            <label className="col-label">Select Customer</label>
            <select
              className="col-input"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
            >
              <option value="">Select…</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.phone ? `(${c.phone})` : ""}
                </option>
              ))}
            </select>

            {selectedCustomer ? (
              <div className="col-hint" style={{ marginTop: 10 }}>
                Customer: <b>{selectedCustomer.name}</b>
                {selectedCustomer.phone ? (
                  <span className="col-muted"> ({selectedCustomer.phone})</span>
                ) : null}
              </div>
            ) : null}
          </>
        )}
      </div>

      {/* Step 2: Order Select (Open Orders only) */}
      <div className="col-card">
        {loading ? (
          <div style={{ padding: 10 }}>
            <Loader />
          </div>
        ) : (
          <>
            <label className="col-label">Select Order (Due Only)</label>
            <select
              className="col-input"
              value={form.orderId}
              onChange={(e) => setForm((f) => ({ ...f, orderId: e.target.value }))}
              disabled={!customerId}
            >
              <option value="">Select…</option>
              {orderOptions.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.orderNumber || String(o.id).slice(0, 8) + "…"} • Total {money(o.totalAmount)} • Paid{" "}
                  {money(o.paidAmount)} • Due {money(o.dueAmount)}
                </option>
              ))}
            </select>

            {!customerId ? (
              <div className="col-hint" style={{ marginTop: 10 }}>
                Select a customer first to load unpaid/partial orders.
              </div>
            ) : null}

            {customerId && !loading && orderOptions.length === 0 ? (
              <div className="col-hint" style={{ marginTop: 10 }}>
                No unpaid/partial orders found for this customer.
              </div>
            ) : null}

            {selectedOrder ? (
              <div className="col-card" style={{ marginTop: 14, background: "#f9fafb" }}>
                <div className="col-grid-2">
                  <div>
                    <div className="col-muted">Order</div>
                    <div style={{ fontWeight: 700 }}>{selectedOrder.orderNumber || selectedOrder.id}</div>
                  </div>
                  <div>
                    <div className="col-muted">Payment Status</div>
                    <div style={{ fontWeight: 700 }}>{selectedOrder.paymentStatus || "-"}</div>
                  </div>

                  <div>
                    <div className="col-muted">Total</div>
                    <div style={{ fontWeight: 700 }}>{money(selectedOrder.totalAmount)}</div>
                  </div>
                  <div>
                    <div className="col-muted">Paid</div>
                    <div style={{ fontWeight: 700 }}>{money(selectedOrder.paidAmount)}</div>
                  </div>

                  <div style={{ gridColumn: "1 / -1" }}>
                    <div className="col-muted">Due</div>
                    <div style={{ fontWeight: 800, fontSize: 18 }}>{money(selectedOrder.dueAmount)}</div>
                  </div>
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>

      {/* Step 3: Collection Form */}
      <form className="col-card" onSubmit={onSubmit}>
        <div className="col-grid-2">
          <div>
            <label className="col-label">Amount</label>
            <input
              className="col-input"
              type="number"
              min="0"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              placeholder="e.g. 500"
              disabled={!selectedOrder}
            />
            {selectedOrder ? (
              <div className="col-hint" style={{ marginTop: 6 }}>
                Max: <b>{money(selectedOrder.dueAmount)}</b>
              </div>
            ) : null}
          </div>

          <div>
            <label className="col-label">Payment Type</label>
            <select
              className="col-input"
              value={form.paymentType}
              onChange={(e) => setForm((f) => ({ ...f, paymentType: e.target.value }))}
              disabled={!selectedOrder}
            >
              <option value="CASH">CASH</option>
              <option value="UPI">UPI</option>
              <option value="CHEQUE">CHEQUE</option>
            </select>
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <label className="col-label">Receipt URL (optional)</label>
            <input
              className="col-input"
              value={form.receiptUrl}
              onChange={(e) => setForm((f) => ({ ...f, receiptUrl: e.target.value }))}
              placeholder="https://..."
              disabled={!selectedOrder}
            />
          </div>
        </div>

        <div className="col-form-footer">
          <button className="col-btn-primary" disabled={saving || !selectedOrder}>
            <FiSave style={{ marginRight: 8 }} />
            {saving ? "Saving..." : "Save Collection"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CollectionForm;
