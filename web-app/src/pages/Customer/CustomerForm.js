import React, { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/api";
import Loader from "../../components/Common/Loader";
import { AuthContext } from "../../context/AuthContext";

import { FiArrowLeft, FiSave } from "react-icons/fi";
import "./customer.css";

const CustomerForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useContext(AuthContext);

  const role = String(user?.role || "").toUpperCase();
  const isAdmin = role === "ADMIN";

  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // const [users, setUsers] = useState([]);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    status: "ACTIVE",
    // assignedTo: "",
  });

  // const userMap = useMemo(() => {
  //   const m = new Map();
  //   (users || []).forEach((u) => m.set(String(u.id), u));
  //   return m;
  // }, [users]);

  // const fetchUsers = async () => {
  //   // for assignedTo dropdown
  //   const res = await api.get("/users/dropdown");
  //   setUsers(res.data || []);
  // };

  const fetchCustomer = async () => {
    if (!isEdit) return;
    const res = await api.get(`/customers/${id}`);
    const c = res.data?.data;

    setForm({
      name: c?.name || "",
      phone: c?.phone || "",
      email: c?.email || "",
      address: c?.address || "",
      city: c?.city || "",
      state: c?.state || "",
      zip: c?.zip || "",
      status: String(c?.status || "ACTIVE").toUpperCase(),
      // assignedTo: c?.assignedTo ? String(c.assignedTo) : "",
    });
  };

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);

        if (!isAdmin) {
          setError("Only ADMIN can create/update customers.");
          return;
        }

        // await fetchUsers();
        await fetchCustomer();
      } catch (e) {
        console.error(e);
        setError(e?.response?.data?.message || "Failed to load customer");
      } finally {
        setLoading(false);
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const validate = () => {
    if (!form.name.trim()) return "Name is required";
    if (form.status && !["ACTIVE", "INACTIVE"].includes(String(form.status).toUpperCase())) {
      return "Status must be ACTIVE or INACTIVE";
    }
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
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        address: form.address.trim() || null,
        city: form.city.trim() || null,
        state: form.state.trim() || null,
        zip: form.zip.trim() || null,
        status: String(form.status || "ACTIVE").toUpperCase(),
        // assignedTo: form.assignedTo ? String(form.assignedTo) : null,
      };

      if (isEdit) {
        await api.put(`/customers/${id}`, payload);
      } else {
        await api.post("/customers", payload);
      }

      navigate("/customer");
    } catch (e2) {
      console.error(e2);
      setError(e2?.response?.data?.message || "Failed to save customer");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader />;

  // const assignedLabel = form.assignedTo
  //   ? userMap.get(String(form.assignedTo))?.name || form.assignedTo
  //   : "Not assigned";

  return (
    <div className="c-page">
      <div className="c-header">
        <div>
          <h2 className="c-title">{isEdit ? "Edit Customer" : "Add Customer"}</h2>
          <p className="c-subtitle">Customer master data (admin only)</p>
        </div>

        <button className="c-btn-secondary" type="button" onClick={() => navigate("/customer")}>
          <FiArrowLeft style={{ marginRight: 8 }} />
          Back
        </button>
      </div>

      {error ? <div className="c-alert-error">{error}</div> : null}

      <form className="c-card" onSubmit={onSubmit}>
        <div className="c-grid-2">
          <div>
            <label className="c-label">Name</label>
            <input
              className="c-input"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Customer name"
            />
          </div>

          <div>
            <label className="c-label">Phone</label>
            <input
              className="c-input"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="01XXXXXXXXX"
            />
          </div>

          <div>
            <label className="c-label">Email</label>
            <input
              className="c-input"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="optional"
            />
          </div>

          <div>
            <label className="c-label">Status</label>
            <select
              className="c-input"
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <label className="c-label">Address</label>
            <input
              className="c-input"
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              placeholder="Street / House / Area"
            />
          </div>

          <div>
            <label className="c-label">City</label>
            <input
              className="c-input"
              value={form.city}
              onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
              placeholder="Dhaka"
            />
          </div>

          <div>
            <label className="c-label">State</label>
            <input
              className="c-input"
              value={form.state}
              onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
              placeholder="Dhaka Division"
            />
          </div>

          <div>
            <label className="c-label">Zip</label>
            <input
              className="c-input"
              value={form.zip}
              onChange={(e) => setForm((f) => ({ ...f, zip: e.target.value }))}
              placeholder="1207"
            />
          </div>

          {/* <div>
            <label className="c-label">Assigned To (Field User)</label>
            <select
              className="c-input"
              value={form.assignedTo}
              onChange={(e) => setForm((f) => ({ ...f, assignedTo: e.target.value }))}
            >
              <option value="">Not assigned</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
            <div className="c-hint">
              Current: <b>{assignedLabel}</b>
            </div>
          </div> */}
        </div>

        <div className="c-form-footer">
          <button className="c-btn-primary" disabled={saving}>
            <FiSave style={{ marginRight: 8 }} />
            {saving ? "Saving..." : "Save Customer"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CustomerForm;
