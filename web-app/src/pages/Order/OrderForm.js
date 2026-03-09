import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/api";
import Loader from "../../components/Common/Loader";
import { AuthContext } from "../../context/AuthContext";
import "./order.css";

const emptyItem = { id: "", productId: "", quantity: 1, approvedQuantity: 0, price: 0 };

const OrderForm = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const role = String(user?.role || "").toUpperCase();
  const canApprove = role === "ADMIN" || role === "MANAGER";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({
    customerId: "",
    date: new Date().toISOString().slice(0, 10),
    status: "PENDING",
    notes: "",
  });
  const [items, setItems] = useState([{ ...emptyItem }]);
  const [error, setError] = useState("");

  const productMap = useMemo(() => {
    const map = new Map();
    (products || []).forEach((p) => map.set(String(p.id), p));
    return map;
  }, [products]);

  const requestTotalAmount = useMemo(() => {
    return items.reduce(
      (sum, it) => sum + Number(it.quantity ?? 0) * Number(it.price ?? 0),
      0
    );
  }, [items]);

  const approvedTotalAmount = useMemo(() => {
    return items.reduce(
      (sum, it) => sum + Number(it.approvedQuantity ?? 0) * Number(it.price ?? 0),
      0
    );
  }, [items]);

  const canSubmit = useMemo(() => {
    const hasCustomer = Boolean(form.customerId);
    const hasAtLeastOneProduct = items.some((it) => Boolean(it.productId));
    return hasCustomer && hasAtLeastOneProduct;
  }, [form.customerId, items]);

  const loadDropdowns = useCallback(async () => {
    const [cRes, pRes] = await Promise.all([
      api.get("/customers/dropdown"),
      api.get("/products/dropdown"),
    ]);
    setCustomers(cRes.data || []);
    setProducts(pRes.data || []);
  }, []);

  const loadOrder = useCallback(async () => {
    if (!id) return;

    const res = await api.get(`/orders/${id}`);
    const o = res.data;

    setForm({
      customerId: o.customerId || "",
      date: o.date || new Date().toISOString().slice(0, 10),
      status: o.status || "PENDING",
      notes: o.notes || "",
    });

    const loadedItems = (o.items || []).map((it) => ({
      id: it.id || "",
      productId: String(it.productId),
      quantity: Number(it.quantity || 1),
      approvedQuantity: Number(it.approvedQuantity ?? 0),
      price: Number(it.price || 0),
    }));

    setItems(loadedItems.length ? loadedItems : [{ ...emptyItem }]);
  }, [id]);

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        setError("");
        await loadDropdowns();
        if (isEdit) await loadOrder();
      } catch (err) {
        console.error(err);
        setError(err?.response?.data?.message || "Failed to load order form");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [isEdit, loadDropdowns, loadOrder]);

  const setItemField = (idx, field, value) => {
    setItems((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };

      if (field === "productId") {
        const p = productMap.get(String(value));
        next[idx].price = p ? Number(p.price || 0) : 0;
      }

      if (field === "quantity") {
        const q = Math.max(1, Number(value || 1));
        next[idx].quantity = q;
        if (canApprove && !isEdit) next[idx].approvedQuantity = q;
        if (Number(next[idx].approvedQuantity || 0) > q) next[idx].approvedQuantity = q;
      }

      if (field === "approvedQuantity") {
        const maxQty = Number(next[idx].quantity || 0);
        const aq = Math.max(0, Number(value || 0));
        next[idx].approvedQuantity = Math.min(aq, maxQty);
      }

      if (field === "price") {
        const pr = Number(value);
        next[idx].price = Number.isFinite(pr) ? pr : 0;
      }

      return next;
    });
  };

  const addRow = () => setItems((prev) => [...prev, { ...emptyItem }]);
  const removeRow = (idx) =>
    setItems((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== idx)));

  const validate = () => {
    if (!form.customerId) return "Customer is required";
    const hasAnyProduct = items.some((it) => Boolean(it.productId));
    if (!hasAnyProduct) return "Add at least one valid product item";

    for (const it of items) {
      if (!it.productId) continue;
      if (Number(it.quantity) <= 0) return "Quantity must be at least 1";
      if (Number(it.approvedQuantity) < 0) return "Approved quantity cannot be negative";
      if (Number(it.approvedQuantity) > Number(it.quantity)) {
        return "Approved quantity cannot be greater than requested quantity";
      }
      if (Number(it.price) < 0) return "Price cannot be negative";

      const p = productMap.get(String(it.productId));
      const stockToCheck = canApprove ? Number(it.approvedQuantity) : 0;
      if (p && stockToCheck > Number(p.stock)) {
        return `Insufficient stock for ${p.name} (available: ${p.stock})`;
      }
    }
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

    const cleanItems = items
      .filter((it) => Boolean(it.productId))
      .map((it) => ({
        id: it.id || undefined,
        productId: String(it.productId),
        quantity: Number(it.quantity),
        approvedQuantity: Number(canApprove ? it.approvedQuantity : 0),
        price: Number(it.price),
      }));

    const payload = {
      order: {
        customerId: String(form.customerId),
        date: form.date,
        status: form.status,
        notes: form.notes,
        requestTotalAmount,
        totalAmount: approvedTotalAmount,
      },
      items: cleanItems,
    };

    try {
      if (isEdit) await api.put(`/orders/${id}`, payload);
      else await api.post("/orders", payload);
      navigate("/order");
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="order-page">
      <div className="order-header">
        <div>
          <h2 className="order-title">{isEdit ? "Edit Order" : "Create Order"}</h2>
          <p className="order-subtitle">
            {canApprove && isEdit
              ? "Requested quantity is read-only. Approved quantity controls stock and approved total."
              : "Requested quantity creates a request total. Stock changes only after approval."}
          </p>
        </div>
        <button className="btn-secondary" type="button" onClick={() => navigate("/order")}>
          Back
        </button>
      </div>

      {error ? <div className="alert-error">{error}</div> : null}

      <form className="card" onSubmit={onSubmit}>
        <div className="grid-2">
          <div>
            <label className="label">Customer</label>
            <select
              className="input"
              value={form.customerId}
              onChange={(e) => setForm((f) => ({ ...f, customerId: e.target.value }))}
            >
              <option value="">Select customer</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.phone})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Date</label>
            <input
              className="input"
              type="date"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            />
          </div>

          <div>
            <label className="label">Status</label>
            <select
              className="input"
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
            >
              <option value="PENDING">PENDING</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>

          <div>
            <label className="label">Notes</label>
            <input
              className="input"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Optional"
            />
          </div>
        </div>

        <div className="items-header">
          <h3 className="items-title">Items</h3>
          <button type="button" className="btn-secondary" onClick={addRow}>
            + Add Item
          </button>
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: canApprove && isEdit ? "32%" : "45%" }}>Product</th>
                <th style={{ width: "12%" }}>Stock</th>
                <th style={{ width: "14%" }}>Qty</th>
                {canApprove && isEdit ? <th style={{ width: "14%" }}>Approved Qty</th> : null}
                <th style={{ width: "14%" }}>Price</th>
                <th style={{ width: "10%" }}></th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, idx) => {
                const p = productMap.get(String(it.productId));
                const stockTarget = canApprove && isEdit ? Number(it.approvedQuantity) : Number(it.quantity);
                const showRowError = it.productId && p && stockTarget > Number(p.stock);

                return (
                  <tr key={idx}>
                    <td>
                      <select
                        className="input"
                        value={it.productId}
                        onChange={(e) => setItemField(idx, "productId", e.target.value)}
                      >
                        <option value="">Select product</option>
                        {products.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name} (SKU: {product.sku})
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>{p ? p.stock : "-"}</td>
                    <td>
                      <input
                        className="input"
                        type="number"
                        min="1"
                        value={it.quantity}
                        disabled={canApprove && isEdit}
                        onChange={(e) => setItemField(idx, "quantity", e.target.value)}
                      />
                    </td>
                    {canApprove && isEdit ? (
                      <td>
                        <input
                          className="input"
                          type="number"
                          min="0"
                          max={it.quantity}
                          value={it.approvedQuantity}
                          onChange={(e) => setItemField(idx, "approvedQuantity", e.target.value)}
                        />
                        {showRowError ? (
                          <div style={{ fontSize: 12, color: "#b42318", marginTop: 6 }}>
                            Approved quantity exceeds stock
                          </div>
                        ) : null}
                      </td>
                    ) : null}
                    <td>
                      <input
                        className="input"
                        type="number"
                        min="0"
                        value={it.price}
                        onChange={(e) => setItemField(idx, "price", e.target.value)}
                      />
                    </td>
                    <td className="actions">
                      <button type="button" className="btn-link danger" onClick={() => removeRow(idx)}>
                        Remove
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="order-footer">
          <div className="total" style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            <div>Request Total: <span>{requestTotalAmount.toFixed(2)}</span></div>
            <div>Approved Total: <span>{approvedTotalAmount.toFixed(2)}</span></div>
          </div>
          <button className="btn-primary" disabled={saving || !canSubmit}>
            {saving ? "Saving..." : isEdit ? "Update Order" : "Create Order"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default OrderForm;