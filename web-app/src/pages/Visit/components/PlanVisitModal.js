import React, { useEffect, useState } from "react";
import api from "../../../api/api";
import VModal from "./VModal";

const PlanVisitModal = ({ open, onClose, onCreated, users, customers, hideUserSelect = false, fixedUserId = "", fixedUserName = "Me",}) => {
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const [form, setForm] = useState({
    userId: "",
    customerId: "",
    plannedAt: "",
    notes: "",
  });

  useEffect(() => {
    if (!open) return;

    setErr("");
    setSaving(false);

    const d = new Date(Date.now() + 60 * 60 * 1000);
    const pad = (n) => String(n).padStart(2, "0");
    const local = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
      d.getMinutes()
    )}`;

    setForm((f) => ({ ...f, userId: hideUserSelect ? String(fixedUserId || "") : f.userId, plannedAt: local }));
  }, [open]);

  const submit = async (e) => {
    e.preventDefault();
    setErr("");

    // if (!form.userId) return setErr("User is required");
    if (!hideUserSelect && !form.userId) return setErr("User is required");
    if (!form.customerId) return setErr("Customer is required");
    if (!form.plannedAt) return setErr("Planned date & time is required");

    try {
      setSaving(true);

      await api.post("/visits", {
        ...(hideUserSelect ? {} : { userId: String(form.userId) }),
        customerId: String(form.customerId),
        plannedAt: new Date(form.plannedAt).toISOString(),
        notes: form.notes || null,
      });


      onCreated?.();
      onClose?.();
    } catch (e2) {
      console.error(e2);
      setErr(e2?.response?.data?.message || "Failed to plan visit");
    } finally {
      setSaving(false);
    }
  };

  return (
    <VModal
      open={open}
      title="Plan Visit"
      subtitle="Assign user + customer + schedule"
      onClose={onClose}
      footer={
        <div className="v-footer">
          <button className="v-btn-secondary" type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="v-btn-primary" type="submit" form="plan-visit-form" disabled={saving}>
            {saving ? "Saving..." : "Create Visit"}
          </button>
        </div>
      }
    >
      {err ? <div className="v-alert-error">{err}</div> : null}

      <form id="plan-visit-form" className="v-card" onSubmit={submit} style={{ marginTop: 12 }}>
        <div className="v-grid-2">
          <div>
            <label className="v-label">User</label>

            {hideUserSelect ? (
              <input className="v-input" value={fixedUserName} readOnly />
            ) : (
              <select
                className="v-input"
                value={form.userId}
                onChange={(e) => setForm((f) => ({ ...f, userId: e.target.value }))}
              >
                <option value="">Select user</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="v-label">Customer</label>
            <select
              className="v-input"
              value={form.customerId}
              onChange={(e) => setForm((f) => ({ ...f, customerId: e.target.value }))}
            >
              <option value="">Select customer</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.phone ? `(${c.phone})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="v-label">Planned At</label>
            <input
              className="v-input"
              type="datetime-local"
              value={form.plannedAt}
              onChange={(e) => setForm((f) => ({ ...f, plannedAt: e.target.value }))}
            />
          </div>

          <div>
            <label className="v-label">Notes</label>
            <input
              className="v-input"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Optional"
            />
          </div>
        </div>
      </form>
    </VModal>
  );
};

export default PlanVisitModal;
