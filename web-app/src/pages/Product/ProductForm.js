import React, { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/api";
import Loader from "../../components/Common/Loader";
import { AuthContext } from "../../context/AuthContext";

import { FiArrowLeft, FiSave } from "react-icons/fi";
import "./product.css";

const ProductForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useContext(AuthContext);

  const role = String(user?.role || "").toUpperCase();
  const isAdmin = role === "ADMIN";
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    sku: "",
    description: "",
    price: "",
    stock: "",
    status: "ACTIVE",
  });

  const fetchProduct = async () => {
    const res = await api.get(`/products/${id}`);
    const p = res.data?.data;

    setForm({
      name: p?.name || "",
      sku: p?.sku || "",
      description: p?.description || "",
      price: p?.price != null ? String(p.price) : "",
      stock: p?.stock != null ? String(p.stock) : "",
      status: String(p?.status || "ACTIVE").toUpperCase(),
    });
  };

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);

        if (!isAdmin) {
          setError("Only ADMIN can create/update products.");
          return;
        }

        if (isEdit) await fetchProduct();
      } catch (e) {
        console.error(e);
        setError(e?.response?.data?.message || "Failed to load product");
      } finally {
        setLoading(false);
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const validate = () => {
    if (!form.name.trim()) return "Name is required";

    const price = Number(form.price);
    if (!Number.isFinite(price) || price < 0) return "Price must be a valid number (>= 0)";

    const stock = form.stock === "" ? 0 : Number(form.stock);
    if (!Number.isFinite(stock) || stock < 0) return "Stock must be a valid number (>= 0)";

    const st = String(form.status || "").toUpperCase();
    if (!["ACTIVE", "INACTIVE"].includes(st)) return "Status must be ACTIVE or INACTIVE";

    return "";
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const msg = validate();
    if (msg) return setError(msg);

    try {
      setSaving(true);
      setError("");

      const payload = {
        name: form.name.trim(),
        sku: form.sku.trim() || null,
        description: form.description.trim() || null,
        price: Number(form.price),
        stock: form.stock === "" ? 0 : Number(form.stock),
        status: String(form.status).toUpperCase(),
      };

      if (isEdit) await api.put(`/products/${id}`, payload);
      else await api.post("/products", payload);

      navigate("/product");
    } catch (e2) {
      console.error(e2);
      setError(e2?.response?.data?.message || "Failed to save product");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="p-page">
      <div className="p-header">
        <div>
          <h2 className="p-title">{isEdit ? "Edit Product" : "Add Product"}</h2>
          <p className="p-subtitle">Product master data (admin only)</p>
        </div>

        <button className="p-btn-secondary" type="button" onClick={() => navigate("/product")}>
          <FiArrowLeft style={{ marginRight: 8 }} />
          Back
        </button>
      </div>

      {error ? <div className="p-alert-error">{error}</div> : null}

      <form className="p-card" onSubmit={onSubmit}>
        <div className="p-grid-2">
          <div>
            <label className="p-label">Name</label>
            <input
              className="p-input"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Product name"
            />
          </div>

          <div>
            <label className="p-label">SKU (optional)</label>
            <input
              className="p-input"
              value={form.sku}
              onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
              placeholder="SKU code"
            />
          </div>

          <div>
            <label className="p-label">Price</label>
            <input
              className="p-input"
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              placeholder="e.g. 1200"
            />
          </div>

          <div>
            <label className="p-label">Stock</label>
            <input
              className="p-input"
              type="number"
              min="0"
              step="1"
              value={form.stock}
              onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
              placeholder="e.g. 50"
            />
          </div>

          <div>
            <label className="p-label">Status</label>
            <select
              className="p-input"
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <label className="p-label">Description (optional)</label>
            <input
              className="p-input"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Short description"
            />
          </div>
        </div>

        <div className="p-form-footer">
          <button className="p-btn-primary" disabled={saving}>
            <FiSave style={{ marginRight: 8 }} />
            {saving ? "Saving..." : "Save Product"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;
