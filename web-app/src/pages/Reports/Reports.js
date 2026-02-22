// import React, { useEffect, useMemo, useState } from "react";
// import api from "../../api/api";
// import Loader from "../../components/Common/Loader";

// const today = () => new Date().toISOString().slice(0, 10);
// const startOfYear = () => `${new Date().getFullYear()}-01-01`;

// const groupOptions = [
//   { value: "user", label: "User" },
//   { value: "area", label: "Area" },
//   { value: "territory", label: "Territory" },
//   { value: "region", label: "Region" },
//   { value: "company", label: "Company" },
//   { value: "customer", label: "Customer" },
//   { value: "parent", label: "Manager (Parent)" },
//   { value: "month", label: "Month" },
//   { value: "day", label: "Day" },
// ];

// const Reports = () => {
//   const [loading, setLoading] = useState(true);

//   const [companies, setCompanies] = useState([]);
//   const [users, setUsers] = useState([]);
//   const [customers, setCustomers] = useState([]);

//   const [filters, setFilters] = useState({
//     from: startOfYear(),
//     to: today(),
//     status: "",
//     companyId: "",
//     userId: "",
//     customerId: "",
//     region: "",
//     area: "",
//     territory: "",
//     parentId: "",
//     role: "",
//     groupBy: "user",
//   });

//   const [performance, setPerformance] = useState([]);
//   const [summary, setSummary] = useState([]);

//   const params = useMemo(() => {
//     const p = {};
//     Object.keys(filters).forEach((k) => {
//       const v = filters[k];
//       if (v !== null && v !== undefined && String(v).trim() !== "") p[k] = v;
//     });
//     return p;
//   }, [filters]);

//   const loadMasters = async () => {
//     const [c1, u1, cu1] = await Promise.all([
//       api.get("/companies/dropdown"),
//       api.get("/users/dropdown"),
//       api.get("/customers/dropdown"),
//     ]);
//     setCompanies(c1.data || []);
//     setUsers(u1.data || []);
//     setCustomers(cu1.data || []);
//   };

//   const loadReports = async () => {
//     setLoading(true);
//     try {
//       const [p1, s1] = await Promise.all([
//         api.get("/reports/performance", { params }),
//         api.get("/reports/summary", { params: { ...params, groupBy: filters.groupBy } }),
//       ]);

//       setPerformance(p1.data?.data || []);
//       setSummary(s1.data?.data || []);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     (async () => {
//       setLoading(true);
//       try {
//         await loadMasters();
//         await loadReports();
//       } finally {
//         setLoading(false);
//       }
//     })();
//     // eslint-disable-next-line
//   }, []);

//   const set = (k, v) => setFilters((s) => ({ ...s, [k]: v }));

//   const apply = async () => loadReports();

//   const reset = async () => {
//     setFilters({
//       from: startOfYear(),
//       to: today(),
//       status: "",
//       companyId: "",
//       userId: "",
//       customerId: "",
//       region: "",
//       area: "",
//       territory: "",
//       parentId: "",
//       role: "",
//       groupBy: "user",
//     });
//     setTimeout(loadReports, 0);
//   };

//   if (loading) return <Loader />;

//   return (
//     <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
//       <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
//         <div>
//           <h2 style={{ margin: 0 }}>Reports</h2>
//           <div style={{ opacity: 0.7, fontSize: 13 }}>Performance + Summary (A–Z filters)</div>
//         </div>
//         <div style={{ display: "flex", gap: 10 }}>
//           <button onClick={apply} style={{ padding: "10px 14px", cursor: "pointer" }}>Apply</button>
//           <button onClick={reset} style={{ padding: "10px 14px", cursor: "pointer" }}>Reset</button>
//         </div>
//       </div>

//       {/* Filters */}
//       <div style={{ background: "#fff", border: "1px solid rgba(0,0,0,.08)", borderRadius: 12, padding: 14 }}>
//         <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
//           <div>
//             <label>From</label>
//             <input type="date" value={filters.from} onChange={(e) => set("from", e.target.value)} style={{ width: "100%", padding: 10 }} />
//           </div>
//           <div>
//             <label>To</label>
//             <input type="date" value={filters.to} onChange={(e) => set("to", e.target.value)} style={{ width: "100%", padding: 10 }} />
//           </div>

//           <div>
//             <label>Status</label>
//             <select value={filters.status} onChange={(e) => set("status", e.target.value)} style={{ width: "100%", padding: 10 }}>
//               <option value="">All</option>
//               <option value="PENDING">PENDING</option>
//               <option value="APPROVED">APPROVED</option>
//               <option value="REJECTED">REJECTED</option>
//               <option value="DELIVERED">DELIVERED</option>
//             </select>
//           </div>

//           <div>
//             <label>Company</label>
//             <select value={filters.companyId} onChange={(e) => set("companyId", e.target.value)} style={{ width: "100%", padding: 10 }}>
//               <option value="">All</option>
//               {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
//             </select>
//           </div>

//           <div>
//             <label>User</label>
//             <select value={filters.userId} onChange={(e) => set("userId", e.target.value)} style={{ width: "100%", padding: 10 }}>
//               <option value="">All</option>
//               {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
//             </select>
//           </div>

//           <div>
//             <label>Customer</label>
//             <select value={filters.customerId} onChange={(e) => set("customerId", e.target.value)} style={{ width: "100%", padding: 10 }}>
//               <option value="">All</option>
//               {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
//             </select>
//           </div>

//           <div>
//             <label>Region</label>
//             <input value={filters.region} onChange={(e) => set("region", e.target.value)} style={{ width: "100%", padding: 10 }} />
//           </div>

//           <div>
//             <label>Area</label>
//             <input value={filters.area} onChange={(e) => set("area", e.target.value)} style={{ width: "100%", padding: 10 }} />
//           </div>

//           <div>
//             <label>Territory</label>
//             <input value={filters.territory} onChange={(e) => set("territory", e.target.value)} style={{ width: "100%", padding: 10 }} />
//           </div>

//           <div>
//             <label>Parent/Manager Id</label>
//             <input value={filters.parentId} onChange={(e) => set("parentId", e.target.value)} style={{ width: "100%", padding: 10 }} />
//           </div>

//           <div>
//             <label>Role</label>
//             <input value={filters.role} onChange={(e) => set("role", e.target.value)} style={{ width: "100%", padding: 10 }} />
//           </div>

//           <div>
//             <label>Summary Group By</label>
//             <select value={filters.groupBy} onChange={(e) => set("groupBy", e.target.value)} style={{ width: "100%", padding: 10 }}>
//               {groupOptions.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
//             </select>
//           </div>
//         </div>
//       </div>

//       {/* Performance */}
//       <div style={{ background: "#fff", border: "1px solid rgba(0,0,0,.08)", borderRadius: 12, padding: 14 }}>
//         <h3 style={{ marginTop: 0 }}>User Performance</h3>
//         <table style={{ width: "100%", borderCollapse: "collapse" }}>
//           <thead>
//             <tr>
//               <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid rgba(0,0,0,.06)" }}>User</th>
//               <th style={{ textAlign: "right", padding: 8, borderBottom: "1px solid rgba(0,0,0,.06)" }}>Orders</th>
//               <th style={{ textAlign: "right", padding: 8, borderBottom: "1px solid rgba(0,0,0,.06)" }}>Total Sales</th>
//               <th style={{ textAlign: "right", padding: 8, borderBottom: "1px solid rgba(0,0,0,.06)" }}>Avg</th>
//               <th style={{ textAlign: "right", padding: 8, borderBottom: "1px solid rgba(0,0,0,.06)" }}>Max</th>
//             </tr>
//           </thead>
//           <tbody>
//             {performance.map((r) => (
//               <tr key={r.userId}>
//                 <td style={{ padding: 8, borderBottom: "1px solid rgba(0,0,0,.06)" }}>{r.userName}</td>
//                 <td style={{ padding: 8, textAlign: "right", borderBottom: "1px solid rgba(0,0,0,.06)" }}>{r.totalOrders}</td>
//                 <td style={{ padding: 8, textAlign: "right", borderBottom: "1px solid rgba(0,0,0,.06)" }}>{Number(r.totalSales).toFixed(2)}</td>
//                 <td style={{ padding: 8, textAlign: "right", borderBottom: "1px solid rgba(0,0,0,.06)" }}>{Number(r.avgOrderValue).toFixed(2)}</td>
//                 <td style={{ padding: 8, textAlign: "right", borderBottom: "1px solid rgba(0,0,0,.06)" }}>{Number(r.maxOrderValue).toFixed(2)}</td>
//               </tr>
//             ))}
//             {!performance.length && (
//               <tr><td colSpan={5} style={{ padding: 10, opacity: 0.7 }}>No data</td></tr>
//             )}
//           </tbody>
//         </table>
//       </div>

//       {/* Summary */}
//       <div style={{ background: "#fff", border: "1px solid rgba(0,0,0,.08)", borderRadius: 12, padding: 14 }}>
//         <h3 style={{ marginTop: 0 }}>Summary: {filters.groupBy}</h3>
//         <table style={{ width: "100%", borderCollapse: "collapse" }}>
//           <thead>
//             <tr>
//               <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid rgba(0,0,0,.06)" }}>Group</th>
//               <th style={{ textAlign: "right", padding: 8, borderBottom: "1px solid rgba(0,0,0,.06)" }}>Orders</th>
//               <th style={{ textAlign: "right", padding: 8, borderBottom: "1px solid rgba(0,0,0,.06)" }}>Total Sales</th>
//               <th style={{ textAlign: "right", padding: 8, borderBottom: "1px solid rgba(0,0,0,.06)" }}>Avg</th>
//             </tr>
//           </thead>
//           <tbody>
//             {summary.map((r, idx) => {
//               const groupLabel =
//                 r.userName ||
//                 r.customerName ||
//                 r.area ||
//                 r.territory ||
//                 r.region ||
//                 r.companyId ||
//                 r.parentId ||
//                 r.month ||
//                 r.day ||
//                 `#${idx + 1}`;

//               return (
//                 <tr key={idx}>
//                   <td style={{ padding: 8, borderBottom: "1px solid rgba(0,0,0,.06)" }}>{groupLabel}</td>
//                   <td style={{ padding: 8, textAlign: "right", borderBottom: "1px solid rgba(0,0,0,.06)" }}>{r.totalOrders}</td>
//                   <td style={{ padding: 8, textAlign: "right", borderBottom: "1px solid rgba(0,0,0,.06)" }}>{Number(r.totalSales).toFixed(2)}</td>
//                   <td style={{ padding: 8, textAlign: "right", borderBottom: "1px solid rgba(0,0,0,.06)" }}>{Number(r.avgOrderValue).toFixed(2)}</td>
//                 </tr>
//               );
//             })}
//             {!summary.length && (
//               <tr><td colSpan={4} style={{ padding: 10, opacity: 0.7 }}>No data</td></tr>
//             )}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// };

// export default Reports;













import React, { useEffect, useMemo, useState } from "react";
import api from "../../api/api";
import Loader from "../../components/Common/Loader";
import { downloadBlob } from "./download";
import { FiDownload, FiRefreshCw, FiSearch } from "react-icons/fi";
import "./report.css";

const today = () => new Date().toISOString().slice(0, 10);
const startOfYear = () => `${new Date().getFullYear()}-01-01`;
const money = (n) => Number(n || 0).toFixed(2);

const groupOptions = [
  { value: "user", label: "User" },
  { value: "area", label: "Area" },
  { value: "territory", label: "Territory" },
  { value: "region", label: "Region" },
  { value: "company", label: "Company" },
  { value: "customer", label: "Customer" },
  { value: "parent", label: "Manager (Parent)" },
  { value: "month", label: "Month" },
  { value: "day", label: "Day" },
];

const Reports = () => {
  const [bootLoading, setBootLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");

  const [companies, setCompanies] = useState([]);
  const [users, setUsers] = useState([]);
  const [customers, setCustomers] = useState([]);

  const [filters, setFilters] = useState({
    from: startOfYear(),
    to: today(),
    status: "",
    paymentStatus: "",
    companyId: "",
    userId: "",
    customerId: "",
    region: "",
    area: "",
    territory: "",
    parentId: "",
    role: "",
    groupBy: "user",
  });

  const [performance, setPerformance] = useState([]);
  const [summary, setSummary] = useState([]);

  const params = useMemo(() => {
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

  const loadReports = async () => {
    setLoading(true);
    setError("");
    try {
      const [p1, s1] = await Promise.all([
        api.get("/reports/performance", { params }),
        api.get("/reports/summary", { params: { ...params, groupBy: filters.groupBy } }),
      ]);

      setPerformance(p1.data?.data || []);
      setSummary(s1.data?.data || []);
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "Failed to load reports";
      setError(msg);
      setPerformance([]);
      setSummary([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      setBootLoading(true);
      try {
        await loadMasters();
        await loadReports();
      } finally {
        setBootLoading(false);
      }
    })();
    // eslint-disable-next-line
  }, []);

  const set = (k, v) => setFilters((s) => ({ ...s, [k]: v }));

  const apply = async () => loadReports();

  const reset = async () => {
    setFilters({
      from: startOfYear(),
      to: today(),
      status: "",
      paymentStatus: "",
      companyId: "",
      userId: "",
      customerId: "",
      region: "",
      area: "",
      territory: "",
      parentId: "",
      role: "",
      groupBy: "user",
    });
    setTimeout(loadReports, 0);
  };

  const downloadPerformancePdf = async () => {
    setDownloading(true);
    setError("");
    try {
      const res = await api.get("/reports/performance.pdf", {
        params,
        responseType: "blob",
      });

      const name = `performance-report-${(filters.from || "from")}-${(filters.to || "to")}.pdf`;
      downloadBlob(res.data, name);
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "Failed to download PDF";
      setError(msg);
    } finally {
      setDownloading(false);
    }
  };

  if (bootLoading) return <Loader />;

  return (
    <div className="report-page">
      <div className="report-header">
        <div>
          <h2 className="report-title">Reports</h2>
          <div className="report-subtitle">
            Performance + Summary with filters and PDF export.
          </div>
        </div>

        <div className="report-actions">
          <button className="btn-secondary" onClick={reset} disabled={loading}>
            <FiRefreshCw />
            Reset
          </button>

          <button
            className="btn-secondary"
            onClick={downloadPerformancePdf}
            disabled={loading || downloading}
          >
            <FiDownload />
            {downloading ? "Downloading..." : "Download Performance PDF"}
          </button>

          <button className="btn-primary" onClick={apply} disabled={loading}>
            <FiSearch />
            {loading ? "Loading..." : "Search"}
          </button>
        </div>
      </div>

      {error ? <div className="error-banner">{error}</div> : null}

      {/* Filters */}
      <div className="reportcard">
        <div className="filters-grid">
          <div>
            <label className="label">From</label>
            <input
              className="input"
              type="date"
              value={filters.from}
              onChange={(e) => set("from", e.target.value)}
            />
          </div>

          <div>
            <label className="label">To</label>
            <input
              className="input"
              type="date"
              value={filters.to}
              onChange={(e) => set("to", e.target.value)}
            />
          </div>

          <div>
            <label className="label">Order Status</label>
            <select
              className="input"
              value={filters.status}
              onChange={(e) => set("status", e.target.value)}
            >
              <option value="">All</option>
              <option value="PENDING">PENDING</option>
              <option value="APPROVED">APPROVED</option>
              <option value="REJECTED">REJECTED</option>
              <option value="DELIVERED">DELIVERED</option>
              <option value="COMPLETED">COMPLETED</option>
            </select>
          </div>

          <div>
            <label className="label">Payment Status</label>
            <select
              className="input"
              value={filters.paymentStatus}
              onChange={(e) => set("paymentStatus", e.target.value)}
            >
              <option value="">All</option>
              <option value="UNPAID">UNPAID</option>
              <option value="PARTIAL">PARTIAL</option>
              <option value="PAID">PAID</option>
            </select>
          </div>

          <div>
            <label className="label">Company</label>
            <select
              className="input"
              value={filters.companyId}
              onChange={(e) => set("companyId", e.target.value)}
            >
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
            <select
              className="input"
              value={filters.userId}
              onChange={(e) => set("userId", e.target.value)}
            >
              <option value="">All</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Customer</label>
            <select
              className="input"
              value={filters.customerId}
              onChange={(e) => set("customerId", e.target.value)}
            >
              <option value="">All</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Region</label>
            <input
              className="input"
              value={filters.region}
              onChange={(e) => set("region", e.target.value)}
              placeholder="Region..."
            />
          </div>

          <div>
            <label className="label">Area</label>
            <input
              className="input"
              value={filters.area}
              onChange={(e) => set("area", e.target.value)}
              placeholder="Area..."
            />
          </div>

          <div>
            <label className="label">Territory</label>
            <input
              className="input"
              value={filters.territory}
              onChange={(e) => set("territory", e.target.value)}
              placeholder="Territory..."
            />
          </div>

          <div>
            <label className="label">Parent/Manager Id</label>
            <input
              className="input"
              value={filters.parentId}
              onChange={(e) => set("parentId", e.target.value)}
              placeholder="Parent Id..."
            />
          </div>

          <div>
            <label className="label">Role (snapshot)</label>
            <input
              className="input"
              value={filters.role}
              onChange={(e) => set("role", e.target.value)}
              placeholder="FIELD / MANAGER"
            />
          </div>

          <div>
            <label className="label">Summary Group By</label>
            <select
              className="input"
              value={filters.groupBy}
              onChange={(e) => set("groupBy", e.target.value)}
            >
              {groupOptions.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Performance */}
      <div className="reportcard">
        <h3 style={{ marginTop: 0 }}>User Performance</h3>
        <div className="table-wrap">
          <table className="table" style={{ minWidth: 720 }}>
            <thead>
              <tr>
                <th>User</th>
                <th style={{ textAlign: "right" }}>Orders</th>
                <th style={{ textAlign: "right" }}>Total Sales</th>
                <th style={{ textAlign: "right" }}>Avg</th>
                <th style={{ textAlign: "right" }}>Max</th>
              </tr>
            </thead>
            <tbody>
              {performance.map((r) => (
                <tr key={r.userId}>
                  <td>{r.userName}</td>
                  <td style={{ textAlign: "right" }}>{Number(r.totalOrders || 0)}</td>
                  <td style={{ textAlign: "right" }}>{money(r.totalSales)}</td>
                  <td style={{ textAlign: "right" }}>{money(r.avgOrderValue)}</td>
                  <td style={{ textAlign: "right" }}>{money(r.maxOrderValue)}</td>
                </tr>
              ))}

              {!loading && performance.length === 0 ? (
                <tr>
                  <td className="empty" colSpan={5}>
                    No performance data.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      <div className="reportcard">
        <h3 style={{ marginTop: 0 }}>Summary: {filters.groupBy}</h3>
        <div className="table-wrap">
          <table className="table" style={{ minWidth: 720 }}>
            <thead>
              <tr>
                <th>Group</th>
                <th style={{ textAlign: "right" }}>Orders</th>
                <th style={{ textAlign: "right" }}>Total Sales</th>
                <th style={{ textAlign: "right" }}>Avg</th>
              </tr>
            </thead>
            <tbody>
              {summary.map((r, idx) => {
                const groupLabel =
                  r.userName ||
                  r.customerName ||
                  r.area ||
                  r.territory ||
                  r.region ||
                  r.companyId ||
                  r.parentId ||
                  r.month ||
                  r.day ||
                  `#${idx + 1}`;

                return (
                  <tr key={idx}>
                    <td>{groupLabel}</td>
                    <td style={{ textAlign: "right" }}>{Number(r.totalOrders || 0)}</td>
                    <td style={{ textAlign: "right" }}>{money(r.totalSales)}</td>
                    <td style={{ textAlign: "right" }}>{money(r.avgOrderValue)}</td>
                  </tr>
                );
              })}

              {!loading && summary.length === 0 ? (
                <tr>
                  <td className="empty" colSpan={4}>
                    No summary data.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {loading ? (
        <div style={{ opacity: 0.7, fontSize: 13 }}>
          Loading report data...
        </div>
      ) : null}
    </div>
  );
};

export default Reports;
