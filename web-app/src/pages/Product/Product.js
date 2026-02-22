import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";
import Loader from "../../components/Common/Loader";
import Pagination from "../../components/Common/Pagination";
import { AuthContext } from "../../context/AuthContext";

import { FiEye, FiEdit2, FiPlus, FiTrash2, FiX } from "react-icons/fi";
import "./product.css";

const money = (n) => Number(n || 0).toFixed(2);

const StatusBadge = ({ status }) => {
  const s = String(status || "ACTIVE").toUpperCase();
  const cls = s === "INACTIVE" ? "p-badge p-badge-inactive" : "p-badge p-badge-active";
  return <span className={cls}>{s}</span>;
};

const IconButton = ({ title, onClick, children, disabled, variant = "default" }) => (
  <button
    type="button"
    className={`p-icon-btn ${variant}`}
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
    <div className="p-modal-overlay" onMouseDown={onClose}>
      <div className="p-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="p-modal-header">
          <div>
            <div className="p-modal-title">{title}</div>
            {subtitle ? <div className="p-modal-subtitle">{subtitle}</div> : null}
          </div>
          <button className="p-icon-btn" type="button" onClick={onClose} title="Close">
            <FiX size={18} />
          </button>
        </div>

        <div className="p-modal-body">{children}</div>

        {footer ? <div className="p-modal-footer">{footer}</div> : null}
      </div>
    </div>
  );
};

const ViewModal = ({ open, onClose, row }) => (
  <Modal
    open={open}
    title="Product Details"
    subtitle={row?.id || ""}
    onClose={onClose}
    footer={
      <div className="p-modal-actions">
        <button className="p-btn-secondary" type="button" onClick={onClose}>
          Close
        </button>
      </div>
    }
  >
    <div className="p-kv-grid">
      <div className="p-kv">
        <div className="p-k">Name</div>
        <div className="p-v">{row?.name || "-"}</div>
      </div>
      <div className="p-kv">
        <div className="p-k">SKU</div>
        <div className="p-v">{row?.sku || "-"}</div>
      </div>
      <div className="p-kv">
        <div className="p-k">Price</div>
        <div className="p-v">{money(row?.price)}</div>
      </div>
      <div className="p-kv">
        <div className="p-k">Stock</div>
        <div className="p-v">{Number(row?.stock || 0)}</div>
      </div>
      <div className="p-kv">
        <div className="p-k">Status</div>
        <div className="p-v">
          <StatusBadge status={row?.status} />
        </div>
      </div>
      <div className="p-kv" style={{ gridColumn: "1 / -1" }}>
        <div className="p-k">Description</div>
        <div className="p-v" style={{ fontWeight: 600 }}>
          {row?.description || "-"}
        </div>
      </div>
    </div>
  </Modal>
);

const DeleteModal = ({ open, onClose, name, onConfirm, loading }) => (
  <Modal
    open={open}
    title="Delete Product?"
    subtitle={name ? `This will remove: ${name}` : ""}
    onClose={loading ? () => {} : onClose}
    footer={
      <div className="p-modal-actions">
        <button className="p-btn-secondary" type="button" onClick={onClose} disabled={loading}>
          Cancel
        </button>
        <button className="p-btn-danger" type="button" onClick={onConfirm} disabled={loading}>
          {loading ? "Deleting..." : "Delete"}
        </button>
      </div>
    }
  >
    <div className="p-hint">If this product is used in orders, delete may fail depending on DB constraints.</div>
  </Modal>
);

const Product = () => {
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

  // modals
  const [viewOpen, setViewOpen] = useState(false);
  const [viewRow, setViewRow] = useState(null);

  const [delOpen, setDelOpen] = useState(false);
  const [delRow, setDelRow] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchProducts = async (page = 1, limit = pagination.limit) => {
    setError("");
    setLoading(true);

    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(limit));
      if (q.trim()) params.set("q", q.trim());
      if (status) params.set("status", status);

      const res = await api.get(`/products?${params.toString()}`);
      setRows(res.data?.data || []);
      setPagination(res.data?.pagination || { page, limit, total: 0, totalPages: 1 });
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.message || "Failed to load products");
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
        if (isAdminManager) await fetchProducts(1, pagination.limit);
        else setError("Only ADMIN/MANAGER can view product list.");
      } finally {
        setLoading(false);
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSearch = async (e) => {
    e.preventDefault();
    await fetchProducts(1, pagination.limit);
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
      await api.delete(`/products/${delRow.id}`);
      setDelOpen(false);
      setDelRow(null);
      await fetchProducts(pagination.page, pagination.limit);
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.message || "Failed to delete product");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="p-page">
      <div className="p-header">
        <div>
          <h2 className="p-title">Products</h2>
          <p className="p-subtitle">{isAdmin ? "Create and manage products." : "View product list."}</p>
        </div>

        {isAdmin ? (
          <button className="p-btn-primary" type="button" onClick={() => navigate("/product/add")}>
            <FiPlus style={{ marginRight: 8 }} />
            Add Product
          </button>
        ) : null}
      </div>

      {error ? <div className="p-alert-error">{error}</div> : null}

      {isAdminManager ? (
        <>
          <form className="p-card p-filters" onSubmit={onSearch}>
            <div>
              <label className="p-label">Search</label>
              <input
                className="p-input"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="name / sku / description"
              />
            </div>

            <div>
              <label className="p-label">Status</label>
              <select className="p-input" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="">All</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>

            <button className="p-btn-secondary" type="submit">
              Search
            </button>
          </form>

          <div className="p-card">
            <div className="p-table-wrap">
              <table className="p-table">
                <thead>
                  <tr>
                    <th style={{ width: 60 }}>#</th>
                    <th>Name</th>
                    <th>SKU</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Status</th>
                    <th className="p-th-actions">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length ? (
                    rows.map((r, index) => (
                      <tr key={r.id || index}>
                        <td>{(pagination.page - 1) * pagination.limit + index + 1}</td>
                        <td>{r.name || "-"}</td>
                        <td>{r.sku || "-"}</td>
                        <td>{money(r.price)}</td>
                        <td>{Number(r.stock || 0)}</td>
                        <td>
                          <StatusBadge status={r.status} />
                        </td>
                        <td className="p-actions">
                          <div className="p-action-row">
                            <IconButton title="View" onClick={() => openView(r)}>
                              <FiEye size={18} />
                            </IconButton>

                            <IconButton
                              title={isAdmin ? "Edit" : "Edit (admin only)"}
                              onClick={() => navigate(`/product/edit/${r.id}`)}
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
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="p-empty">
                        No products found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              <Pagination
                pagination={pagination}
                onPageChange={(p) => fetchProducts(p, pagination.limit)}
                onLimitChange={(newLimit) => fetchProducts(1, newLimit)}
                limitOptions={[10, 20, 50]}
              />
            </div>
          </div>
        </>
      ) : null}

      <ViewModal open={viewOpen} onClose={() => setViewOpen(false)} row={viewRow} />
      <DeleteModal
        open={delOpen}
        onClose={() => setDelOpen(false)}
        name={delRow?.name}
        onConfirm={doDelete}
        loading={deleting}
      />
    </div>
  );
};

export default Product;
