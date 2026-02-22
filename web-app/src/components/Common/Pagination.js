import React, { useMemo } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import "./pagination.css";

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

const buildPages = (page, totalPages) => {
  const p = clamp(Number(page || 1), 1, Math.max(1, totalPages));
  const t = Math.max(1, Number(totalPages || 1));

  // Small count: show all
  if (t <= 7) return Array.from({ length: t }, (_, i) => i + 1);

  // Large count: show with dots
  // Example: 1 ... 4 5 6 ... 20
  const pages = new Set([1, 2, t - 1, t, p - 1, p, p + 1]);

  const arr = [...pages]
    .filter((x) => x >= 1 && x <= t)
    .sort((a, b) => a - b);

  const out = [];
  for (let i = 0; i < arr.length; i++) {
    out.push(arr[i]);
    if (i < arr.length - 1 && arr[i + 1] - arr[i] > 1) out.push("…");
  }
  return out;
};

const Pagination = ({
  pagination,
  onPageChange,
  onLimitChange, // optional
  limitOptions = [10, 20, 50, 100],
  showLimit = true,
  className = "",
}) => {
  const page = Number(pagination?.page || 1);
  const limit = Number(pagination?.limit || 10);
  const total = Number(pagination?.total || 0);
  const totalPages = Math.max(1, Number(pagination?.totalPages || 1));

  const pages = useMemo(() => buildPages(page, totalPages), [page, totalPages]);

  // Range label like: "Showing 11–20 of 132"
  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end = total === 0 ? 0 : Math.min(page * limit, total);

  const go = (p) => {
    const next = clamp(Number(p), 1, totalPages);
    if (next !== page) onPageChange(next);
  };

  return (
    <div className={`ffp-wrap ${className}`}>
      <div className="ffp-left">
        <div className="ffp-info">
          Showing <b>{start}</b>–<b>{end}</b> of <b>{total}</b>
        </div>

        {showLimit && onLimitChange ? (
          <div className="ffp-limit">
            <span className="ffp-muted">Rows</span>
            <select
              className="ffp-select"
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
            >
              {limitOptions.map((n) => (
                <option key={n} value={n}>
                  {n}/page
                </option>
              ))}
            </select>
          </div>
        ) : null}
      </div>

      <div className="ffp-right">
        <button
          className="ffp-btn"
          type="button"
          onClick={() => go(page - 1)}
          disabled={page <= 1}
          title="Previous page"
        >
          <FiChevronLeft />
          <span className="ffp-btnText">Prev</span>
        </button>

        <div className="ffp-pages" role="navigation" aria-label="Pagination">
          {pages.map((x, idx) =>
            x === "…" ? (
              <span key={`dots-${idx}`} className="ffp-dots">
                …
              </span>
            ) : (
              <button
                key={x}
                type="button"
                className={`ffp-page ${x === page ? "active" : ""}`}
                onClick={() => go(x)}
                aria-current={x === page ? "page" : undefined}
              >
                {x}
              </button>
            )
          )}
        </div>

        <button
          className="ffp-btn"
          type="button"
          onClick={() => go(page + 1)}
          disabled={page >= totalPages}
          title="Next page"
        >
          <span className="ffp-btnText">Next</span>
          <FiChevronRight />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
