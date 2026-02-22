import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/api";
import Loader from "../../components/Common/Loader";
import "./order.css";

const emptyItem = { productId: "", quantity: 1, price: 0 };

const OrderForm = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

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

  const totalAmount = useMemo(() => {
    return items.reduce(
      (sum, it) => sum + Number(it.quantity || 0) * Number(it.price || 0),
      0
    );
  }, [items]);

  // customerId/productId are strings, not numbers
  const canSubmit = useMemo(() => {
    const hasCustomer = Boolean(form.customerId);
    const hasAtLeastOneProduct = items.some((it) => Boolean(it.productId));
    return hasCustomer && hasAtLeastOneProduct;
  }, [form.customerId, items]);

  const loadDropdowns = async () => {
    const [cRes, pRes] = await Promise.all([
      api.get("/customers/dropdown"),
      api.get("/products/dropdown"),
    ]);
    setCustomers(cRes.data || []);
    setProducts(pRes.data || []);
  };

  const loadOrder = async () => {
    const res = await api.get(`/orders/${id}`);
    const o = res.data;

    setForm({
      customerId: o.customerId || "",
      date: o.date || new Date().toISOString().slice(0, 10),
      status: o.status || "PENDING",
      notes: o.notes || "",
    });

    const loadedItems =
      (o.items || []).map((it) => ({
        productId: String(it.productId),
        quantity: Number(it.quantity || 1),
        price: Number(it.price || 0),
      })) || [];

    setItems(loadedItems.length ? loadedItems : [{ ...emptyItem }]);
  };

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const setItemField = (idx, field, value) => {
    setItems((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };

      // Auto-fill price when product changes
      if (field === "productId") {
        const p = productMap.get(String(value));
        next[idx].price = p ? Number(p.price || 0) : 0;
      }

      // enforce min quantity
      if (field === "quantity") {
        const q = Math.max(1, Number(value || 1));
        next[idx].quantity = q;
      }

      // keep numeric price
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

    // allow empty rows, but at least one selected product needed
    const hasAnyProduct = items.some((it) => Boolean(it.productId));
    if (!hasAnyProduct) return "Add at least one valid product item";

    for (const it of items) {
      // if row has no product, ignore it
      if (!it.productId) continue;

      if (Number(it.quantity) <= 0) return "Quantity must be at least 1";
      if (Number(it.price) < 0) return "Price cannot be negative";

      const p = productMap.get(String(it.productId));
      if (p && Number(it.quantity) > Number(p.stock)) {
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

    // remove empty rows
    const cleanItems = items
      .filter((it) => Boolean(it.productId))
      .map((it) => ({
        productId: String(it.productId), // keep UUID string
        quantity: Number(it.quantity),
        price: Number(it.price),
      }));

    if (cleanItems.length === 0) {
      setSaving(false);
      setError("Add at least one valid product item");
      return;
    }

    const payload = {
      order: {
        customerId: String(form.customerId), // UUID string
        date: form.date,
        status: form.status,
        notes: form.notes,
        totalAmount, 
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
          <p className="order-subtitle">Products affect stock automatically</p>
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
                <th style={{ width: "45%" }}>Product</th>
                <th style={{ width: "15%" }}>Stock</th>
                <th style={{ width: "15%" }}>Qty</th>
                <th style={{ width: "15%" }}>Price</th>
                <th style={{ width: "10%" }}></th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, idx) => {
                const p = productMap.get(String(it.productId));
                const showRowError = it.productId && p && Number(it.quantity) > Number(p.stock);

                return (
                  <tr key={idx}>
                    <td>
                      <select
                        className="input"
                        value={it.productId}
                        onChange={(e) => setItemField(idx, "productId", e.target.value)}
                      >
                        <option value="">Select product</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} (SKU: {p.sku})
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
                        onChange={(e) => setItemField(idx, "quantity", e.target.value)}
                      />
                      {showRowError ? (
                        <div style={{ fontSize: 12, color: "#b42318", marginTop: 6 }}>
                          Quantity exceeds stock
                        </div>
                      ) : null}
                    </td>
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
                      <button
                        type="button"
                        className="btn-link danger"
                        onClick={() => removeRow(idx)}
                      >
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
          <div className="total">
            Total: <span>{totalAmount.toFixed(2)}</span>
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
