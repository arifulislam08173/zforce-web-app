import React, { useEffect, useMemo, useState } from "react";
import api from "../../api/api";
import Loader from "../../components/Common/Loader";
import { FiRefreshCw, FiSearch, FiPlus } from "react-icons/fi";

import "../Reports/report.css";

const today = () => new Date().toISOString().slice(0, 10);

const CustomerAssignment = () => {
  const [bootLoading, setBootLoading] = useState(true);
  const [loading, setLoading] = useState(false);

  const [companies, setCompanies] = useState([]);
  const [users, setUsers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [eligibleUsers, setEligibleUsers] = useState([]);
  const [rows, setRows] = useState([]);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [filters, setFilters] = useState({
    activeOn: today(),
    companyId: "",
    userId: "",
  });

  const [form, setForm] = useState({
    companyId: "",
    userId: "",
    customerId: "",
    region: "",
    area: "",
    territory: "",
    parentId: "",
    role: "FIELD",
    effectiveFrom: today(),
  });

  const filterParams = useMemo(() => {
    const p = {};
    Object.keys(filters).forEach((k) => {
      const v = filters[k];
      if (v !== null && v !== undefined && String(v).trim() !== "") p[k] = v;
    });
    return p;
  }, [filters]);

  const loadMasters = async () => {
    const [c1, u1, cu1] = await Promise.all([
      api.get("/companies/dropdown"),
      api.get("/users/dropdown"),
      api.get("/customers/dropdown"),
    ]);

    setCompanies(c1.data || []);
    setUsers(u1.data || []);
    setCustomers(cu1.data || []);
  };

  const loadEligibleUsers = async (companyId, activeOnDate) => {
    if (!companyId) {
      setEligibleUsers([]);
      return;
    }

    try {
      const res = await api.get("/user-companies/eligible-users", {
        params: { companyId, activeOn: activeOnDate },
      });
      setEligibleUsers(res.data || []);
    } catch (e) {
      setEligibleUsers([]);
    }
  };

  const loadList = async (params = filterParams) => {
    setLoading(true);
    setError("");
    try {
      const list = await api.get("/user-customer-roles", { params });
      setRows(list.data?.data || []);
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || "Failed to load customer assignments";
      setError(msg);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      setBootLoading(true);
      try {
        await loadMasters();
        await loadList({});
      } finally {
        setBootLoading(false);
      }
    })();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    loadEligibleUsers(form.companyId, form.effectiveFrom);
    setForm((prev) => ({ ...prev, userId: "" }));
    // eslint-disable-next-line
  }, [form.companyId, form.effectiveFrom]);

  const onFormChange = (k, v) => setForm((s) => ({ ...s, [k]: v }));
  const onFilterChange = (k, v) => setFilters((s) => ({ ...s, [k]: v }));

  const applyFilters = async () => {
    setSuccess("");
    await loadList(filterParams);
  };

  const resetFilters = async () => {
    setSuccess("");
    setFilters({ activeOn: today(), companyId: "", userId: "" });
    setTimeout(() => loadList({}), 0);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.companyId || !form.userId || !form.customerId || !form.effectiveFrom) {
      setError("Company, User, Customer and Effective From are required.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/user-customer-roles/assign", {
        companyId: form.companyId,
        userId: form.userId,
        customerId: form.customerId,
        region: form.region || null,
        area: form.area || null,
        territory: form.territory || null,
        parentId: form.parentId || null,
        role: form.role || null,
        effectiveFrom: form.effectiveFrom,
      });

      setSuccess("Customer assigned successfully.");
      await loadList(filterParams);
    } catch (e2) {
      const msg = e2?.response?.data?.message || e2?.message || "Failed to assign customer";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const userNameById = useMemo(() => {
  const m = new Map();
  users.forEach((u) => m.set(String(u.id), u.name));
  return m;
}, [users]);

const companyNameById = useMemo(() => {
  const m = new Map();
  companies.forEach((c) => m.set(String(c.id), c.name));
  return m;
}, [companies]);

const customerNameById = useMemo(() => {
  const m = new Map();
  customers.forEach((c) => m.set(String(c.id), c.name));
  return m;
}, [customers]);

  if (bootLoading) return <Loader />;

  return (
    <div className="report-page">
      <div className="report-header">
        <div>
          <h2 className="report-title">Customer Assignment</h2>
          <div className="report-subtitle">Assign customer to user with company + territory details.</div>
        </div>

        {/* <div className="report-actions">
          <button className="btn-secondary" onClick={resetFilters} disabled={loading}>
            <FiRefreshCw /> Reset
          </button>
          <button className="btn-primary" onClick={applyFilters} disabled={loading}>
            <FiSearch /> {loading ? "Loading..." : "Apply Filters"}
          </button>
        </div> */}
      </div>

      {error ? <div className="error-banner">{error}</div> : null}
      {success ? (
        <div className="error-banner" style={{ borderColor: "rgba(16,185,129,.35)", background: "rgba(16,185,129,.10)", color: "#065F46" }}>
          {success}
        </div>
      ) : null}

      {/* Assign Form */}
      <div className="reportcard">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
          <h3 style={{ margin: 0 }}>Assign Customer</h3>
          {/* <div style={{ opacity: 0.7, fontSize: 13 }}>User list depends on company + effective date.</div> */}
        </div>

        <form onSubmit={submit} style={{ marginTop: 12 }}>
          <div className="filters-grid">
            <div>
              <label className="label">Company</label>
              <select className="input" value={form.companyId} onChange={(e) => onFormChange("companyId", e.target.value)}>
                <option value="">Select</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">User</label>
              <select
                className="input"
                value={form.userId}
                onChange={(e) => onFormChange("userId", e.target.value)}
                disabled={!form.companyId}
              >
                <option value="">{form.companyId ? "Select" : "Select company first"}</option>
                {eligibleUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>

              {form.companyId && eligibleUsers.length === 0 ? (
                <div style={{ marginTop: 6, fontSize: 12, opacity: 0.75 }}>
                  No eligible users for this company on this date. Assign user to company first.
                </div>
              ) : null}
            </div>

            <div>
              <label className="label">Customer</label>
              <select className="input" value={form.customerId} onChange={(e) => onFormChange("customerId", e.target.value)}>
                <option value="">Select</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phone})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Effective From</label>
              <input className="input" type="date" value={form.effectiveFrom} onChange={(e) => onFormChange("effectiveFrom", e.target.value)} />
            </div>

            <div>
              <label className="label">Region</label>
              <input className="input" value={form.region} onChange={(e) => onFormChange("region", e.target.value)} placeholder="Region..." />
            </div>

            <div>
              <label className="label">Area</label>
              <input className="input" value={form.area} onChange={(e) => onFormChange("area", e.target.value)} placeholder="Area..." />
            </div>

            <div>
              <label className="label">Territory</label>
              <input className="input" value={form.territory} onChange={(e) => onFormChange("territory", e.target.value)} placeholder="Territory..." />
            </div>

            <div>
              <label className="label">ParentId (optional)</label>
              <input className="input" value={form.parentId} onChange={(e) => onFormChange("parentId", e.target.value)} placeholder="Parent id..." />
            </div>

            <div>
              <label className="label">Role (optional)</label>
              <input className="input" value={form.role} onChange={(e) => onFormChange("role", e.target.value)} placeholder="FIELD / MANAGER" />
            </div>

            <div style={{ display: "flex", alignItems: "flex-end" }}>
              <button className="btn-primary" type="submit" disabled={loading}>
                <FiPlus /> {loading ? "Saving..." : "Assign"}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Filters */}
      <div className="reportcard">
        <h3 style={{ marginTop: 0 }}>Filters</h3>
        <div className="filters-grid">
          <div>
            <label className="label">Active On</label>
            <input className="input" type="date" value={filters.activeOn} onChange={(e) => onFilterChange("activeOn", e.target.value)} />
          </div>

          <div>
            <label className="label">Company</label>
            <select className="input" value={filters.companyId} onChange={(e) => onFilterChange("companyId", e.target.value)}>
              <option value="">All</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">User</label>
            <select className="input" value={filters.userId} onChange={(e) => onFilterChange("userId", e.target.value)}>
              <option value="">All</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", alignItems: "flex-end", gap: 10 }}>
            <button className="btn-secondary" type="button" onClick={resetFilters} disabled={loading}>
              <FiRefreshCw /> Reset
            </button>
            <button className="btn-primary" type="button" onClick={applyFilters} disabled={loading}>
              <FiSearch /> Search
            </button>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="reportcard">
        <h3 style={{ marginTop: 0 }}>Assignments</h3>

        <div className="table-wrap">
          <table className="table" style={{ minWidth: 980 }}>
            <thead>
              <tr>
                <th>User</th>
                <th>Customer</th>
                <th>Company</th>
                <th>Region</th>
                <th>Area</th>
                <th>Territory</th>
                <th>From</th>
                <th>To</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  {/* <td>{r.user?.name || r.userId}</td>
                  <td>{r.customer?.name || r.customerId}</td>
                  <td>{r.company?.name || r.companyId}</td> */}
                  <td>
                    {r.user?.name ||
                      userNameById.get(String(r.userId)) ||
                      "-"}
                  </td>

                  <td>
                    {r.customer?.name ||
                      customerNameById.get(String(r.customerId)) ||
                      "-"}
                  </td>

                  <td>
                    {r.company?.name ||
                      companyNameById.get(String(r.companyId)) ||
                      "-"}
                  </td>
                  <td>{r.region || "-"}</td>
                  <td>{r.area || "-"}</td>
                  <td>{r.territory || "-"}</td>
                  <td>{String(r.effectiveFrom || "").slice(0, 10)}</td>
                  <td>{r.effectiveTo ? String(r.effectiveTo).slice(0, 10) : "-"}</td>
                </tr>
              ))}

              {!loading && rows.length === 0 ? (
                <tr>
                  <td className="empty" colSpan={8}>
                    No assignments.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        {loading ? <div style={{ marginTop: 10, opacity: 0.7, fontSize: 13 }}>Loading...</div> : null}
      </div>
    </div>
  );
};

export default CustomerAssignment;
