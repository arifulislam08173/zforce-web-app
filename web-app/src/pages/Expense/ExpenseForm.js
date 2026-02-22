import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";
import "./expense.css";
import { AuthContext } from "../../context/AuthContext";

const isoDate = (d) => {
  const x = new Date(d);
  const yyyy = x.getFullYear();
  const mm = String(x.getMonth() + 1).padStart(2, "0");
  const dd = String(x.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const ExpenseForm = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const role = String(user?.role || "").toUpperCase();
  const isField = role === "FIELD";

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    category: "",
    amount: "",
    description: "",
    receiptUrl: "",
    incurredAt: isoDate(new Date()),
  });

  useEffect(() => {
    // optional: block non-FIELD from creating
    if (!isField) navigate("/expense");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isField]);

  const validate = () => {
    const amountNum = Number(form.amount);
    if (!form.category.trim()) return "Category is required";
    if (!Number.isFinite(amountNum) || amountNum <= 0) return "Amount must be > 0";
    if (!form.incurredAt) return "Incurred date is required";
    return "";
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const msg = validate();
    if (msg) return setError(msg);

    try {
      setSaving(true);

      await api.post("/expenses", {
        category: form.category.trim(),
        amount: Number(form.amount),
        description: form.description?.trim() || "",
        receiptUrl: form.receiptUrl?.trim() || "",
        incurredAt: form.incurredAt,
      });

      navigate("/expense");
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || "Failed to create expense");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="exp-page">
      <div className="exp-header">
        <div>
          <h2 className="exp-title">Add Expense</h2>
          <p className="exp-subtitle">Submit a new expense</p>
        </div>

        <button className="exp-btn-secondary" type="button" onClick={() => navigate("/expense")}>
          Back
        </button>
      </div>

      {error ? <div className="exp-alert-error">{error}</div> : null}

      <form className="exp-card exp-form" onSubmit={onSubmit}>
        <div className="exp-grid-2">
          <div>
            <label className="exp-label">Category</label>
            <input
              className="exp-input"
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              placeholder="e.g. Transport"
            />
          </div>

          <div>
            <label className="exp-label">Amount</label>
            <input
              className="exp-input"
              type="number"
              min="0"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              placeholder="e.g. 250"
            />
          </div>

          <div>
            <label className="exp-label">Incurred Date</label>
            <input
              className="exp-input"
              type="date"
              value={form.incurredAt}
              onChange={(e) => setForm((f) => ({ ...f, incurredAt: e.target.value }))}
            />
          </div>

          <div>
            <label className="exp-label">Receipt URL (optional)</label>
            <input
              className="exp-input"
              value={form.receiptUrl}
              onChange={(e) => setForm((f) => ({ ...f, receiptUrl: e.target.value }))}
              placeholder="https://..."
            />
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <label className="exp-label">Description (optional)</label>
          <textarea
            className="exp-input exp-textarea"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Write details..."
          />
        </div>

        <div className="exp-form-footer">
          <button
            className="exp-btn-secondary"
            type="button"
            onClick={() => navigate("/expense")}
            disabled={saving}
          >
            Cancel
          </button>

          <button className="exp-btn-primary" disabled={saving}>
            {saving ? "Saving..." : "Create Expense"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ExpenseForm;
