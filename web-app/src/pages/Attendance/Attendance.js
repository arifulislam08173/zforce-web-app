import React, { useContext, useEffect, useMemo, useState } from "react";
import api from "../../api/api";
import Loader from "../../components/Common/Loader";
import "./attendance.css";

import { FiEye, FiFilter, FiLogIn, FiLogOut } from "react-icons/fi";
import { AuthContext } from "../../context/AuthContext";
import Pagination from "../../components/Common/Pagination";

import PunchModal from "./components/PunchModal";
import PreviewModal from "./components/PreviewModal";
import { formatDate, formatDT, isoDate } from "./attendance.utils";

const Attendance = () => {
  const { user } = useContext(AuthContext);
  const role = String(user?.role || "").toUpperCase();

  const isField = role === "FIELD";
  const isAdminManager = role === "ADMIN" || role === "MANAGER";

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");

  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  // Admin/Manager filters
  const [fromDate, setFromDate] = useState(isoDate(new Date()));
  const [toDate, setToDate] = useState(isoDate(new Date()));
  const [userId, setUserId] = useState("");

  const [users, setUsers] = useState([]);

  // punch modal
  const [punchOpen, setPunchOpen] = useState(false);
  const [punchMode, setPunchMode] = useState("IN"); // IN | OUT

  // preview modal
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewRow, setPreviewRow] = useState(null);

  const userMap = useMemo(() => {
    const m = new Map();
    (users || []).forEach((u) => m.set(String(u.id), u.name));
    if (user?.id && user?.name) m.set(String(user.id), user.name);
    return m;
  }, [users, user]);

  const fetchUsersDropdown = async () => {
    const res = await api.get("/users/dropdown");
    setUsers(res.data || []);
  };

  const fetchAttendance = async (page = 1, limit = pagination.limit) => {
    setError("");
    setLoading(true);

    try {
      if (isField) {
        const res = await api.get("/attendance/today");
        const data = res.data?.data ?? res.data;
        const list = Array.isArray(data) ? data : data ? [data] : [];
        setRows(list);
        setPagination({ page: 1, limit: 10, total: list.length, totalPages: 1 });
      } else if (isAdminManager) {
        const params = new URLSearchParams();
        params.set("fromDate", fromDate);
        params.set("toDate", toDate);
        params.set("page", String(page));
        params.set("limit", String(limit));
        if (userId) params.set("userId", userId);

        const res = await api.get(`/attendance/report?${params.toString()}`);
        setRows(res.data?.data || []);
        setPagination(res.data?.pagination || { page, limit, total: 0, totalPages: 1 });
      } else {
        setRows([]);
      }
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.message || "Failed to load attendance");
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
        if (isAdminManager) await fetchUsersDropdown();
        await fetchAttendance(1, pagination.limit);
      } finally {
        setLoading(false);
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSearch = async (e) => {
    e.preventDefault();
    await fetchAttendance(1, pagination.limit);
  };

  const doPunchIn = async ({ latitude, longitude }) => api.post("/attendance/punch-in", { latitude, longitude });
  const doPunchOut = async ({ latitude, longitude }) => api.post("/attendance/punch-out", { latitude, longitude });

  const todayRow = isField && rows.length ? rows[0] : null;
  const hasIn = Boolean(todayRow?.punchIn || todayRow?.checkIn || todayRow?.inTime);
  const hasOut = Boolean(todayRow?.punchOut || todayRow?.checkOut || todayRow?.outTime);

  if (loading) return <Loader />;

  return (
    <div className="att-page">
      <div className="att-header">
        <div>
          <h2 className="att-title">Attendance</h2>
          <p className="att-subtitle">{isField ? "Punch-in / punch-out for today" : "Attendance report"}</p>
        </div>

        {isField ? (
          <div className="att-top-actions">
            <button
              className="att-btn-secondary"
              type="button"
              onClick={() => {
                setPunchMode("IN");
                setPunchOpen(true);
              }}
              disabled={hasIn}
            >
              <FiLogIn style={{ marginRight: 8 }} />
              Punch In
            </button>

            <button
              className="att-btn-primary"
              type="button"
              onClick={() => {
                setPunchMode("OUT");
                setPunchOpen(true);
              }}
              disabled={!hasIn || hasOut}
            >
              <FiLogOut style={{ marginRight: 8 }} />
              Punch Out
            </button>
          </div>
        ) : null}
      </div>

      {error ? <div className="att-alert-error">{error}</div> : null}

      {isAdminManager ? (
        <form className="att-card att-filters" onSubmit={onSearch}>
          <div>
            <label className="att-label">From</label>
            <input className="att-input" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </div>

          <div>
            <label className="att-label">To</label>
            <input className="att-input" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </div>

          <div>
            <label className="att-label">User</label>
            <select className="att-input" value={userId} onChange={(e) => setUserId(e.target.value)}>
              <option value="">All users</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          <button className="att-btn-secondary" type="submit">
            <FiFilter style={{ marginRight: 8 }} />
            Search
          </button>
        </form>
      ) : null}

      <div className="att-card">
        <div className="att-table-wrap">
          <table className="att-table">
            <thead>
              <tr>
                <th style={{ width: 70 }}>#</th>
                <th>Date</th>
                <th>User</th>
                {isAdminManager ? <th>User ID</th> : null}
                <th>Punch In</th>
                <th>Punch Out</th>
                {isAdminManager ? <th style={{ width: 90 }}>View</th> : null}
              </tr>
            </thead>

            <tbody>
              {rows.length ? (
                rows.map((r, index) => {
                  const uName = userMap.get(String(r.userId)) || "-";
                  const inTime = r.punchIn;
                  const outTime = r.punchOut;
                  const date = r.date;

                  return (
                    <tr key={r.id || `${r.userId}-${index}`}>
                      <td>{(pagination.page - 1) * pagination.limit + index + 1}</td>
                      <td>{formatDate(date)}</td>
                      <td>{uName}</td>
                      {isAdminManager ? <td className="att-mono">{r.userId}</td> : null}
                      <td>{formatDT(inTime)}</td>
                      <td>{formatDT(outTime)}</td>

                      {isAdminManager ? (
                        <td>
                          <button
                            className="att-icon-btn"
                            type="button"
                            title="Preview locations"
                            onClick={() => {
                              setPreviewRow(r);
                              setPreviewOpen(true);
                            }}
                          >
                            <FiEye size={18} />
                          </button>
                        </td>
                      ) : null}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={isAdminManager ? 7 : 5} className="att-empty">
                    No attendance found
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {isAdminManager ? (
            <Pagination
              pagination={pagination}
              onPageChange={(p) => fetchAttendance(p, pagination.limit)}
              onLimitChange={(newLimit) => fetchAttendance(1, newLimit)}
              limitOptions={[10, 20, 50]}
            />
          ) : null}
        </div>
      </div>

      <PunchModal
        open={punchOpen}
        mode={punchMode}
        onClose={() => setPunchOpen(false)}
        onConfirm={async (payload) => {
          if (punchMode === "IN") await doPunchIn(payload);
          else await doPunchOut(payload);
          await fetchAttendance();
        }}
      />

      <PreviewModal
        open={previewOpen}
        row={previewRow}
        userName={previewRow ? userMap.get(String(previewRow.userId)) || "-" : "-"}
        onClose={() => {
          setPreviewOpen(false);
          setPreviewRow(null);
        }}
      />
    </div>
  );
};

export default Attendance;
