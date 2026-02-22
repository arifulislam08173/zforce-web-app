import React, { useEffect, useMemo, useState } from "react";
import api from "../../api/api";
import Loader from "../../components/Common/Loader";
import Pagination from "../../components/Common/Pagination";
import { downloadBlob } from "./download";
import { FiDownload, FiRefreshCw, FiSearch } from "react-icons/fi";
import "./report.css";

const today = () => new Date().toISOString().slice(0, 10);
const startOfYear = () => `${new Date().getFullYear()}-01-01`;

const money = (n) => Number(n || 0).toFixed(2);

const SalesReport = () => {
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
    companyId: "",
    userId: "",
    customerId: "",
    region: "",
    area: "",
    territory: "",
    parentId: "",
    role: "",
    status: "",
    paymentStatus: "",
    q: "",
  });

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState(null);

  const [totals, setTotals] = useState({
    totalOrders: 0,
    totalSales: 0,
    totalCollected: 0,
    totalDue: 0,
  });

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

  const fetchRowsAndTotals = async (nextPage = page, nextLimit = limit) => {
    setLoading(true);
    setError("");
    try {
      const query = {
        ...params,
        page: nextPage,
        limit: nextLimit,
      };

      const [r1, t1] = await Promise.all([
        api.get("/reports/orders", { params: query }),
        api.get("/reports/totals", { params }),
      ]);

      setRows(r1.data?.data || []);
      setPagination(r1.data?.pagination || null);

      const td = t1.data?.data || {};
      setTotals({
        totalOrders: Number(td.totalOrders || 0),
        totalSales: Number(td.totalSales || 0),
        totalCollected: Number(td.totalCollected || 0),
        totalDue: Number(td.totalDue || 0),
      });
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "Failed to load sales report";
      setError(msg);
      setRows([]);
      setPagination(null);
      setTotals({ totalOrders: 0, totalSales: 0, totalCollected: 0, totalDue: 0 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      setBootLoading(true);
      try {
        await loadMasters();
        await fetchRowsAndTotals(1, limit);
        setPage(1);
      } finally {
        setBootLoading(false);
      }
    })();
    // eslint-disable-next-line
  }, []);

  const set = (k, v) => setFilters((s) => ({ ...s, [k]: v }));

  const apply = async () => {
    setPage(1);
    await fetchRowsAndTotals(1, limit);
  };

  const reset = async () => {
    setFilters({
      from: startOfYear(),
      to: today(),
      companyId: "",
      userId: "",
      customerId: "",
      region: "",
      area: "",
      territory: "",
      parentId: "",
      role: "",
      status: "",
      paymentStatus: "",
      q: "",
    });
    setPage(1);
    setTimeout(() => fetchRowsAndTotals(1, limit), 0);
  };

  const onPageChange = async (p) => {
    setPage(p);
    await fetchRowsAndTotals(p, limit);
  };

  const onLimitChange = async (n) => {
    setLimit(n);
    setPage(1);
    await fetchRowsAndTotals(1, n);
  };

  const downloadPdf = async () => {
    setDownloading(true);
    setError("");
    try {
      const res = await api.get("/reports/orders.pdf", {
        params,
        responseType: "blob",
      });

      const name = `sales-report-${(filters.from || "from")}-${(filters.to || "to")}.pdf`;
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
          <h2 className="report-title">Sales Report</h2>
          <div className="report-subtitle">
            Filter orders and track Sales / Collected / Due with pagination.
          </div>
        </div>

        <div className="report-actions">
          <button className="btn-secondary" onClick={reset} disabled={loading}>
            <FiRefreshCw />
            Reset
          </button>

          <button className="btn-secondary" onClick={downloadPdf} disabled={loading || downloading}>
            <FiDownload />
            {downloading ? "Downloading..." : "Download PDF"}
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

          <div className="filters-wide">
            <label className="label">Search (order / customer / phone / user)</label>
            <input
              className="input"
              value={filters.q}
              onChange={(e) => set("q", e.target.value)}
              placeholder="Type to search..."
            />
          </div>
        </div>
      </div>

      {/* Totals bar */}
      <div className="stats-grid">
        <div className="statcard">
          <div className="stat-label">Total Orders</div>
          <div className="stat-value">{totals.totalOrders}</div>
        </div>

        <div className="statcard">
          <div className="stat-label">Total Sales</div>
          <div className="stat-value">{money(totals.totalSales)}</div>
        </div>

        <div className="statcard">
          <div className="stat-label">Total Collected</div>
          <div className="stat-value">{money(totals.totalCollected)}</div>
        </div>

        <div className="statcard">
          <div className="stat-label">Total Due</div>
          <div className="stat-value">{money(totals.totalDue)}</div>
        </div>
      </div>

      {/* Table */}
      <div className="reportcard">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Date</th>
                <th>User</th>
                <th>Customer</th>
                <th>Status</th>
                <th>Payment</th>
                <th style={{ textAlign: "right" }}>Total</th>
                <th style={{ textAlign: "right" }}>Paid</th>
                <th style={{ textAlign: "right" }}>Due</th>
                <th>Area</th>
                <th>Territory</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((o) => {
                const total = Number(o.totalAmount || 0);
                const paid = Number(o.paidAmount || 0);
                const due = Math.max(0, total - paid);

                return (
                  <tr key={o.id}>
                    <td>{o.orderNumber || o.id}</td>
                    <td>{String(o.date || "").slice(0, 10)}</td>
                    <td>{o.user?.name || o.userId}</td>
                    <td>{o.customer?.name || o.customerId}</td>
                    <td>{o.status || "-"}</td>
                    <td>{o.paymentStatus || "-"}</td>
                    <td style={{ textAlign: "right" }}>{money(total)}</td>
                    <td style={{ textAlign: "right" }}>{money(paid)}</td>
                    <td style={{ textAlign: "right" }}>{money(due)}</td>
                    <td>{o.orderRole?.area || "-"}</td>
                    <td>{o.orderRole?.territory || "-"}</td>
                  </tr>
                );
              })}

              {!loading && rows.length === 0 ? (
                <tr>
                  <td className="empty" colSpan={11}>
                    No results found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: 12 }}>
          <Pagination
            pagination={pagination || { page, limit, total: totals.totalOrders, totalPages: 1 }}
            onPageChange={onPageChange}
            onLimitChange={onLimitChange}
            limitOptions={[10, 20, 50, 100]}
            showLimit={true}
          />
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

export default SalesReport;
