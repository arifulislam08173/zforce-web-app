// import React, { useEffect, useMemo, useRef, useState, useContext } from "react";
// import api from "../../api/api";
// import Loader from "../../components/Common/Loader";
// import "./visit.css";
// import { AuthContext } from "../../context/AuthContext";
// import {
//   FiEye,
//   FiX,
//   FiPlus,
//   FiLogIn,
//   FiLogOut,
//   FiMapPin,
//   FiRefreshCw,
//   FiPause,
//   FiExternalLink,
// } from "react-icons/fi";
// import Pagination from "../../components/Common/Pagination";

// const fmtDT = (v) => (v ? new Date(v).toLocaleString() : "-");
// const fmtDateInput = (d) => (d ? String(d).slice(0, 10) : "");

// const toDayBounds = (fromDate, toDate) => {
//   const f = fromDate ? `${fromDate}T00:00:00.000Z` : "";
//   const t = toDate ? `${toDate}T23:59:59.999Z` : "";
//   return { fromDate: f, toDate: t };
// };

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

// const getOsmEmbedUrl = (lat, lng) => {
//   const delta = 0.005;
//   const left = lng - delta;
//   const right = lng + delta;
//   const bottom = lat - delta;
//   const top = lat + delta;

//   const bbox = `${left},${bottom},${right},${top}`;
//   return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(
//     bbox
//   )}&layer=mapnik&marker=${lat},${lng}`;
// };

// const getOsmOpenUrl = (lat, lng) => {
//   return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=18/${lat}/${lng}`;
// };

// const StatusBadge = ({ status }) => {
//   const s = String(status || "PLANNED").toUpperCase();
//   const cls =
//     s === "COMPLETED"
//       ? "v-badge v-badge-completed"
//       : s === "MISSED"
//       ? "v-badge v-badge-missed"
//       : s === "IN_PROGRESS"
//       ? "v-badge v-badge-progress"
//       : "v-badge v-badge-planned";
//   return <span className={cls}>{s}</span>;
// };

// const IconButton = ({ title, onClick, variant = "default", children, disabled }) => (
//   <button type="button" className={`v-icon-btn ${variant}`} title={title} onClick={onClick} disabled={disabled}>
//     {children}
//   </button>
// );

// /* ---------------------- Generic Modal ---------------------- */
// const Modal = ({ open, title, subtitle, onClose, children, footer }) => {
//   if (!open) return null;
//   return (
//     <div className="v-modal-overlay" onMouseDown={onClose}>
//       <div className="v-modal" onMouseDown={(e) => e.stopPropagation()}>
//         <div className="v-modal-header">
//           <div>
//             <div className="v-modal-title">{title}</div>
//             {subtitle ? <div className="v-modal-subtitle">{subtitle}</div> : null}
//           </div>

//           <button className="v-icon-btn" type="button" onClick={onClose} title="Close">
//             <FiX size={18} />
//           </button>
//         </div>

//         <div style={{ marginTop: 12 }}>{children}</div>

//         {footer ? <div className="v-modal-footer">{footer}</div> : null}
//       </div>
//     </div>
//   );
// };

// /* ---------------------- Admin Preview Modal (Maps + Address by LatLng) ---------------------- */
// const VisitPreviewModal = ({ open, onClose, visit, userName, customer }) => {
//   const [inAddr, setInAddr] = useState("");
//   const [outAddr, setOutAddr] = useState("");
//   const [loadingAddr, setLoadingAddr] = useState(false);

//   useEffect(() => {
//     if (!open || !visit) return;

//     const inLat = safeNum(visit.checkInLat);
//     const inLng = safeNum(visit.checkInLng);
//     const outLat = safeNum(visit.checkOutLat);
//     const outLng = safeNum(visit.checkOutLng);

//     let cancelled = false;

//     const run = async () => {
//       setLoadingAddr(true);
//       try {
//         setInAddr("");
//         setOutAddr("");

//         if (inLat != null && inLng != null) {
//           const r = await reverseGeocodeOSM({ lat: inLat, lng: inLng });
//           if (!cancelled) setInAddr(r.full || r.short || "");
//         }
//         if (outLat != null && outLng != null) {
//           const r = await reverseGeocodeOSM({ lat: outLat, lng: outLng });
//           if (!cancelled) setOutAddr(r.full || r.short || "");
//         }
//       } catch (e) {
//         console.error(e);
//       } finally {
//         if (!cancelled) setLoadingAddr(false);
//       }
//     };

//     run();
//     return () => {
//       cancelled = true;
//     };
//   }, [open, visit]);

//   if (!open || !visit) return null;

//   const inLat = safeNum(visit.checkInLat);
//   const inLng = safeNum(visit.checkInLng);
//   const outLat = safeNum(visit.checkOutLat);
//   const outLng = safeNum(visit.checkOutLng);

//   return (
//     <Modal
//       open={open}
//       title="Visit Preview"
//       subtitle={visit?.id}
//       onClose={onClose}
//       footer={
//         <div className="v-footer">
//           <button className="v-btn-secondary" type="button" onClick={onClose}>
//             Close
//           </button>
//         </div>
//       }
//     >
//       <div className="v-preview-grid">
//         <div className="v-preview-card">
//           <div className="v-preview-title">Basic</div>
//           <div className="v-preview-muted">
//             <b>User:</b> {userName || visit.userId || "-"}
//           </div>
//           <div className="v-preview-muted">
//             <b>Customer:</b> {customer?.name || visit.customerId || "-"}{" "}
//             {customer?.phone ? <span className="v-muted">({customer.phone})</span> : null}
//           </div>
//           <div className="v-preview-muted">
//             <b>Status:</b> <StatusBadge status={visit.status} />
//           </div>
//           <div className="v-preview-muted">
//             <b>Planned:</b> {fmtDT(visit.plannedAt)}
//           </div>
//         </div>

//         <div className="v-preview-card">
//           <div className="v-preview-title">Check In</div>
//           <div className="v-preview-muted">
//             <b>Time:</b> {fmtDT(visit.checkInAt)}
//           </div>
//           <div className="v-preview-muted">
//             <b>GPS:</b>{" "}
//             {inLat != null && inLng != null ? `${inLat}, ${inLng}` : "-"}
//           </div>
//           <div className="v-preview-muted">
//             <b>Place:</b>{" "}
//             {loadingAddr && inLat != null ? "Detecting..." : inAddr || "-"}
//           </div>

//           <div className="v-map-head">
//             <div className="v-map-title">Map</div>
//             {inLat != null && inLng != null ? (
//               <button
//                 type="button"
//                 className="v-btn-secondary v-btn-sm"
//                 onClick={() => window.open(getOsmOpenUrl(inLat, inLng), "_blank", "noopener,noreferrer")}
//               >
//                 <FiExternalLink style={{ marginRight: 8 }} />
//                 Open
//               </button>
//             ) : null}
//           </div>

//           <div className="v-map-wrap">
//             {inLat != null && inLng != null ? (
//               <iframe className="v-map-iframe" title="checkin-map" src={getOsmEmbedUrl(inLat, inLng)} loading="lazy" />
//             ) : (
//               <div className="v-map-skeleton">No check-in location</div>
//             )}
//           </div>
//         </div>

//         <div className="v-preview-card">
//           <div className="v-preview-title">Check Out</div>
//           <div className="v-preview-muted">
//             <b>Time:</b> {fmtDT(visit.checkOutAt)}
//           </div>
//           <div className="v-preview-muted">
//             <b>GPS:</b>{" "}
//             {outLat != null && outLng != null ? `${outLat}, ${outLng}` : "-"}
//           </div>
//           <div className="v-preview-muted">
//             <b>Place:</b>{" "}
//             {loadingAddr && outLat != null ? "Detecting..." : outAddr || "-"}
//           </div>

//           <div className="v-map-head">
//             <div className="v-map-title">Map</div>
//             {outLat != null && outLng != null ? (
//               <button
//                 type="button"
//                 className="v-btn-secondary v-btn-sm"
//                 onClick={() => window.open(getOsmOpenUrl(outLat, outLng), "_blank", "noopener,noreferrer")}
//               >
//                 <FiExternalLink style={{ marginRight: 8 }} />
//                 Open
//               </button>
//             ) : null}
//           </div>

//           <div className="v-map-wrap">
//             {outLat != null && outLng != null ? (
//               <iframe className="v-map-iframe" title="checkout-map" src={getOsmEmbedUrl(outLat, outLng)} loading="lazy" />
//             ) : (
//               <div className="v-map-skeleton">No check-out location</div>
//             )}
//           </div>
//         </div>

//         {visit?.notes ? (
//           <div className="v-preview-card" style={{ gridColumn: "1 / -1" }}>
//             <div className="v-preview-title">Notes</div>
//             <div className="v-preview-muted" style={{ fontWeight: 600, opacity: 0.9 }}>
//               {visit.notes}
//             </div>
//           </div>
//         ) : null}
//       </div>
//     </Modal>
//   );
// };

// /* ---------------------- Live Location Modal (Field Check In/Out) ---------------------- */
// const LiveLocationModal = ({ open, onClose, title, onConfirm, withNotes = false }) => {
//   const [saving, setSaving] = useState(false);
//   const [err, setErr] = useState("");

//   const [lat, setLat] = useState("");
//   const [lng, setLng] = useState("");
//   const [accuracy, setAccuracy] = useState(null);

//   const [place, setPlace] = useState("");
//   const [placeFull, setPlaceFull] = useState("");
//   const [placeLoading, setPlaceLoading] = useState(false);

//   const [notes, setNotes] = useState("");
//   const [status, setStatus] = useState("idle"); // idle | locating | live | stopped

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

//   const startLive = () => {
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

//     setSaving(false);
//     setErr("");
//     setLat("");
//     setLng("");
//     setAccuracy(null);

//     setPlace("");
//     setPlaceFull("");
//     setPlaceLoading(false);

//     setNotes("");
//     setStatus("idle");
//     lastGeoRef.current = { key: "", ts: 0 };

//     startLive();

//     return () => {
//       if (watchIdRef.current != null && navigator.geolocation?.clearWatch) {
//         navigator.geolocation.clearWatch(watchIdRef.current);
//       }
//       watchIdRef.current = null;
//     };
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [open]);

//   if (!open) return null;

//   const laNum = safeNum(lat);
//   const lnNum = safeNum(lng);

//   const badge =
//     status === "locating" ? "Locating…" : status === "live" ? "Live" : status === "stopped" ? "Stopped" : "Idle";

//   const submit = async () => {
//     setErr("");
//     try {
//       setSaving(true);

//       if (laNum == null || lnNum == null) {
//         setErr("Location not ready yet. Please wait or tap Refresh.");
//         return;
//       }

//       const payload = { latitude: laNum, longitude: lnNum };
//       if (withNotes) payload.notes = notes || null;

//       await onConfirm(payload);

//       stopWatch();
//       onClose?.();
//     } catch (e2) {
//       console.error(e2);
//       setErr(e2?.response?.data?.message || "Action failed");
//     } finally {
//       setSaving(false);
//     }
//   };

//   return (
//     <Modal
//       open={open}
//       title={title}
//       subtitle="Auto-capturing live location from device"
//       onClose={() => {
//         stopWatch();
//         onClose?.();
//       }}
//       footer={
//         <div className="v-footer">
//           <button className="v-btn-secondary" type="button" onClick={() => { stopWatch(); onClose?.(); }} disabled={saving}>
//             Cancel
//           </button>

//           <button className="v-btn-secondary" type="button" onClick={startLive} disabled={saving}>
//             <FiRefreshCw style={{ marginRight: 8 }} />
//             Refresh
//           </button>

//           <button className="v-btn-secondary" type="button" onClick={stopWatch} disabled={saving}>
//             <FiPause style={{ marginRight: 8 }} />
//             Stop
//           </button>

//           <button className="v-btn-primary" type="button" onClick={submit} disabled={saving}>
//             {saving ? "Saving..." : "Confirm"}
//           </button>
//         </div>
//       }
//     >
//       {err ? <div className="v-alert-error">{err}</div> : null}

//       <div className="v-loc-card">
//         <div className="v-loc-head">
//           <div className="v-loc-title">
//             <FiMapPin style={{ marginRight: 8 }} />
//             Live Location
//           </div>

//           <div className="v-loc-meta">
//             <span className={`v-badge ${status === "live" ? "v-badge-ok" : ""}`}>{badge}</span>
//             {accuracy != null ? <span className="v-badge">± {Math.round(accuracy)} m</span> : null}
//           </div>
//         </div>

//         <div className="v-grid-2" style={{ marginTop: 12 }}>
//           <div>
//             <label className="v-label">Latitude</label>
//             <input className="v-input" value={lat} readOnly placeholder="Getting latitude..." />
//           </div>

//           <div>
//             <label className="v-label">Longitude</label>
//             <input className="v-input" value={lng} readOnly placeholder="Getting longitude..." />
//           </div>

//           <div style={{ gridColumn: "1 / -1" }}>
//             <label className="v-label">
//               Area / Road {placeLoading ? <span style={{ opacity: 0.6 }}>(detecting…)</span> : null}
//             </label>
//             <input className="v-input" value={place || ""} readOnly placeholder="Detecting area/road name..." title={placeFull || ""} />
//           </div>

//           <div style={{ gridColumn: "1 / -1" }}>
//             <div className="v-map-head">
//               <div className="v-map-title">Map Preview</div>

//               {laNum != null && lnNum != null ? (
//                 <button
//                   type="button"
//                   className="v-btn-secondary v-btn-sm"
//                   onClick={() => window.open(getOsmOpenUrl(laNum, lnNum), "_blank", "noopener,noreferrer")}
//                 >
//                   <FiExternalLink style={{ marginRight: 8 }} />
//                   Open
//                 </button>
//               ) : null}
//             </div>

//             <div className="v-map-wrap">
//               {laNum != null && lnNum != null ? (
//                 <iframe className="v-map-iframe" title="visit-map" src={getOsmEmbedUrl(laNum, lnNum)} loading="lazy" />
//               ) : (
//                 <div className="v-map-skeleton">Waiting for coordinates…</div>
//               )}
//             </div>
//           </div>

//           {withNotes ? (
//             <div style={{ gridColumn: "1 / -1" }}>
//               <label className="v-label">Notes</label>
//               <input className="v-input" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes" />
//             </div>
//           ) : null}

//           <div style={{ gridColumn: "1 / -1" }} className="v-hint">
//             Tip: In production you must use <b>HTTPS</b> for location permission on most browsers.
//           </div>
//         </div>
//       </div>
//     </Modal>
//   );
// };

// /* ---------------------- Plan Visit Modal (ADMIN/MANAGER) ---------------------- */
// const PlanVisitModal = ({ open, onClose, onCreated, users, customers }) => {
//   const [saving, setSaving] = useState(false);
//   const [err, setErr] = useState("");

//   const [form, setForm] = useState({
//     userId: "",
//     customerId: "",
//     plannedAt: "",
//     notes: "",
//   });

//   useEffect(() => {
//     if (!open) return;
//     setErr("");
//     setSaving(false);

//     const d = new Date(Date.now() + 60 * 60 * 1000);
//     const pad = (n) => String(n).padStart(2, "0");
//     const local = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
//       d.getMinutes()
//     )}`;

//     setForm((f) => ({ ...f, plannedAt: local }));
//   }, [open]);

//   if (!open) return null;

//   const submit = async (e) => {
//     e.preventDefault();
//     setErr("");

//     if (!form.userId) return setErr("User is required");
//     if (!form.customerId) return setErr("Customer is required");
//     if (!form.plannedAt) return setErr("Planned date & time is required");

//     try {
//       setSaving(true);

//       await api.post("/visits", {
//         userId: String(form.userId),
//         customerId: String(form.customerId),
//         plannedAt: new Date(form.plannedAt).toISOString(),
//         notes: form.notes || null,
//       });

//       onCreated?.();
//       onClose?.();
//     } catch (e2) {
//       console.error(e2);
//       setErr(e2?.response?.data?.message || "Failed to plan visit");
//     } finally {
//       setSaving(false);
//     }
//   };

//   return (
//     <div className="v-modal-overlay" onMouseDown={onClose}>
//       <div className="v-modal" onMouseDown={(e) => e.stopPropagation()}>
//         <div className="v-modal-header">
//           <div>
//             <div className="v-modal-title">Plan Visit</div>
//             <div className="v-modal-subtitle">Assign user + customer + schedule</div>
//           </div>

//           <button className="v-icon-btn" type="button" onClick={onClose} title="Close">
//             <FiX size={18} />
//           </button>
//         </div>

//         {err ? <div className="v-alert-error" style={{ marginTop: 12 }}>{err}</div> : null}

//         <form className="v-card" onSubmit={submit} style={{ marginTop: 12 }}>
//           <div className="v-grid-2">
//             <div>
//               <label className="v-label">User</label>
//               <select className="v-input" value={form.userId} onChange={(e) => setForm((f) => ({ ...f, userId: e.target.value }))}>
//                 <option value="">Select user</option>
//                 {users.map((u) => (
//                   <option key={u.id} value={u.id}>{u.name}</option>
//                 ))}
//               </select>
//             </div>

//             <div>
//               <label className="v-label">Customer</label>
//               <select className="v-input" value={form.customerId} onChange={(e) => setForm((f) => ({ ...f, customerId: e.target.value }))}>
//                 <option value="">Select customer</option>
//                 {customers.map((c) => (
//                   <option key={c.id} value={c.id}>
//                     {c.name} {c.phone ? `(${c.phone})` : ""}
//                   </option>
//                 ))}
//               </select>
//             </div>

//             <div>
//               <label className="v-label">Planned At</label>
//               <input className="v-input" type="datetime-local" value={form.plannedAt} onChange={(e) => setForm((f) => ({ ...f, plannedAt: e.target.value }))} />
//             </div>

//             <div>
//               <label className="v-label">Notes</label>
//               <input className="v-input" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Optional" />
//             </div>
//           </div>

//           <div className="v-footer">
//             <button className="v-btn-secondary" type="button" onClick={onClose}>Cancel</button>
//             <button className="v-btn-primary" disabled={saving}>{saving ? "Saving..." : "Create Visit"}</button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// };

// /* ---------------------- Main Page ---------------------- */
// const Visit = () => {
//   const { user } = useContext(AuthContext);

//   const isField = user?.role === "FIELD";
//   const canManage = user?.role === "ADMIN" || user?.role === "MANAGER";

//   const [loading, setLoading] = useState(true);

//   const [visits, setVisits] = useState([]);
//   const [users, setUsers] = useState([]);
//   const [customers, setCustomers] = useState([]);

//   // filters
//   const [from, setFrom] = useState(fmtDateInput(new Date().toISOString()));
//   const [to, setTo] = useState(fmtDateInput(new Date().toISOString()));
//   const [status, setStatus] = useState("");
//   const [userId, setUserId] = useState("");

//   const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

//   // modals
//   const [planOpen, setPlanOpen] = useState(false);

//   const [geoOpen, setGeoOpen] = useState(false);
//   const [geoTitle, setGeoTitle] = useState("");
//   const [geoWithNotes, setGeoWithNotes] = useState(false);
//   const [geoOnConfirm, setGeoOnConfirm] = useState(async () => {});

//   const [previewOpen, setPreviewOpen] = useState(false);
//   const [previewVisit, setPreviewVisit] = useState(null);

//   const userMap = useMemo(() => {
//     const m = new Map();
//     (users || []).forEach((u) => m.set(String(u.id), u));
//     return m;
//   }, [users]);

//   const customerMap = useMemo(() => {
//     const m = new Map();
//     (customers || []).forEach((c) => m.set(String(c.id), c));
//     return m;
//   }, [customers]);

//   const loadDropdowns = async () => {
//     const reqs = [api.get("/customers/dropdown")];
//     if (canManage) reqs.unshift(api.get("/users/dropdown"));

//     const results = await Promise.all(reqs);

//     if (canManage) {
//       const uRes = results[0];
//       const cRes = results[1];
//       setUsers(uRes.data || []);
//       setCustomers(cRes.data || []);
//     } else {
//       const cRes = results[0];
//       setUsers(user?.id ? [{ id: user.id, name: user.name || "Me" }] : []);
//       setCustomers(cRes.data || []);
//     }
//   };

//   const fetchVisits = async (page = 1, limit = pagination.limit) => {
//     setLoading(true);
//     try {
//       const { fromDate, toDate } = toDayBounds(from, to);

//       const params = new URLSearchParams();
//       params.set("page", String(page));
//       params.set("limit", String(limit));

//       if (fromDate && toDate) {
//         params.set("fromDate", fromDate);
//         params.set("toDate", toDate);
//       }
//       if (status) params.set("status", status);
//       if (canManage && userId) params.set("userId", userId);

//       const endpoint = isField ? "/visits/my" : "/visits/report";
//       const res = await api.get(`${endpoint}?${params.toString()}`);

//       setVisits(res.data?.data || []);
//       setPagination(res.data?.pagination || { page, limit, total: 0, totalPages: 1 });
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     const init = async () => {
//       try {
//         setLoading(true);
//         await loadDropdowns();
//         await fetchVisits();
//       } catch (e) {
//         console.error(e);
//       } finally {
//         setLoading(false);
//       }
//     };
//     init();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   const onSearch = (e) => {
//     e.preventDefault();
//     fetchVisits(1, pagination.limit);
//   };

//   const openPreview = (v) => {
//     setPreviewVisit(v);
//     setPreviewOpen(true);
//   };

//   const openCheckIn = (visitId) => {
//     setGeoTitle("Check In");
//     setGeoWithNotes(false);
//     setGeoOnConfirm(() => async (payload) => {
//       await api.post(`/visits/${visitId}/check-in`, payload);
//       await fetchVisits();
//     });
//     setGeoOpen(true);
//   };

//   const openCheckOut = (visitId) => {
//     setGeoTitle("Check Out");
//     setGeoWithNotes(true);
//     setGeoOnConfirm(() => async (payload) => {
//       await api.post(`/visits/${visitId}/check-out`, payload);
//       await fetchVisits();
//     });
//     setGeoOpen(true);
//   };

//   if (loading) return <Loader />;

//   return (
//     <div className="visit-page">
//       <div className="visit-header">
//         <div>
//           <h2 className="visit-title">Visits</h2>
//           <p className="visit-subtitle">{isField ? "Check in / check out your visits." : "Plan visits and monitor activity."}</p>
//         </div>

//         {canManage ? (
//           <button className="v-btn-primary" type="button" onClick={() => setPlanOpen(true)}>
//             <FiPlus style={{ marginRight: 8 }} /> Plan Visit
//           </button>
//         ) : null}
//       </div>

//       <form className="v-card visit-filters" onSubmit={onSearch}>
//         <div className="visit-filters-row">
//           <div className="visit-filter">
//             <label className="v-label">From</label>
//             <input className="v-input" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
//           </div>

//           <div className="visit-filter">
//             <label className="v-label">To</label>
//             <input className="v-input" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
//           </div>

//           {canManage ? (
//             <div className="visit-filter">
//               <label className="v-label">User</label>
//               <select className="v-input" value={userId} onChange={(e) => setUserId(e.target.value)}>
//                 <option value="">All users</option>
//                 {users.map((u) => (
//                   <option key={u.id} value={u.id}>{u.name}</option>
//                 ))}
//               </select>
//             </div>
//           ) : null}

//           <div className="visit-filter">
//             <label className="v-label">Status</label>
//             <select className="v-input" value={status} onChange={(e) => setStatus(e.target.value)}>
//               <option value="">All status</option>
//               <option value="PLANNED">PLANNED</option>
//               <option value="IN_PROGRESS">IN_PROGRESS</option>
//               <option value="COMPLETED">COMPLETED</option>
//               <option value="MISSED">MISSED</option>
//             </select>
//           </div>

//           <div className="visit-filter visit-filter-btn">
//             <button className="v-btn-secondary" type="submit">Search</button>
//           </div>
//         </div>
//       </form>

//       <div className="v-card">
//         <div className="v-table-wrap">
//           <table className="v-table">
//             <thead>
//               <tr>
//                 <th style={{ width: 60 }}>#</th>
//                 <th>Planned At</th>
//                 <th>User</th>
//                 <th>Customer</th>
//                 <th>Phone</th>
//                 <th>Status</th>
//                 <th>Check In</th>
//                 <th>Check Out</th>
//                 <th className="v-th-actions">Actions</th>
//               </tr>
//             </thead>
//             <tbody>
//               {visits.length ? (
//                 visits.map((v, index) => {
//                   const u = userMap.get(String(v.userId));
//                   const c = customerMap.get(String(v.customerId));

//                   const canCheckIn = isField && !v.checkInAt && String(v.status || "").toUpperCase() === "PLANNED";
//                   const canCheckOut = isField && Boolean(v.checkInAt) && !v.checkOutAt && String(v.status || "").toUpperCase() === "IN_PROGRESS";

//                   return (
//                     <tr key={v.id || index}>
//                       <td>{(pagination.page - 1) * pagination.limit + index + 1}</td>
//                       <td>{fmtDT(v.plannedAt)}</td>
//                       <td>{(isField ? user?.name : u?.name) || v.userId || "-"}</td>
//                       <td>{c?.name || v.customerId || "-"}</td>
//                       <td>{c?.phone || "-"}</td>
//                       <td><StatusBadge status={v.status} /></td>
//                       <td>{fmtDT(v.checkInAt)}</td>
//                       <td>{fmtDT(v.checkOutAt)}</td>
//                       <td className="v-actions">
//                         <div className="v-action-row">
//                           <IconButton title="Preview (Map)" onClick={() => openPreview(v)}>
//                             <FiEye size={18} />
//                           </IconButton>

//                           {isField ? (
//                             <>
//                               <IconButton title="Check In" onClick={() => openCheckIn(v.id)} disabled={!canCheckIn}>
//                                 <FiLogIn size={18} />
//                               </IconButton>

//                               <IconButton title="Check Out" onClick={() => openCheckOut(v.id)} disabled={!canCheckOut}>
//                                 <FiLogOut size={18} />
//                               </IconButton>
//                             </>
//                           ) : null}

//                           <IconButton title="GPS Preview" onClick={() => openPreview(v)}>
//                             <FiMapPin size={18} />
//                           </IconButton>
//                         </div>
//                       </td>
//                     </tr>
//                   );
//                 })
//               ) : (
//                 <tr>
//                   <td colSpan={9} className="v-empty">No visits found</td>
//                 </tr>
//               )}
//             </tbody>
//           </table>

//           <Pagination
//             pagination={pagination}
//             onPageChange={(p) => fetchVisits(p, pagination.limit)}
//             onLimitChange={(newLimit) => fetchVisits(1, newLimit)}
//             limitOptions={[10, 20, 50]}
//           />
//         </div>
//       </div>

//       {canManage ? (
//         <PlanVisitModal
//           open={planOpen}
//           onClose={() => setPlanOpen(false)}
//           onCreated={fetchVisits}
//           users={users}
//           customers={customers}
//         />
//       ) : null}

//       {isField ? (
//         <LiveLocationModal
//           open={geoOpen}
//           onClose={() => setGeoOpen(false)}
//           title={geoTitle}
//           onConfirm={geoOnConfirm}
//           withNotes={geoWithNotes}
//         />
//       ) : null}

//       <VisitPreviewModal
//         open={previewOpen}
//         onClose={() => setPreviewOpen(false)}
//         visit={previewVisit}
//         userName={(isField ? user?.name : userMap.get(String(previewVisit?.userId))?.name) || ""}
//         customer={customerMap.get(String(previewVisit?.customerId))}
//       />
//     </div>
//   );
// };

// export default Visit;










import React, { useEffect, useMemo, useState, useContext } from "react";
import api from "../../api/api";
import Loader from "../../components/Common/Loader";
import "./visit.css";
import { AuthContext } from "../../context/AuthContext";
import { FiEye, FiPlus, FiLogIn, FiLogOut, FiMapPin } from "react-icons/fi";
import Pagination from "../../components/Common/Pagination";

import { fmtDT, fmtDateInput, toDayBounds } from "./visit.utils";
import StatusBadge from "./components/StatusBadge";
import IconButton from "./components/IconButton";
import PlanVisitModal from "./components/PlanVisitModal";
import LiveLocationModal from "./components/LiveLocationModal";
import VisitPreviewModal from "./components/VisitPreviewModal";

const Visit = () => {
  const { user } = useContext(AuthContext);

  const isField = user?.role === "FIELD";
  const canManage = user?.role === "ADMIN" || user?.role === "MANAGER";
  const canPlanVisit = canManage || isField;

  const [loading, setLoading] = useState(true);

  const [visits, setVisits] = useState([]);
  const [users, setUsers] = useState([]);
  const [customers, setCustomers] = useState([]);

  // filters
  const [from, setFrom] = useState(fmtDateInput(new Date().toISOString()));
  const [to, setTo] = useState(fmtDateInput(new Date().toISOString()));
  const [status, setStatus] = useState("");
  const [userId, setUserId] = useState("");

  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  // modals
  const [planOpen, setPlanOpen] = useState(false);

  const [geoOpen, setGeoOpen] = useState(false);
  const [geoTitle, setGeoTitle] = useState("");
  const [geoWithNotes, setGeoWithNotes] = useState(false);
  const [geoOnConfirm, setGeoOnConfirm] = useState(async () => {});

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewVisit, setPreviewVisit] = useState(null);

  const userMap = useMemo(() => {
    const m = new Map();
    (users || []).forEach((u) => m.set(String(u.id), u));
    return m;
  }, [users]);

  const customerMap = useMemo(() => {
    const m = new Map();
    (customers || []).forEach((c) => m.set(String(c.id), c));
    return m;
  }, [customers]);

  const loadDropdowns = async () => {
    const reqs = [api.get("/customers/dropdown")];
    if (canManage) reqs.unshift(api.get("/users/dropdown"));

    const results = await Promise.all(reqs);

    if (canManage) {
      const uRes = results[0];
      const cRes = results[1];
      setUsers(uRes.data || []);
      setCustomers(cRes.data || []);
    } else {
      const cRes = results[0];
      setUsers(user?.id ? [{ id: user.id, name: user.name || "Me" }] : []);
      setCustomers(cRes.data || []);
    }
  };

  const fetchVisits = async (page = 1, limit = pagination.limit) => {
    setLoading(true);
    try {
      const { fromDate, toDate } = toDayBounds(from, to);

      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(limit));

      if (fromDate && toDate) {
        params.set("fromDate", fromDate);
        params.set("toDate", toDate);
      }
      if (status) params.set("status", status);
      if (canManage && userId) params.set("userId", userId);

      const endpoint = isField ? "/visits/my" : "/visits/report";
      const res = await api.get(`${endpoint}?${params.toString()}`);

      setVisits(res.data?.data || []);
      setPagination(res.data?.pagination || { page, limit, total: 0, totalPages: 1 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        await loadDropdowns();
        await fetchVisits();
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSearch = (e) => {
    e.preventDefault();
    fetchVisits(1, pagination.limit);
  };

  const openPreview = (v) => {
    setPreviewVisit(v);
    setPreviewOpen(true);
  };

  const openCheckIn = (visitId) => {
    setGeoTitle("Check In");
    setGeoWithNotes(false);
    setGeoOnConfirm(() => async (payload) => {
      await api.post(`/visits/${visitId}/check-in`, payload);
      await fetchVisits();
    });
    setGeoOpen(true);
  };

  const openCheckOut = (visitId) => {
    setGeoTitle("Check Out");
    setGeoWithNotes(true);
    setGeoOnConfirm(() => async (payload) => {
      await api.post(`/visits/${visitId}/check-out`, payload);
      await fetchVisits();
    });
    setGeoOpen(true);
  };

  if (loading) return <Loader />;

  return (
    <div className="visit-page">
      <div className="visit-header">
        <div>
          <h2 className="visit-title">Visits</h2>
          <p className="visit-subtitle">
            {isField ? "Check in / check out your visits." : "Plan visits and monitor activity."}
          </p>
        </div>

        {canPlanVisit ? (
          <button className="v-btn-primary" type="button" onClick={() => setPlanOpen(true)}>
            <FiPlus style={{ marginRight: 8 }} /> Plan Visit
          </button>
        ) : null}
      </div>

      <form className="v-card visit-filters" onSubmit={onSearch}>
        <div className="visit-filters-row">
          <div className="visit-filter">
            <label className="v-label">From</label>
            <input className="v-input" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>

          <div className="visit-filter">
            <label className="v-label">To</label>
            <input className="v-input" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>

          {canManage ? (
            <div className="visit-filter">
              <label className="v-label">User</label>
              <select className="v-input" value={userId} onChange={(e) => setUserId(e.target.value)}>
                <option value="">All users</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <div className="visit-filter">
            <label className="v-label">Status</label>
            <select className="v-input" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All status</option>
              <option value="PLANNED">PLANNED</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="MISSED">MISSED</option>
            </select>
          </div>

          <div className="visit-filter visit-filter-btn">
            <button className="v-btn-secondary" type="submit">
              Search
            </button>
          </div>
        </div>
      </form>

      <div className="v-card">
        <div className="v-table-wrap">
          <table className="v-table">
            <thead>
              <tr>
                <th style={{ width: 60 }}>#</th>
                <th>Planned At</th>
                <th>User</th>
                <th>Customer</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th className="v-th-actions">Actions</th>
              </tr>
            </thead>

            <tbody>
              {visits.length ? (
                visits.map((v, index) => {
                  const u = userMap.get(String(v.userId));
                  const c = customerMap.get(String(v.customerId));

                  const canCheckIn = isField && !v.checkInAt && String(v.status || "").toUpperCase() === "PLANNED";
                  const canCheckOut =
                    isField &&
                    Boolean(v.checkInAt) &&
                    !v.checkOutAt &&
                    String(v.status || "").toUpperCase() === "IN_PROGRESS";

                  return (
                    <tr key={v.id || index}>
                      <td>{(pagination.page - 1) * pagination.limit + index + 1}</td>
                      <td>{fmtDT(v.plannedAt)}</td>
                      <td>{(isField ? user?.name : u?.name) || v.userId || "-"}</td>
                      <td>{c?.name || v.customerId || "-"}</td>
                      <td>{c?.phone || "-"}</td>
                      <td>
                        <StatusBadge status={v.status} />
                      </td>
                      <td>{fmtDT(v.checkInAt)}</td>
                      <td>{fmtDT(v.checkOutAt)}</td>

                      <td className="v-actions">
                        <div className="v-action-row">
                          <IconButton title="Preview (Map)" onClick={() => openPreview(v)}>
                            <FiEye size={18} />
                          </IconButton>

                          {isField ? (
                            <>
                              <IconButton title="Check In" onClick={() => openCheckIn(v.id)} disabled={!canCheckIn}>
                                <FiLogIn size={18} />
                              </IconButton>

                              <IconButton title="Check Out" onClick={() => openCheckOut(v.id)} disabled={!canCheckOut}>
                                <FiLogOut size={18} />
                              </IconButton>
                            </>
                          ) : null}

                          <IconButton title="GPS Preview" onClick={() => openPreview(v)}>
                            <FiMapPin size={18} />
                          </IconButton>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="v-empty">
                    No visits found
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <Pagination
            pagination={pagination}
            onPageChange={(p) => fetchVisits(p, pagination.limit)}
            onLimitChange={(newLimit) => fetchVisits(1, newLimit)}
            limitOptions={[10, 20, 50]}
          />
        </div>
      </div>

      {canPlanVisit ? (
        <PlanVisitModal
          open={planOpen}
          onClose={() => setPlanOpen(false)}
          onCreated={fetchVisits}
          users={users}
          customers={customers}
          hideUserSelect={isField}
          fixedUserId={user?.id || ""}
          fixedUserName={user?.name || "Me"}
        />
      ) : null}

      {isField ? (
        <LiveLocationModal
          open={geoOpen}
          onClose={() => setGeoOpen(false)}
          title={geoTitle}
          onConfirm={geoOnConfirm}
          withNotes={geoWithNotes}
        />
      ) : null}

      <VisitPreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        visit={previewVisit}
        userName={(isField ? user?.name : userMap.get(String(previewVisit?.userId))?.name) || ""}
        customer={customerMap.get(String(previewVisit?.customerId))}
      />
    </div>
  );
};

export default Visit;
