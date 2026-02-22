import React, { useEffect, useMemo, useState } from "react";
import api from "../../api/api";
import Loader from "../../components/Common/Loader";
import { FiRefreshCw, FiSearch, FiPlus } from "react-icons/fi";

import "../Reports/report.css";

const today = () => new Date().toISOString().slice(0, 10);

const UserCompanyAssignment = () => {
  const [bootLoading, setBootLoading] = useState(true);
  const [loading, setLoading] = useState(false);

  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [rows, setRows] = useState([]);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [filters, setFilters] = useState({
    userId: "",
    companyId: "",
  });

  const [form, setForm] = useState({
    userId: "",
    companyId: "",
    departmentId: "",
    designationId: "",
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


  const loadMasters = async () => {
    const [uRes, cRes] = await Promise.all([api.get("/users/dropdown"), api.get("/companies/dropdown")]);
    setUsers(uRes.data || []);
    setCompanies(cRes.data || []);
  };

  const loadList = async (params = filterParams) => {
    setLoading(true);
    setError("");
    try {
      const list = await api.get("/user-companies", { params });
      setRows(list.data?.data || []);
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || "Failed to load assignments";
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

  const onFormChange = (k, v) => setForm((s) => ({ ...s, [k]: v }));
  const onFilterChange = (k, v) => setFilters((s) => ({ ...s, [k]: v }));

  const applyFilters = async () => {
    setSuccess("");
    await loadList(filterParams);
  };

  const resetFilters = async () => {
    setSuccess("");
    setFilters({ userId: "", companyId: "" });
    setTimeout(() => loadList({}), 0);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.userId || !form.companyId || !form.effectiveFrom) {
      setError("User, Company and Effective From are required.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/user-companies/assign", {
        userId: form.userId,
        companyId: form.companyId,
        departmentId: form.departmentId || null,
        designationId: form.designationId || null,
        effectiveFrom: form.effectiveFrom,
      });

      setSuccess("User assigned to company successfully.");
      setForm((s) => ({ ...s, departmentId: "", designationId: "" }));
      await loadList(filterParams);
    } catch (e2) {
      const msg = e2?.response?.data?.message || e2?.message || "Failed to assign user to company";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (bootLoading) return <Loader />;

  return (
    <div className="report-page">
      <div className="report-header">
        <div>
          <h2 className="report-title">User ↔ Company Assignment</h2>
          {/* <div className="report-subtitle">Assign users to companies with effective date and optional metadata.</div> */}
        </div>
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
          <h3 style={{ margin: 0 }}>Assign User to Company</h3>
          {/* <div style={{ opacity: 0.7, fontSize: 13 }}>Required: User, Company, Effective From</div> */}
        </div>

        <form onSubmit={submit} style={{ marginTop: 12 }}>
          <div className="filters-grid">
            <div>
              <label className="label">User</label>
              <select className="input" value={form.userId} onChange={(e) => onFormChange("userId", e.target.value)}>
                <option value="">Select</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>

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
              <label className="label">Department Id (optional)</label>
              <input
                className="input"
                value={form.departmentId}
                onChange={(e) => onFormChange("departmentId", e.target.value)}
                placeholder="UUID or leave empty"
              />
            </div>

            <div>
              <label className="label">Designation Id (optional)</label>
              <input
                className="input"
                value={form.designationId}
                onChange={(e) => onFormChange("designationId", e.target.value)}
                placeholder="UUID or leave empty"
              />
            </div>

            <div>
              <label className="label">Effective From</label>
              <input className="input" type="date" value={form.effectiveFrom} onChange={(e) => onFormChange("effectiveFrom", e.target.value)} />
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
            <label className="label">Filter User</label>
            <select className="input" value={filters.userId} onChange={(e) => onFilterChange("userId", e.target.value)}>
              <option value="">All</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Filter Company</label>
            <select className="input" value={filters.companyId} onChange={(e) => onFilterChange("companyId", e.target.value)}>
              <option value="">All</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", alignItems: "flex-end", gap: 10 }}>
            <button className="btn-secondary" type="button" onClick={resetFilters} disabled={loading}>
              <FiRefreshCw /> Reset
            </button>
            <button className="btn-primary" type="button" onClick={applyFilters} disabled={loading}>
              <FiSearch /> Apply
            </button>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="reportcard">
        <h3 style={{ marginTop: 0 }}>Assignments</h3>

        <div className="table-wrap">
          <table className="table" style={{ minWidth: 860 }}>
            <thead>
              <tr>
                <th>User</th>
                <th>Company</th>
                <th>Department</th>
                <th>Designation</th>
                <th>From</th>
                <th>To</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  {/* <td>{r.user?.name || r.userId}</td> */}
                  {/* <td>{r.company?.name || r.companyId}</td> */}
                  <td>
                    {r.user?.name || userNameById.get(String(r.userId)) || "-"}
                  </td>
                  <td>
                    {r.company?.name || companyNameById.get(String(r.companyId)) || "_"}
                  </td>
                  <td>{r.departmentId || "-"}</td>
                  <td>{r.designationId || "-"}</td>
                  <td>{String(r.effectiveFrom || "").slice(0, 10)}</td>
                  <td>{r.effectiveTo ? String(r.effectiveTo).slice(0, 10) : "-"}</td>
                </tr>
              ))}

              {!loading && rows.length === 0 ? (
                <tr>
                  <td className="empty" colSpan={6}>
                    No assignments found.
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

export default UserCompanyAssignment;
