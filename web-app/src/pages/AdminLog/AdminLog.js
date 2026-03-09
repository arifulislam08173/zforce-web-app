import React, { useEffect, useState, useCallback } from "react";
import api from "../../api/api";
import Loader from "../../components/Common/Loader";
import Pagination from "../../components/Common/Pagination";

const fmt = (v) => {
  if (!v) return "-";
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? String(v) : d.toLocaleString();
};

const pretty = (obj) => {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj || "");
  }
};

const AdminLog = () => {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [filters, setFilters] = useState({
    q: "",
    action: "",
    entityType: "",
    fromDate: "",
    toDate: "",
  });
  const [expandedId, setExpandedId] = useState("");

  const fetchLogs = useCallback(
    async (page = 1, limit = pagination.limit) => {
      try {
        setLoading(true);
        const params = new URLSearchParams({ page: String(page), limit: String(limit) });
        Object.entries(filters).forEach(([k, v]) => {
          if (String(v || "").trim()) params.set(k, String(v).trim());
        });
        const res = await api.get(`/admin-logs?${params.toString()}`);
        setLogs(res.data?.data || []);
        setPagination(res.data?.pagination || { page: 1, limit, total: 0, totalPages: 1 });
      } catch (err) {
        console.error(err);
        setLogs([]);
      } finally {
        setLoading(false);
      }
    },
    [pagination.limit, filters]
  );

  useEffect(() => {
    fetchLogs(1, pagination.limit);
  }, [fetchLogs, pagination.limit]);

  const onSearch = (e) => {
    e.preventDefault();
    fetchLogs(1, pagination.limit);
  };

  if (loading) return <Loader />;

  return (
    <div className="order-page">
      <div className="order-header">
        <div>
          <h2 className="order-title">Admin Logs</h2>
          <p className="order-subtitle">Track which admin or manager created, updated, or deleted data</p>
        </div>
      </div>

      <form className="ordercard order-filters" onSubmit={onSearch}>
        <input
          className="input of-input of-search"
          value={filters.q}
          onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
          placeholder="Search actor / entity / description"
        />
        <input
          className="input of-input of-date"
          type="date"
          value={filters.fromDate}
          onChange={(e) => setFilters((f) => ({ ...f, fromDate: e.target.value }))}
        />
        <input
          className="input of-input of-date"
          type="date"
          value={filters.toDate}
          onChange={(e) => setFilters((f) => ({ ...f, toDate: e.target.value }))}
        />
        <select
          className="input of-input of-select"
          value={filters.action}
          onChange={(e) => setFilters((f) => ({ ...f, action: e.target.value }))}
        >
          <option value="">All actions</option>
          <option value="CREATE">CREATE</option>
          <option value="UPDATE">UPDATE</option>
          <option value="DELETE">DELETE</option>
        </select>
        <input
          className="input of-input of-select"
          value={filters.entityType}
          onChange={(e) => setFilters((f) => ({ ...f, entityType: e.target.value }))}
          placeholder="Entity type, e.g. Order"
        />
        <button className="btn-secondary of-btn" type="submit">
          Search
        </button>
      </form>

      <div className="ordercard">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Actor</th>
                <th>Role</th>
                <th>Action</th>
                <th>Entity</th>
                <th>Description</th>
                <th>Snapshot</th>
              </tr>
            </thead>
            <tbody>
              {logs.length ? (
                logs.map((log) => {
                  const expanded = expandedId === log.id;
                  return (
                    <React.Fragment key={log.id}>
                      <tr>
                        <td>{fmt(log.createdAt)}</td>
                        <td>
                          {log.actorName || "-"}
                          <br />
                          <span style={{ fontSize: 12, color: "#667085" }}>{log.actorEmail || "-"}</span>
                        </td>
                        <td>{log.actorRole || "-"}</td>
                        <td>{log.action}</td>
                        <td>
                          {log.entityType} <br />
                          <span style={{ fontSize: 12, color: "#667085" }}>{log.entityId}</span>
                        </td>
                        <td>{log.description || "-"}</td>
                        <td>
                          <button
                            type="button"
                            className="btn-link"
                            onClick={() => setExpandedId(expanded ? "" : log.id)}
                          >
                            {expanded ? "Hide" : "View"}
                          </button>
                        </td>
                      </tr>
                      {expanded ? (
                        <tr>
                          <td colSpan="7" style={{ background: "#fafafa" }}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                              <div>
                                <div style={{ fontWeight: 700, marginBottom: 8 }}>Before</div>
                                <pre style={{ whiteSpace: "pre-wrap", fontSize: 12 }}>
                                  {pretty(log.beforeData)}
                                </pre>
                              </div>
                              <div>
                                <div style={{ fontWeight: 700, marginBottom: 8 }}>After</div>
                                <pre style={{ whiteSpace: "pre-wrap", fontSize: 12 }}>
                                  {pretty(log.afterData)}
                                </pre>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : null}
                    </React.Fragment>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="empty">
                    No logs found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          pagination={pagination}
          onPageChange={(p) => fetchLogs(p, pagination.limit)}
          onLimitChange={(newLimit) => fetchLogs(1, newLimit)}
          limitOptions={[10, 20, 50]}
        />
      </div>
    </div>
  );
};

export default AdminLog;