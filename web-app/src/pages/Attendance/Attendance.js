// import React, { useContext, useEffect, useMemo, useState } from "react";
// import api from "../../api/api";
// import Loader from "../../components/Common/Loader";
// import "./attendance.css";

// import { FiLogIn, FiLogOut, FiX, FiFilter } from "react-icons/fi";
// import { AuthContext } from "../../context/AuthContext";
// import Pagination from "../../components/Common/Pagination";

// const isoDate = (d) => {
//   const x = new Date(d);
//   const yyyy = x.getFullYear();
//   const mm = String(x.getMonth() + 1).padStart(2, "0");
//   const dd = String(x.getDate()).padStart(2, "0");
//   return `${yyyy}-${mm}-${dd}`;
// };

// const formatDate = (v) => (v ? String(v).slice(0, 10) : "-");
// const formatDT = (v) => (v ? String(v).slice(0, 19).replace("T", " ") : "-");

// const Modal = ({ open, title, subtitle, onClose, children, footer }) => {
//   if (!open) return null;
//   return (
//     <div className="att-modal-overlay" onMouseDown={onClose}>
//       <div className="att-modal" onMouseDown={(e) => e.stopPropagation()}>
//         <div className="att-modal-header">
//           <div>
//             <div className="att-modal-title">{title}</div>
//             {subtitle ? <div className="att-modal-subtitle">{subtitle}</div> : null}
//           </div>
//           <button className="att-icon-btn" type="button" onClick={onClose} title="Close">
//             <FiX size={18} />
//           </button>
//         </div>

//         <div className="att-modal-body">{children}</div>

//         {footer ? <div className="att-modal-footer">{footer}</div> : null}
//       </div>
//     </div>
//   );
// };

// const PunchModal = ({ open, mode, onClose, onConfirm }) => {
//   const [lat, setLat] = useState("");
//   const [lng, setLng] = useState("");
//   const [saving, setSaving] = useState(false);
//   const [err, setErr] = useState("");

//   useEffect(() => {
//     if (!open) return;
//     setLat("");
//     setLng("");
//     setSaving(false);
//     setErr("");
//   }, [open]);

//   const submit = async () => {
//     setErr("");
//     try {
//       setSaving(true);
//       await onConfirm({
//         latitude: lat ? Number(lat) : null,
//         longitude: lng ? Number(lng) : null,
//       });
//       onClose();
//     } catch (e) {
//       console.error(e);
//       setErr(e?.response?.data?.message || "Action failed");
//     } finally {
//       setSaving(false);
//     }
//   };

//   return (
//     <Modal
//       open={open}
//       title={mode === "IN" ? "Punch In" : "Punch Out"}
//       subtitle="GPS optional (lat/lng)"
//       onClose={onClose}
//       footer={
//         <div className="att-modal-actions">
//           <button className="att-btn-secondary" type="button" onClick={onClose} disabled={saving}>
//             Cancel
//           </button>
//           <button className="att-btn-primary" type="button" onClick={submit} disabled={saving}>
//             {saving ? "Saving..." : "Confirm"}
//           </button>
//         </div>
//       }
//     >
//       {err ? <div className="att-alert-error">{err}</div> : null}

//       <div className="att-grid-2" style={{ marginTop: 12 }}>
//         <div>
//           <label className="att-label">Latitude</label>
//           <input
//             className="att-input"
//             value={lat}
//             onChange={(e) => setLat(e.target.value)}
//             placeholder="e.g. 23.8103"
//           />
//         </div>

//         <div>
//           <label className="att-label">Longitude</label>
//           <input
//             className="att-input"
//             value={lng}
//             onChange={(e) => setLng(e.target.value)}
//             placeholder="e.g. 90.4125"
//           />
//         </div>
//       </div>
//     </Modal>
//   );
// };

// const Attendance = () => {
//   const { user } = useContext(AuthContext);
//   const role = String(user?.role || "").toUpperCase();

//   const isField = role === "FIELD";
//   const isAdminManager = role === "ADMIN" || role === "MANAGER";

//   const [loading, setLoading] = useState(true);
//   const [rows, setRows] = useState([]);
//   const [error, setError] = useState("");

//   const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });


//   // Admin/Manager filters
//   const [fromDate, setFromDate] = useState(isoDate(new Date()));
//   const [toDate, setToDate] = useState(isoDate(new Date()));
//   const [userId, setUserId] = useState("");

//   // Users dropdown (admin/manager)
//   const [users, setUsers] = useState([]);

//   // punch modals
//   const [punchOpen, setPunchOpen] = useState(false);
//   const [punchMode, setPunchMode] = useState("IN"); // IN | OUT

//   const userMap = useMemo(() => {
//     const m = new Map();
//     (users || []).forEach((u) => m.set(String(u.id), u.name));
//     if (user?.id && user?.name) m.set(String(user.id), user.name);
//     return m;
//   }, [users, user]);

//   const fetchUsersDropdown = async () => {
//     // same dropdown you used in expense/order
//     const res = await api.get("/users/dropdown");
//     setUsers(res.data || []);
//   };

//   const fetchAttendance = async (page = 1, limit = pagination.limit) => {
//     setError("");
//     setLoading(true);

//     try {
//       if (isField) {
//         const res = await api.get("/attendance/today");
//         const data = res.data?.data ?? res.data;
//         const list = Array.isArray(data) ? data : data ? [data] : [];
//         setRows(list);

//         // keep a simple pagination model for UI consistency (optional)
//         setPagination({ page: 1, limit: 10, total: list.length, totalPages: 1 });
//       } else if (isAdminManager) {
//         const params = new URLSearchParams();
//         params.set("fromDate", fromDate);
//         params.set("toDate", toDate);
//         params.set("page", String(page));
//         params.set("limit", String(limit));
//         if (userId) params.set("userId", userId);

//         const res = await api.get(`/attendance/report?${params.toString()}`);

//         setRows(res.data?.data || []);
//         setPagination(res.data?.pagination || { page, limit, total: 0, totalPages: 1 });
//       } else {
//         setRows([]);
//       }
//     } catch (e) {
//       console.error(e);
//       setError(e?.response?.data?.message || "Failed to load attendance");
//       setRows([]);
//       setPagination({ page: 1, limit, total: 0, totalPages: 1 });
//     } finally {
//       setLoading(false);
//     }
//   };


//   useEffect(() => {
//     const init = async () => {
//       try {
//         setLoading(true);
//         if (isAdminManager) await fetchUsersDropdown();
//         await fetchAttendance(1, pagination.limit);
//       } finally {
//         setLoading(false);
//       }
//     };
//     init();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   const onSearch = async (e) => {
//     e.preventDefault();
//     await fetchAttendance(1, pagination.limit);
//   };

//   const doPunchIn = async ({ latitude, longitude }) => {
//     return api.post("/attendance/punch-in", {
//       latitude,
//       longitude,
//     });
//   };

//   const doPunchOut = async ({ latitude, longitude }) => {
//     return api.post("/attendance/punch-out", {
//       latitude,
//       longitude,
//     });
//   };

//   // Disable buttons based on today status (best-effort)
//   const todayRow = isField && rows.length ? rows[0] : null;
//   const hasIn = Boolean(todayRow?.punchIn || todayRow?.checkIn || todayRow?.inTime);
//   const hasOut = Boolean(todayRow?.punchOut || todayRow?.checkOut || todayRow?.outTime);

//   if (loading) return <Loader />;

//   return (
//     <div className="att-page">
//       <div className="att-header">
//         <div>
//           <h2 className="att-title">Attendance</h2>
//           <p className="att-subtitle">
//             {isField ? "Punch-in / punch-out for today" : "Attendance report"}
//           </p>
//         </div>

//         {isField ? (
//           <div className="att-top-actions">
//             <button
//               className="att-btn-secondary"
//               type="button"
//               onClick={() => {
//                 setPunchMode("IN");
//                 setPunchOpen(true);
//               }}
//               disabled={hasIn}
//               title={hasIn ? "Already punched in" : "Punch in"}
//             >
//               <FiLogIn style={{ marginRight: 8 }} />
//               Punch In
//             </button>

//             <button
//               className="att-btn-primary"
//               type="button"
//               onClick={() => {
//                 setPunchMode("OUT");
//                 setPunchOpen(true);
//               }}
//               disabled={!hasIn || hasOut}
//               title={!hasIn ? "Punch in first" : hasOut ? "Already punched out" : "Punch out"}
//             >
//               <FiLogOut style={{ marginRight: 8 }} />
//               Punch Out
//             </button>
//           </div>
//         ) : null}
//       </div>

//       {error ? <div className="att-alert-error">{error}</div> : null}

//       {/* Filters for Admin/Manager only */}
//       {isAdminManager ? (
//         <form className="att-card att-filters" onSubmit={onSearch}>
//           <div>
//             <label className="att-label">From</label>
//             <input
//               className="att-input"
//               type="date"
//               value={fromDate}
//               onChange={(e) => setFromDate(e.target.value)}
//             />
//           </div>

//           <div>
//             <label className="att-label">To</label>
//             <input
//               className="att-input"
//               type="date"
//               value={toDate}
//               onChange={(e) => setToDate(e.target.value)}
//             />
//           </div>

//           <div>
//             <label className="att-label">User</label>
//             <select className="att-input" value={userId} onChange={(e) => setUserId(e.target.value)}>
//               <option value="">All users</option>
//               {users.map((u) => (
//                 <option key={u.id} value={u.id}>
//                   {u.name}
//                 </option>
//               ))}
//             </select>
//           </div>

//           <button className="att-btn-secondary" type="submit">
//             <FiFilter style={{ marginRight: 8 }} />
//             Search
//           </button>
//         </form>
//       ) : null}

//       {/* Table */}
//       <div className="att-card">
//         <div className="att-table-wrap">
//           <table className="att-table">
//             <thead>
//               <tr>
//                 <th style={{ width: 70 }}>#</th>
//                 <th>Date</th>
//                 <th>User</th>
//                 <th>Punch In</th>
//                 <th>Punch Out</th>
//               </tr>
//             </thead>
//             <tbody>
//               {rows.length ? (
//                 rows.map((r, index) => {
//                   const uName = userMap.get(String(r.userId)) || r.user?.name || "-";
//                   const inTime = r.punchIn || r.checkIn || r.inTime;
//                   const outTime = r.punchOut || r.checkOut || r.outTime;
//                   const date = r.date || r.attendanceDate || r.createdAt;

//                   return (
//                     <tr key={r.id || `${r.userId}-${index}`}>
//                       <td>{(pagination.page - 1) * pagination.limit + index + 1}</td>
//                       <td>{formatDate(date)}</td>
//                       <td>{uName}</td>
//                       <td>{formatDT(inTime)}</td>
//                       <td>{formatDT(outTime)}</td>
//                     </tr>
//                   );
//                 })
//               ) : (
//                 <tr>
//                   <td colSpan={5} className="att-empty">
//                     No attendance found
//                   </td>
//                 </tr>
//               )}
//             </tbody>
//           </table>

//           {isAdminManager ? (
//             <Pagination
//               pagination={pagination}
//               onPageChange={(p) => fetchAttendance(p, pagination.limit)}
//               onLimitChange={(newLimit) => fetchAttendance(1, newLimit)}
//               limitOptions={[10, 20, 50]}
//             />
//           ) : null}
//         </div>
//       </div>

//       {/* Punch modal */}
//       <PunchModal
//         open={punchOpen}
//         mode={punchMode}
//         onClose={() => setPunchOpen(false)}
//         onConfirm={async (payload) => {
//           if (punchMode === "IN") await doPunchIn(payload);
//           else await doPunchOut(payload);

//           // refresh table after action
//           await fetchAttendance();
//         }}
//       />
//     </div>
//   );
// };

// export default Attendance;






// import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
// import api from "../../api/api";
// import Loader from "../../components/Common/Loader";
// import "./attendance.css";

// import { FiLogIn, FiLogOut, FiX, FiFilter, FiMapPin, FiRefreshCw, FiPause, FiExternalLink } from "react-icons/fi";
// import { AuthContext } from "../../context/AuthContext";
// import Pagination from "../../components/Common/Pagination";

// const isoDate = (d) => {
//   const x = new Date(d);
//   const yyyy = x.getFullYear();
//   const mm = String(x.getMonth() + 1).padStart(2, "0");
//   const dd = String(x.getDate()).padStart(2, "0");
//   return `${yyyy}-${mm}-${dd}`;
// };

// const formatDate = (v) => (v ? String(v).slice(0, 10) : "-");
// const formatDT = (v) => (v ? String(v).slice(0, 19).replace("T", " ") : "-");

// const safeNum = (v) => {
//   const n = Number(v);
//   return Number.isFinite(n) ? n : null;
// };

// // FREE reverse geocode (OpenStreetMap Nominatim)
// const reverseGeocodeOSM = async ({ lat, lng }) => {
//   const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;
//   const res = await fetch(url, { headers: { Accept: "application/json" } });
//   const json = await res.json();

//   const a = json?.address || {};
//   const parts = [
//     a.road,
//     a.neighbourhood,
//     a.suburb,
//     a.city || a.town || a.village,
//     a.state,
//   ].filter(Boolean);

//   const short = parts.slice(0, 3).join(", ");
//   const full = json?.display_name || short || "";
//   return { short, full };
// };

// // OSM embed URL (free) for a small bounding box around the marker
// const getOsmEmbedUrl = (lat, lng) => {
//   const delta = 0.005; // ~ small area (adjust if you want more zoomed out)
//   const left = lng - delta;
//   const right = lng + delta;
//   const bottom = lat - delta;
//   const top = lat + delta;

//   const bbox = `${left},${bottom},${right},${top}`;
//   // note: marker=lat,lng
//   return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${lat},${lng}`;
// };

// const getOsmOpenUrl = (lat, lng) => {
//   // opens full map with marker
//   return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=18/${lat}/${lng}`;
// };

// const Modal = ({ open, title, subtitle, onClose, children, footer }) => {
//   if (!open) return null;
//   return (
//     <div className="att-modal-overlay" onMouseDown={onClose}>
//       <div className="att-modal" onMouseDown={(e) => e.stopPropagation()}>
//         <div className="att-modal-header">
//           <div>
//             <div className="att-modal-title">{title}</div>
//             {subtitle ? <div className="att-modal-subtitle">{subtitle}</div> : null}
//           </div>
//           <button className="att-icon-btn" type="button" onClick={onClose} title="Close">
//             <FiX size={18} />
//           </button>
//         </div>

//         <div className="att-modal-body">{children}</div>

//         {footer ? <div className="att-modal-footer">{footer}</div> : null}
//       </div>
//     </div>
//   );
// };

// const PunchModal = ({ open, mode, onClose, onConfirm }) => {
//   const [lat, setLat] = useState("");
//   const [lng, setLng] = useState("");
//   const [accuracy, setAccuracy] = useState(null);

//   const [place, setPlace] = useState("");
//   const [placeFull, setPlaceFull] = useState("");
//   const [placeLoading, setPlaceLoading] = useState(false);

//   const [status, setStatus] = useState("idle"); // idle | locating | live | stopped
//   const [saving, setSaving] = useState(false);
//   const [err, setErr] = useState("");

//   const watchIdRef = useRef(null);

//   // throttle reverse geocode
//   const lastGeoRef = useRef({ key: "", ts: 0 });

//   const stopWatch = () => {
//     if (watchIdRef.current != null && navigator.geolocation?.clearWatch) {
//       navigator.geolocation.clearWatch(watchIdRef.current);
//     }
//     watchIdRef.current = null;
//     setStatus("stopped");
//   };

//   const tryReverseGeocode = async (la, ln) => {
//     const key = `${la.toFixed(5)},${ln.toFixed(5)}`;
//     const now = Date.now();
//     const should = lastGeoRef.current.key !== key || now - lastGeoRef.current.ts > 15_000;
//     if (!should) return;

//     lastGeoRef.current = { key, ts: now };
//     setPlaceLoading(true);

//     try {
//       const r = await reverseGeocodeOSM({ lat: la, lng: ln });
//       setPlace(r.short || "");
//       setPlaceFull(r.full || r.short || "");
//     } catch (e) {
//       console.error(e);
//     } finally {
//       setPlaceLoading(false);
//     }
//   };

//   const startLiveLocation = () => {
//     setErr("");

//     if (!navigator.geolocation) {
//       setErr("Geolocation not supported on this device/browser.");
//       setStatus("stopped");
//       return;
//     }

//     setStatus("locating");

//     // clear old watcher if any
//     stopWatch();
//     setStatus("locating");

//     watchIdRef.current = navigator.geolocation.watchPosition(
//       (pos) => {
//         const la = pos?.coords?.latitude;
//         const ln = pos?.coords?.longitude;
//         const acc = pos?.coords?.accuracy;

//         if (Number.isFinite(la) && Number.isFinite(ln)) {
//           setLat(String(la));
//           setLng(String(ln));
//           setAccuracy(Number.isFinite(acc) ? acc : null);
//           setStatus("live");

//           tryReverseGeocode(la, ln);
//         }
//       },
//       (e) => {
//         console.error(e);
//         const msg =
//           e?.code === 1
//             ? "Location permission denied. Please allow location access."
//             : e?.code === 2
//             ? "Location unavailable. Try turning on GPS."
//             : "Location request timed out. Tap Refresh.";
//         setErr(msg);
//         setStatus("stopped");
//       },
//       {
//         enableHighAccuracy: true,
//         timeout: 15000,
//         maximumAge: 0,
//       }
//     );
//   };

//   useEffect(() => {
//     if (!open) return;

//     setLat("");
//     setLng("");
//     setAccuracy(null);

//     setPlace("");
//     setPlaceFull("");
//     setPlaceLoading(false);

//     setSaving(false);
//     setErr("");
//     setStatus("idle");
//     lastGeoRef.current = { key: "", ts: 0 };

//     startLiveLocation();

//     return () => {
//       if (watchIdRef.current != null && navigator.geolocation?.clearWatch) {
//         navigator.geolocation.clearWatch(watchIdRef.current);
//       }
//       watchIdRef.current = null;
//     };
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [open]);

//   const submit = async () => {
//     setErr("");
//     try {
//       setSaving(true);

//       const la = safeNum(lat);
//       const ln = safeNum(lng);

//       if (la == null || ln == null) {
//         setErr("Location not ready yet. Please wait or tap Refresh.");
//         return;
//       }

//       await onConfirm({
//         latitude: la,
//         longitude: ln,
//         address: placeFull || place || "", // optional
//       });

//       stopWatch();
//       onClose();
//     } catch (e) {
//       console.error(e);
//       setErr(e?.response?.data?.message || "Action failed");
//     } finally {
//       setSaving(false);
//     }
//   };

//   const laNum = safeNum(lat);
//   const lnNum = safeNum(lng);

//   const badge =
//     status === "locating" ? "Locating…" : status === "live" ? "Live" : status === "stopped" ? "Stopped" : "Idle";

//   return (
//     <Modal
//       open={open}
//       title={mode === "IN" ? "Punch In" : "Punch Out"}
//       subtitle="Live location will be captured automatically"
//       onClose={() => {
//         stopWatch();
//         onClose();
//       }}
//       footer={
//         <div className="att-modal-actions">
//           <button
//             className="att-btn-secondary"
//             type="button"
//             onClick={() => {
//               stopWatch();
//               onClose();
//             }}
//             disabled={saving}
//           >
//             Cancel
//           </button>

//           <button className="att-btn-secondary" type="button" onClick={startLiveLocation} disabled={saving}>
//             <FiRefreshCw style={{ marginRight: 8 }} />
//             Refresh
//           </button>

//           <button className="att-btn-secondary" type="button" onClick={stopWatch} disabled={saving}>
//             <FiPause style={{ marginRight: 8 }} />
//             Stop
//           </button>

//           <button className="att-btn-primary" type="button" onClick={submit} disabled={saving}>
//             {saving ? "Saving..." : "Confirm"}
//           </button>
//         </div>
//       }
//     >
//       {err ? <div className="att-alert-error">{err}</div> : null}

//       <div className="att-loc-card">
//         <div className="att-loc-head">
//           <div className="att-loc-title">
//             <FiMapPin style={{ marginRight: 8 }} />
//             Live Location
//           </div>

//           <div className="att-loc-meta">
//             <span className={`att-badge ${status === "live" ? "ok" : ""}`}>{badge}</span>
//             {accuracy != null ? <span className="att-badge">± {Math.round(accuracy)} m</span> : null}
//           </div>
//         </div>

//         <div className="att-grid-2" style={{ marginTop: 12 }}>
//           <div>
//             <label className="att-label">Latitude</label>
//             <input className="att-input" value={lat} readOnly placeholder="Getting latitude..." />
//           </div>

//           <div>
//             <label className="att-label">Longitude</label>
//             <input className="att-input" value={lng} readOnly placeholder="Getting longitude..." />
//           </div>

//           <div style={{ gridColumn: "1 / -1" }}>
//             <label className="att-label">
//               Area / Road {placeLoading ? <span style={{ opacity: 0.6 }}>(detecting…)</span> : null}
//             </label>
//             <input
//               className="att-input"
//               value={place || ""}
//               readOnly
//               placeholder="Detecting area/road name..."
//               title={placeFull || ""}
//             />
//           </div>

//           {/* Map Preview (FREE - OpenStreetMap iframe) */}
//           <div style={{ gridColumn: "1 / -1" }}>
//             <div className="att-map-head">
//               <div className="att-map-title">Map Preview</div>

//               {laNum != null && lnNum != null ? (
//                 <button
//                   type="button"
//                   className="att-btn-secondary"
//                   onClick={() => window.open(getOsmOpenUrl(laNum, lnNum), "_blank", "noopener,noreferrer")}
//                   title="Open in OpenStreetMap"
//                 >
//                   <FiExternalLink style={{ marginRight: 8 }} />
//                   Open
//                 </button>
//               ) : null}
//             </div>

//             <div className="att-map-wrap">
//               {laNum != null && lnNum != null ? (
//                 <iframe
//                   className="att-map-iframe"
//                   title="map"
//                   src={getOsmEmbedUrl(laNum, lnNum)}
//                   loading="lazy"
//                 />
//               ) : (
//                 <div className="att-map-skeleton">Waiting for coordinates…</div>
//               )}
//             </div>
//           </div>

//           <div style={{ gridColumn: "1 / -1" }} className="att-hint">
//             Tip: If it doesn’t update, turn on GPS/location on your device and tap <b>Refresh</b>. Production should be
//             served on <b>HTTPS</b>.
//           </div>
//         </div>
//       </div>
//     </Modal>
//   );
// };

// const Attendance = () => {
//   const { user } = useContext(AuthContext);
//   const role = String(user?.role || "").toUpperCase();

//   const isField = role === "FIELD";
//   const isAdminManager = role === "ADMIN" || role === "MANAGER";

//   const [loading, setLoading] = useState(true);
//   const [rows, setRows] = useState([]);
//   const [error, setError] = useState("");

//   const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

//   // Admin/Manager filters
//   const [fromDate, setFromDate] = useState(isoDate(new Date()));
//   const [toDate, setToDate] = useState(isoDate(new Date()));
//   const [userId, setUserId] = useState("");

//   // Users dropdown (admin/manager)
//   const [users, setUsers] = useState([]);

//   // punch modals
//   const [punchOpen, setPunchOpen] = useState(false);
//   const [punchMode, setPunchMode] = useState("IN"); // IN | OUT

//   const userMap = useMemo(() => {
//     const m = new Map();
//     (users || []).forEach((u) => m.set(String(u.id), u.name));
//     if (user?.id && user?.name) m.set(String(user.id), user.name);
//     return m;
//   }, [users, user]);

//   const fetchUsersDropdown = async () => {
//     const res = await api.get("/users/dropdown");
//     setUsers(res.data || []);
//   };

//   const fetchAttendance = async (page = 1, limit = pagination.limit) => {
//     setError("");
//     setLoading(true);

//     try {
//       if (isField) {
//         const res = await api.get("/attendance/today");
//         const data = res.data?.data ?? res.data;
//         const list = Array.isArray(data) ? data : data ? [data] : [];
//         setRows(list);
//         setPagination({ page: 1, limit: 10, total: list.length, totalPages: 1 });
//       } else if (isAdminManager) {
//         const params = new URLSearchParams();
//         params.set("fromDate", fromDate);
//         params.set("toDate", toDate);
//         params.set("page", String(page));
//         params.set("limit", String(limit));
//         if (userId) params.set("userId", userId);

//         const res = await api.get(`/attendance/report?${params.toString()}`);

//         setRows(res.data?.data || []);
//         setPagination(res.data?.pagination || { page, limit, total: 0, totalPages: 1 });
//       } else {
//         setRows([]);
//       }
//     } catch (e) {
//       console.error(e);
//       setError(e?.response?.data?.message || "Failed to load attendance");
//       setRows([]);
//       setPagination({ page: 1, limit, total: 0, totalPages: 1 });
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     const init = async () => {
//       try {
//         setLoading(true);
//         if (isAdminManager) await fetchUsersDropdown();
//         await fetchAttendance(1, pagination.limit);
//       } finally {
//         setLoading(false);
//       }
//     };
//     init();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   const onSearch = async (e) => {
//     e.preventDefault();
//     await fetchAttendance(1, pagination.limit);
//   };

//   const doPunchIn = async ({ latitude, longitude, address }) => {
//     return api.post("/attendance/punch-in", { latitude, longitude, address });
//   };

//   const doPunchOut = async ({ latitude, longitude, address }) => {
//     return api.post("/attendance/punch-out", { latitude, longitude, address });
//   };

//   const todayRow = isField && rows.length ? rows[0] : null;
//   const hasIn = Boolean(todayRow?.punchIn || todayRow?.checkIn || todayRow?.inTime);
//   const hasOut = Boolean(todayRow?.punchOut || todayRow?.checkOut || todayRow?.outTime);

//   if (loading) return <Loader />;

//   return (
//     <div className="att-page">
//       <div className="att-header">
//         <div>
//           <h2 className="att-title">Attendance</h2>
//           <p className="att-subtitle">{isField ? "Punch-in / punch-out for today" : "Attendance report"}</p>
//         </div>

//         {isField ? (
//           <div className="att-top-actions">
//             <button
//               className="att-btn-secondary"
//               type="button"
//               onClick={() => {
//                 setPunchMode("IN");
//                 setPunchOpen(true);
//               }}
//               disabled={hasIn}
//               title={hasIn ? "Already punched in" : "Punch in"}
//             >
//               <FiLogIn style={{ marginRight: 8 }} />
//               Punch In
//             </button>

//             <button
//               className="att-btn-primary"
//               type="button"
//               onClick={() => {
//                 setPunchMode("OUT");
//                 setPunchOpen(true);
//               }}
//               disabled={!hasIn || hasOut}
//               title={!hasIn ? "Punch in first" : hasOut ? "Already punched out" : "Punch out"}
//             >
//               <FiLogOut style={{ marginRight: 8 }} />
//               Punch Out
//             </button>
//           </div>
//         ) : null}
//       </div>

//       {error ? <div className="att-alert-error">{error}</div> : null}

//       {isAdminManager ? (
//         <form className="att-card att-filters" onSubmit={onSearch}>
//           <div>
//             <label className="att-label">From</label>
//             <input className="att-input" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
//           </div>

//           <div>
//             <label className="att-label">To</label>
//             <input className="att-input" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
//           </div>

//           <div>
//             <label className="att-label">User</label>
//             <select className="att-input" value={userId} onChange={(e) => setUserId(e.target.value)}>
//               <option value="">All users</option>
//               {users.map((u) => (
//                 <option key={u.id} value={u.id}>
//                   {u.name}
//                 </option>
//               ))}
//             </select>
//           </div>

//           <button className="att-btn-secondary" type="submit">
//             <FiFilter style={{ marginRight: 8 }} />
//             Search
//           </button>
//         </form>
//       ) : null}

//       <div className="att-card">
//         <div className="att-table-wrap">
//           <table className="att-table">
//             <thead>
//               <tr>
//                 <th style={{ width: 70 }}>#</th>
//                 <th>Date</th>
//                 <th>User</th>
//                 <th>Punch In</th>
//                 <th>Punch Out</th>
//               </tr>
//             </thead>
//             <tbody>
//               {rows.length ? (
//                 rows.map((r, index) => {
//                   const uName = userMap.get(String(r.userId)) || r.user?.name || "-";
//                   const inTime = r.punchIn || r.checkIn || r.inTime;
//                   const outTime = r.punchOut || r.checkOut || r.outTime;
//                   const date = r.date || r.attendanceDate || r.createdAt;

//                   return (
//                     <tr key={r.id || `${r.userId}-${index}`}>
//                       <td>{(pagination.page - 1) * pagination.limit + index + 1}</td>
//                       <td>{formatDate(date)}</td>
//                       <td>{uName}</td>
//                       <td>{formatDT(inTime)}</td>
//                       <td>{formatDT(outTime)}</td>
//                     </tr>
//                   );
//                 })
//               ) : (
//                 <tr>
//                   <td colSpan={5} className="att-empty">
//                     No attendance found
//                   </td>
//                 </tr>
//               )}
//             </tbody>
//           </table>

//           {isAdminManager ? (
//             <Pagination
//               pagination={pagination}
//               onPageChange={(p) => fetchAttendance(p, pagination.limit)}
//               onLimitChange={(newLimit) => fetchAttendance(1, newLimit)}
//               limitOptions={[10, 20, 50]}
//             />
//           ) : null}
//         </div>
//       </div>

//       <PunchModal
//         open={punchOpen}
//         mode={punchMode}
//         onClose={() => setPunchOpen(false)}
//         onConfirm={async (payload) => {
//           if (punchMode === "IN") await doPunchIn(payload);
//           else await doPunchOut(payload);
//           await fetchAttendance();
//         }}
//       />
//     </div>
//   );
// };

// export default Attendance;











// import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
// import api from "../../api/api";
// import Loader from "../../components/Common/Loader";
// import "./attendance.css";

// import {
//   FiLogIn,
//   FiLogOut,
//   FiX,
//   FiFilter,
//   FiMapPin,
//   FiRefreshCw,
//   FiPause,
//   FiExternalLink,
//   FiEye,
// } from "react-icons/fi";
// import { AuthContext } from "../../context/AuthContext";
// import Pagination from "../../components/Common/Pagination";

// const isoDate = (d) => {
//   const x = new Date(d);
//   const yyyy = x.getFullYear();
//   const mm = String(x.getMonth() + 1).padStart(2, "0");
//   const dd = String(x.getDate()).padStart(2, "0");
//   return `${yyyy}-${mm}-${dd}`;
// };

// const formatDate = (v) => (v ? String(v).slice(0, 10) : "-");
// const formatDT = (v) => (v ? String(v).slice(0, 19).replace("T", " ") : "-");

// const safeNum = (v) => {
//   const n = Number(v);
//   return Number.isFinite(n) ? n : null;
// };

// // FREE reverse geocode (OpenStreetMap Nominatim)
// const reverseGeocodeOSM = async ({ lat, lng }) => {
//   const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;
//   const res = await fetch(url, { headers: { Accept: "application/json" } });
//   const json = await res.json();

//   const a = json?.address || {};
//   const parts = [a.road, a.neighbourhood, a.suburb, a.city || a.town || a.village, a.state].filter(Boolean);

//   const short = parts.slice(0, 3).join(", ");
//   const full = json?.display_name || short || "";
//   return { short, full };
// };

// // OSM embed URL (free) for a small bounding box around the marker
// const getOsmEmbedUrl = (lat, lng) => {
//   const delta = 0.005;
//   const left = lng - delta;
//   const right = lng + delta;
//   const bottom = lat - delta;
//   const top = lat + delta;

//   const bbox = `${left},${bottom},${right},${top}`;
//   return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${lat},${lng}`;
// };

// const getOsmOpenUrl = (lat, lng) => {
//   return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=18/${lat}/${lng}`;
// };

// const Modal = ({ open, title, subtitle, onClose, children, footer }) => {
//   if (!open) return null;
//   return (
//     <div className="att-modal-overlay" onMouseDown={onClose}>
//       <div className="att-modal" onMouseDown={(e) => e.stopPropagation()}>
//         <div className="att-modal-header">
//           <div>
//             <div className="att-modal-title">{title}</div>
//             {subtitle ? <div className="att-modal-subtitle">{subtitle}</div> : null}
//           </div>
//           <button className="att-icon-btn" type="button" onClick={onClose} title="Close">
//             <FiX size={18} />
//           </button>
//         </div>

//         <div className="att-modal-body">{children}</div>

//         {footer ? <div className="att-modal-footer">{footer}</div> : null}
//       </div>
//     </div>
//   );
// };

// const PreviewModal = ({ open, row, userName, onClose }) => {
//   if (!open || !row) return null;

//   const inLat = safeNum(row.lat);
//   const inLng = safeNum(row.lng);
//   const outLat = safeNum(row.outLat);
//   const outLng = safeNum(row.outLng);

//   const inTime = row.punchIn || row.checkIn || row.inTime;
//   const outTime = row.punchOut || row.checkOut || row.outTime;

//   const date = row.date || row.attendanceDate || row.createdAt;

//   return (
//     <Modal
//       open={open}
//       title="Attendance Preview"
//       subtitle="Punch in/out time + location"
//       onClose={onClose}
//       footer={
//         <div className="att-modal-actions">
//           <button className="att-btn-secondary" type="button" onClick={onClose}>
//             Close
//           </button>
//         </div>
//       }
//     >
//       <div className="att-preview-grid">
//         <div className="att-preview-card">
//           <div className="att-preview-title">User</div>
//           <div className="att-preview-value">
//             <b>{userName || "-"}</b>
//           </div>
//           <div className="att-preview-muted">User ID: {row.userId || "-"}</div>
//           <div className="att-preview-muted">Date: {formatDate(date)}</div>
//         </div>

//         <div className="att-preview-card">
//           <div className="att-preview-title">Punch In</div>
//           <div className="att-preview-muted">Time: {formatDT(inTime)}</div>
//           <div className="att-preview-muted">
//             Lat/Lng: {inLat != null ? inLat : "-"}, {inLng != null ? inLng : "-"}
//           </div>

//           <div className="att-map-head" style={{ marginTop: 10 }}>
//             <div className="att-map-title">Punch In Map</div>
//             {inLat != null && inLng != null ? (
//               <button
//                 type="button"
//                 className="att-btn-secondary"
//                 onClick={() => window.open(getOsmOpenUrl(inLat, inLng), "_blank", "noopener,noreferrer")}
//               >
//                 <FiExternalLink style={{ marginRight: 8 }} />
//                 Open
//               </button>
//             ) : null}
//           </div>

//           <div className="att-map-wrap">
//             {inLat != null && inLng != null ? (
//               <iframe className="att-map-iframe" title="punch-in-map" src={getOsmEmbedUrl(inLat, inLng)} loading="lazy" />
//             ) : (
//               <div className="att-map-skeleton">No punch-in location saved</div>
//             )}
//           </div>
//         </div>

//         <div className="att-preview-card">
//           <div className="att-preview-title">Punch Out</div>
//           <div className="att-preview-muted">Time: {formatDT(outTime)}</div>
//           <div className="att-preview-muted">
//             Lat/Lng: {outLat != null ? outLat : "-"}, {outLng != null ? outLng : "-"}
//           </div>

//           <div className="att-map-head" style={{ marginTop: 10 }}>
//             <div className="att-map-title">Punch Out Map</div>
//             {outLat != null && outLng != null ? (
//               <button
//                 type="button"
//                 className="att-btn-secondary"
//                 onClick={() => window.open(getOsmOpenUrl(outLat, outLng), "_blank", "noopener,noreferrer")}
//               >
//                 <FiExternalLink style={{ marginRight: 8 }} />
//                 Open
//               </button>
//             ) : null}
//           </div>

//           <div className="att-map-wrap">
//             {outLat != null && outLng != null ? (
//               <iframe className="att-map-iframe" title="punch-out-map" src={getOsmEmbedUrl(outLat, outLng)} loading="lazy" />
//             ) : (
//               <div className="att-map-skeleton">No punch-out location saved</div>
//             )}
//           </div>
//         </div>
//       </div>
//     </Modal>
//   );
// };

// const PunchModal = ({ open, mode, onClose, onConfirm }) => {
//   const [lat, setLat] = useState("");
//   const [lng, setLng] = useState("");
//   const [accuracy, setAccuracy] = useState(null);

//   const [place, setPlace] = useState("");
//   const [placeFull, setPlaceFull] = useState("");
//   const [placeLoading, setPlaceLoading] = useState(false);

//   const [status, setStatus] = useState("idle");
//   const [saving, setSaving] = useState(false);
//   const [err, setErr] = useState("");

//   const watchIdRef = useRef(null);
//   const lastGeoRef = useRef({ key: "", ts: 0 });

//   const stopWatch = () => {
//     if (watchIdRef.current != null && navigator.geolocation?.clearWatch) {
//       navigator.geolocation.clearWatch(watchIdRef.current);
//     }
//     watchIdRef.current = null;
//     setStatus("stopped");
//   };

//   const tryReverseGeocode = async (la, ln) => {
//     const key = `${la.toFixed(5)},${ln.toFixed(5)}`;
//     const now = Date.now();
//     const should = lastGeoRef.current.key !== key || now - lastGeoRef.current.ts > 15_000;
//     if (!should) return;

//     lastGeoRef.current = { key, ts: now };
//     setPlaceLoading(true);

//     try {
//       const r = await reverseGeocodeOSM({ lat: la, lng: ln });
//       setPlace(r.short || "");
//       setPlaceFull(r.full || r.short || "");
//     } catch (e) {
//       console.error(e);
//     } finally {
//       setPlaceLoading(false);
//     }
//   };

//   const startLiveLocation = () => {
//     setErr("");

//     if (!navigator.geolocation) {
//       setErr("Geolocation not supported on this device/browser.");
//       setStatus("stopped");
//       return;
//     }

//     setStatus("locating");
//     stopWatch();
//     setStatus("locating");

//     watchIdRef.current = navigator.geolocation.watchPosition(
//       (pos) => {
//         const la = pos?.coords?.latitude;
//         const ln = pos?.coords?.longitude;
//         const acc = pos?.coords?.accuracy;

//         if (Number.isFinite(la) && Number.isFinite(ln)) {
//           setLat(String(la));
//           setLng(String(ln));
//           setAccuracy(Number.isFinite(acc) ? acc : null);
//           setStatus("live");
//           tryReverseGeocode(la, ln);
//         }
//       },
//       (e) => {
//         console.error(e);
//         const msg =
//           e?.code === 1
//             ? "Location permission denied. Please allow location access."
//             : e?.code === 2
//             ? "Location unavailable. Try turning on GPS."
//             : "Location request timed out. Tap Refresh.";
//         setErr(msg);
//         setStatus("stopped");
//       },
//       { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
//     );
//   };

//   useEffect(() => {
//     if (!open) return;

//     setLat("");
//     setLng("");
//     setAccuracy(null);

//     setPlace("");
//     setPlaceFull("");
//     setPlaceLoading(false);

//     setSaving(false);
//     setErr("");
//     setStatus("idle");
//     lastGeoRef.current = { key: "", ts: 0 };

//     startLiveLocation();

//     return () => {
//       if (watchIdRef.current != null && navigator.geolocation?.clearWatch) {
//         navigator.geolocation.clearWatch(watchIdRef.current);
//       }
//       watchIdRef.current = null;
//     };
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [open]);

//   const submit = async () => {
//     setErr("");
//     try {
//       setSaving(true);

//       const la = safeNum(lat);
//       const ln = safeNum(lng);

//       if (la == null || ln == null) {
//         setErr("Location not ready yet. Please wait or tap Refresh.");
//         return;
//       }

//       await onConfirm({
//         latitude: la,
//         longitude: ln,
//       });

//       stopWatch();
//       onClose();
//     } catch (e) {
//       console.error(e);
//       setErr(e?.response?.data?.message || "Action failed");
//     } finally {
//       setSaving(false);
//     }
//   };

//   const laNum = safeNum(lat);
//   const lnNum = safeNum(lng);

//   const badge = status === "locating" ? "Locating…" : status === "live" ? "Live" : status === "stopped" ? "Stopped" : "Idle";

//   return (
//     <Modal
//       open={open}
//       title={mode === "IN" ? "Punch In" : "Punch Out"}
//       subtitle="Live location will be captured automatically"
//       onClose={() => { stopWatch(); onClose(); }}
//       footer={
//         <div className="att-modal-actions">
//           <button className="att-btn-secondary" type="button" onClick={() => { stopWatch(); onClose(); }} disabled={saving}>
//             Cancel
//           </button>

//           <button className="att-btn-secondary" type="button" onClick={startLiveLocation} disabled={saving}>
//             <FiRefreshCw style={{ marginRight: 8 }} />
//             Refresh
//           </button>

//           <button className="att-btn-secondary" type="button" onClick={stopWatch} disabled={saving}>
//             <FiPause style={{ marginRight: 8 }} />
//             Stop
//           </button>

//           <button className="att-btn-primary" type="button" onClick={submit} disabled={saving}>
//             {saving ? "Saving..." : "Confirm"}
//           </button>
//         </div>
//       }
//     >
//       {err ? <div className="att-alert-error">{err}</div> : null}

//       <div className="att-loc-card">
//         <div className="att-loc-head">
//           <div className="att-loc-title">
//             <FiMapPin style={{ marginRight: 8 }} />
//             Live Location
//           </div>

//           <div className="att-loc-meta">
//             <span className={`att-badge ${status === "live" ? "ok" : ""}`}>{badge}</span>
//             {accuracy != null ? <span className="att-badge">± {Math.round(accuracy)} m</span> : null}
//           </div>
//         </div>

//         <div className="att-grid-2" style={{ marginTop: 12 }}>
//           <div>
//             <label className="att-label">Latitude</label>
//             <input className="att-input" value={lat} readOnly placeholder="Getting latitude..." />
//           </div>

//           <div>
//             <label className="att-label">Longitude</label>
//             <input className="att-input" value={lng} readOnly placeholder="Getting longitude..." />
//           </div>

//           <div style={{ gridColumn: "1 / -1" }}>
//             <label className="att-label">
//               Area / Road {placeLoading ? <span style={{ opacity: 0.6 }}>(detecting…)</span> : null}
//             </label>
//             <input className="att-input" value={place || ""} readOnly placeholder="Detecting area/road name..." title={placeFull || ""} />
//           </div>

//           <div style={{ gridColumn: "1 / -1" }}>
//             <div className="att-map-head">
//               <div className="att-map-title">Map Preview</div>

//               {laNum != null && lnNum != null ? (
//                 <button
//                   type="button"
//                   className="att-btn-secondary"
//                   onClick={() => window.open(getOsmOpenUrl(laNum, lnNum), "_blank", "noopener,noreferrer")}
//                   title="Open in OpenStreetMap"
//                 >
//                   <FiExternalLink style={{ marginRight: 8 }} />
//                   Open
//                 </button>
//               ) : null}
//             </div>

//             <div className="att-map-wrap">
//               {laNum != null && lnNum != null ? (
//                 <iframe className="att-map-iframe" title="map" src={getOsmEmbedUrl(laNum, lnNum)} loading="lazy" />
//               ) : (
//                 <div className="att-map-skeleton">Waiting for coordinates…</div>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>
//     </Modal>
//   );
// };

// const Attendance = () => {
//   const { user } = useContext(AuthContext);
//   const role = String(user?.role || "").toUpperCase();

//   const isField = role === "FIELD";
//   const isAdminManager = role === "ADMIN" || role === "MANAGER";

//   const [loading, setLoading] = useState(true);
//   const [rows, setRows] = useState([]);
//   const [error, setError] = useState("");

//   const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

//   const [fromDate, setFromDate] = useState(isoDate(new Date()));
//   const [toDate, setToDate] = useState(isoDate(new Date()));
//   const [userId, setUserId] = useState("");

//   const [users, setUsers] = useState([]);

//   const [punchOpen, setPunchOpen] = useState(false);
//   const [punchMode, setPunchMode] = useState("IN");

//   const [previewOpen, setPreviewOpen] = useState(false);
//   const [previewRow, setPreviewRow] = useState(null);

//   const userMap = useMemo(() => {
//     const m = new Map();
//     (users || []).forEach((u) => m.set(String(u.id), u.name));
//     if (user?.id && user?.name) m.set(String(user.id), user.name);
//     return m;
//   }, [users, user]);

//   const fetchUsersDropdown = async () => {
//     const res = await api.get("/users/dropdown");
//     setUsers(res.data || []);
//   };

//   const fetchAttendance = async (page = 1, limit = pagination.limit) => {
//     setError("");
//     setLoading(true);

//     try {
//       if (isField) {
//         const res = await api.get("/attendance/today");
//         const data = res.data?.data ?? res.data;
//         const list = Array.isArray(data) ? data : data ? [data] : [];
//         setRows(list);
//         setPagination({ page: 1, limit: 10, total: list.length, totalPages: 1 });
//       } else if (isAdminManager) {
//         const params = new URLSearchParams();
//         params.set("fromDate", fromDate);
//         params.set("toDate", toDate);
//         params.set("page", String(page));
//         params.set("limit", String(limit));
//         if (userId) params.set("userId", userId);

//         const res = await api.get(`/attendance/report?${params.toString()}`);
//         setRows(res.data?.data || []);
//         setPagination(res.data?.pagination || { page, limit, total: 0, totalPages: 1 });
//       } else {
//         setRows([]);
//       }
//     } catch (e) {
//       console.error(e);
//       setError(e?.response?.data?.message || "Failed to load attendance");
//       setRows([]);
//       setPagination({ page: 1, limit, total: 0, totalPages: 1 });
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     const init = async () => {
//       try {
//         setLoading(true);
//         if (isAdminManager) await fetchUsersDropdown();
//         await fetchAttendance(1, pagination.limit);
//       } finally {
//         setLoading(false);
//       }
//     };
//     init();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   const onSearch = async (e) => {
//     e.preventDefault();
//     await fetchAttendance(1, pagination.limit);
//   };

//   const doPunchIn = async ({ latitude, longitude }) => {
//     return api.post("/attendance/punch-in", { latitude, longitude });
//   };

//   const doPunchOut = async ({ latitude, longitude }) => {
//     return api.post("/attendance/punch-out", { latitude, longitude });
//   };

//   const todayRow = isField && rows.length ? rows[0] : null;
//   const hasIn = Boolean(todayRow?.punchIn || todayRow?.checkIn || todayRow?.inTime);
//   const hasOut = Boolean(todayRow?.punchOut || todayRow?.checkOut || todayRow?.outTime);

//   if (loading) return <Loader />;

//   return (
//     <div className="att-page">
//       <div className="att-header">
//         <div>
//           <h2 className="att-title">Attendance</h2>
//           <p className="att-subtitle">{isField ? "Punch-in / punch-out for today" : "Attendance report"}</p>
//         </div>

//         {isField ? (
//           <div className="att-top-actions">
//             <button className="att-btn-secondary" type="button" onClick={() => { setPunchMode("IN"); setPunchOpen(true); }} disabled={hasIn}>
//               <FiLogIn style={{ marginRight: 8 }} />
//               Punch In
//             </button>

//             <button className="att-btn-primary" type="button" onClick={() => { setPunchMode("OUT"); setPunchOpen(true); }} disabled={!hasIn || hasOut}>
//               <FiLogOut style={{ marginRight: 8 }} />
//               Punch Out
//             </button>
//           </div>
//         ) : null}
//       </div>

//       {error ? <div className="att-alert-error">{error}</div> : null}

//       {isAdminManager ? (
//         <form className="att-card att-filters" onSubmit={onSearch}>
//           <div>
//             <label className="att-label">From</label>
//             <input className="att-input" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
//           </div>

//           <div>
//             <label className="att-label">To</label>
//             <input className="att-input" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
//           </div>

//           <div>
//             <label className="att-label">User</label>
//             <select className="att-input" value={userId} onChange={(e) => setUserId(e.target.value)}>
//               <option value="">All users</option>
//               {users.map((u) => (
//                 <option key={u.id} value={u.id}>
//                   {u.name}
//                 </option>
//               ))}
//             </select>
//           </div>

//           <button className="att-btn-secondary" type="submit">
//             <FiFilter style={{ marginRight: 8 }} />
//             Search
//           </button>
//         </form>
//       ) : null}

//       <div className="att-card">
//         <div className="att-table-wrap">
//           <table className="att-table">
//             <thead>
//               <tr>
//                 <th style={{ width: 70 }}>#</th>
//                 <th>Date</th>
//                 <th>User</th>
//                 {isAdminManager ? <th>User ID</th> : null}
//                 <th>Punch In</th>
//                 <th>Punch Out</th>
//                 {isAdminManager ? <th style={{ width: 90 }}>View</th> : null}
//               </tr>
//             </thead>
//             <tbody>
//               {rows.length ? (
//                 rows.map((r, index) => {
//                   const uName = userMap.get(String(r.userId)) || "-";
//                   const inTime = r.punchIn;
//                   const outTime = r.punchOut;
//                   const date = r.date;

//                   return (
//                     <tr key={r.id || `${r.userId}-${index}`}>
//                       <td>{(pagination.page - 1) * pagination.limit + index + 1}</td>
//                       <td>{formatDate(date)}</td>
//                       <td>{uName}</td>
//                       {isAdminManager ? <td className="att-mono">{r.userId}</td> : null}
//                       <td>{formatDT(inTime)}</td>
//                       <td>{formatDT(outTime)}</td>

//                       {isAdminManager ? (
//                         <td>
//                           <button
//                             className="att-icon-btn"
//                             type="button"
//                             title="Preview locations"
//                             onClick={() => {
//                               setPreviewRow(r);
//                               setPreviewOpen(true);
//                             }}
//                           >
//                             <FiEye size={18} />
//                           </button>
//                         </td>
//                       ) : null}
//                     </tr>
//                   );
//                 })
//               ) : (
//                 <tr>
//                   <td colSpan={isAdminManager ? 7 : 5} className="att-empty">
//                     No attendance found
//                   </td>
//                 </tr>
//               )}
//             </tbody>
//           </table>

//           {isAdminManager ? (
//             <Pagination
//               pagination={pagination}
//               onPageChange={(p) => fetchAttendance(p, pagination.limit)}
//               onLimitChange={(newLimit) => fetchAttendance(1, newLimit)}
//               limitOptions={[10, 20, 50]}
//             />
//           ) : null}
//         </div>
//       </div>

//       <PunchModal
//         open={punchOpen}
//         mode={punchMode}
//         onClose={() => setPunchOpen(false)}
//         onConfirm={async (payload) => {
//           if (punchMode === "IN") await doPunchIn(payload);
//           else await doPunchOut(payload);
//           await fetchAttendance();
//         }}
//       />

//       <PreviewModal
//         open={previewOpen}
//         row={previewRow}
//         userName={previewRow ? userMap.get(String(previewRow.userId)) || "-" : "-"}
//         onClose={() => {
//           setPreviewOpen(false);
//           setPreviewRow(null);
//         }}
//       />
//     </div>
//   );
// };

// export default Attendance;







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
