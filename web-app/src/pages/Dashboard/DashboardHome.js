import React, { useContext, useEffect, useMemo, useState } from 'react';
import {
  FiArrowDownRight,
  FiArrowUpRight,
  FiBarChart2,
  FiCheckCircle,
  FiClock,
  FiCreditCard,
  FiDollarSign,
  FiMapPin,
  FiRefreshCw,
  FiShoppingCart,
  FiTrendingUp,
  FiUsers,
} from 'react-icons/fi';
import api from '../../api/api';
import { AuthContext } from '../../context/AuthContext';
import './DashboardHome.css';

const PERIOD_OPTIONS = [
  { key: 'all', label: 'All time', description: 'All records' },
  { key: '30d', label: 'Last 30 days', description: 'Monthly view' },
  { key: '7d', label: 'Last 7 days', description: 'Weekly view' },
  { key: 'today', label: 'Today', description: 'Daily view' },
];

const emptyAnalytics = {
  period: 'all',
  periodLabel: 'All time',
  overview: {
    totalUsers: 0,
    totalCustomers: 0,
    totalVisits: 0,
    totalOrders: 0,
    totalCollections: 0,
    totalExpenses: 0,
    totalAttendance: 0,
    completedOrders: 0,
    pendingOrders: 0,
    completedVisits: 0,
    approvedCollections: 0,
    approvedExpenses: 0,
  },
  finance: {
    totalRevenue: 0,
    requestedRevenue: 0,
    totalCollected: 0,
    approvedCollected: 0,
    totalExpenseAmount: 0,
    approvedExpenseAmount: 0,
    netCollection: 0,
    collectionRate: 0,
    orderCompletionRate: 0,
    visitCompletionRate: 0,
    expenseApprovalRate: 0,
  },
  charts: {
    trend: [],
    orderStatus: [],
    orderPaymentStatus: [],
    collectionStatus: [],
    expenseStatus: [],
    topPerformers: [],
  },
  recentOrders: [],
};

function money(value) {
  const num = Number(value || 0);
  return new Intl.NumberFormat('en-US', {
    notation: Math.abs(num) >= 100000 ? 'compact' : 'standard',
    maximumFractionDigits: Math.abs(num) >= 100000 ? 1 : 0,
  }).format(num);
}

function number(value) {
  return new Intl.NumberFormat('en-US').format(Number(value || 0));
}

function pct(value) {
  const safe = Math.max(0, Math.min(100, Number(value || 0)));
  return `${safe}%`;
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function getVisibleLabelIndexes(length, maxLabels = 7) {
  if (length <= 0) return new Set();
  if (length <= maxLabels) {
    return new Set(Array.from({ length }, (_, index) => index));
  }

  const indexes = new Set([0, length - 1]);
  const slots = Math.max(2, maxLabels - 1);
  const step = (length - 1) / slots;

  for (let i = 1; i < slots; i += 1) {
    indexes.add(Math.round(i * step));
  }

  return indexes;
}


const statusClass = (status) => String(status || '').toLowerCase().replace(/_/g, '-');

function StatCard({ icon, label, value, hint, tone = 'blue', trend }) {
  return (
    <div className={`zf-stat-card tone-${tone}`}>
      <div className="zf-stat-top">
        <div className="zf-stat-icon">{icon}</div>
        {trend ? <span className="zf-stat-trend"><FiArrowUpRight /> {trend}</span> : null}
      </div>
      <div className="zf-stat-value">{value}</div>
      <div className="zf-stat-label">{label}</div>
      {hint ? <div className="zf-stat-hint">{hint}</div> : null}
    </div>
  );
}

function MultiBarChart({ data = [] }) {
  const rows = safeArray(data);
  const max = Math.max(
    1,
    ...rows.flatMap((d) => [Number(d.orders || 0), Number(d.visits || 0)])
  );

  const visibleLabelIndexes = getVisibleLabelIndexes(rows.length, 7);

  if (!rows.length) {
    return <div className="zf-chart-empty">No activity data for this period.</div>;
  }

  return (
    <div className="zf-multi-bars">
      {rows.map((item, index) => {
        const orders = Number(item.orders || 0);
        const visits = Number(item.visits || 0);
        const showLabel = visibleLabelIndexes.has(index);

        return (
          <div
            className={`zf-multi-bar-item ${showLabel ? '' : 'is-label-hidden'}`}
            key={item.key || item.date || item.label}
            title={`${item.label} • Orders: ${orders}, Visits: ${visits}`}
          >
            <div className="zf-multi-bar-pair">
              <div className="zf-multi-bar-track" title={`${item.label} • Orders: ${orders}`}>
                <i
                  className="orders"
                  style={{
                    height: `${orders > 0 ? Math.max(7, (orders / max) * 100) : 0}%`,
                  }}
                />
              </div>

              <div className="zf-multi-bar-track" title={`${item.label} • Visits: ${visits}`}>
                <i
                  className="visits"
                  style={{
                    height: `${visits > 0 ? Math.max(7, (visits / max) * 100) : 0}%`,
                  }}
                />
              </div>
            </div>

            <div className="zf-bar-label">
              {showLabel ? item.label : ''}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function LineChart({ data = [], valueKey = 'revenue', labelKey = 'label', period = 'all' }) {
  const rows = safeArray(data);
  const width = 720;
  const height = 230;
  const padding = 26;

  const values = rows.map((x) => Number(x[valueKey] || 0));
  const max = Math.max(1, ...values);
  const min = Math.min(0, ...values);
  const range = max - min || 1;
  const hasAnyValue = values.some((value) => value > 0);
  const visibleLabelIndexes = getVisibleLabelIndexes(rows.length, period === '7d' ? 7 : 6);

  const points = rows.map((item, index) => {
    const x =
      rows.length === 1
        ? width / 2
        : padding + (index * (width - padding * 2)) / Math.max(1, rows.length - 1);

    const y =
      height -
      padding -
      ((Number(item[valueKey] || 0) - min) / range) * (height - padding * 2);

    return { x, y, item, index };
  });

  const path = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');

  const area =
    points.length > 1
      ? `${path} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`
      : '';

  const latest = rows.length ? rows[rows.length - 1] : null;

  return (
    <div className="zf-line-chart">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Revenue trend chart"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="zfRevenueGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="rgba(37, 99, 235, .24)" />
            <stop offset="100%" stopColor="rgba(37, 99, 235, 0)" />
          </linearGradient>
        </defs>

        {[0, 1, 2, 3].map((row) => {
          const y = padding + row * ((height - padding * 2) / 3);
          return (
            <line
              key={row}
              x1={padding}
              x2={width - padding}
              y1={y}
              y2={y}
              className="zf-grid-line"
            />
          );
        })}

        {area ? <path d={area} fill="url(#zfRevenueGradient)" /> : null}
        {points.length > 1 ? <path d={path} className="zf-line-path" /> : null}

        {points.length === 1 && hasAnyValue ? (
          <>
            <line
              x1={padding}
              x2={width - padding}
              y1={points[0].y}
              y2={points[0].y}
              className="zf-single-day-line"
            />
            <path
              d={`M ${padding} ${height - padding} L ${padding} ${points[0].y} L ${width - padding} ${points[0].y} L ${width - padding} ${height - padding} Z`}
              fill="url(#zfRevenueGradient)"
            />
          </>
        ) : null}

        {points.map((p) => (
          <g key={p.item.key || p.item.date || p.item[labelKey]}>
            <circle
              cx={p.x}
              cy={p.y}
              r={p.item[valueKey] > 0 ? 5 : 3.5}
              className={p.item[valueKey] > 0 ? 'zf-line-dot' : 'zf-line-dot muted'}
            />
            <title>{`${p.item[labelKey]}: ৳ ${money(p.item[valueKey])}`}</title>
          </g>
        ))}
      </svg>

      {!hasAnyValue ? (
        <div className="zf-chart-empty inside">
          No revenue data for {period === 'today' ? 'today' : 'this period'}.
        </div>
      ) : null}

      {latest ? (
        <div className="zf-latest-chip">
          <span>Latest</span>
          <strong>৳ {money(latest[valueKey])}</strong>
        </div>
      ) : null}

      <div className={`zf-line-labels count-${rows.length}`}>
        {rows.map((item, index) => {
          const showLabel = visibleLabelIndexes.has(index);

          return (
            <span
              key={item.key || item.date || item[labelKey]}
              className={showLabel ? '' : 'is-hidden'}
              title={item[labelKey]}
            >
              {showLabel ? item[labelKey] : ''}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function DonutChart({ items = [], centerLabel = 'Status' }) {
  const rows = safeArray(items).map((item) => ({
    name: item.name || item.label || 'Unknown',
    value: Number(item.value || 0),
  }));
  const total = rows.reduce((sum, item) => sum + item.value, 0);
  let cumulative = 0;
  const radius = 42;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="zf-donut-wrap">
      <div className="zf-donut">
        <svg viewBox="0 0 120 120" role="img" aria-label={`${centerLabel} split`}>
          <circle cx="60" cy="60" r={radius} className="zf-donut-bg" />
          {rows.map((item, index) => {
            const dash = total ? (item.value / total) * circumference : 0;
            const gap = circumference - dash;
            const offset = -cumulative;
            cumulative += dash;
            return (
              <circle
                key={`${item.name}-${index}`}
                cx="60"
                cy="60"
                r={radius}
                className={`zf-donut-seg seg-${index + 1}`}
                strokeDasharray={`${dash} ${gap}`}
                strokeDashoffset={offset}
              />
            );
          })}
        </svg>
        <div className="zf-donut-center">
          <strong>{number(total)}</strong>
          <span>{centerLabel}</span>
        </div>
      </div>
      <div className="zf-donut-list">
        {rows.map((item, index) => (
          <div className="zf-donut-row" key={`${item.name}-${index}`}>
            <span className={`zf-dot seg-${index + 1}`} />
            <span>{String(item.name || '').replace(/_/g, ' ')}</span>
            <strong>{number(item.value)}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProgressLine({ label, value, icon }) {
  return (
    <div className="zf-progress-line">
      <div className="zf-progress-meta">
        <span>{icon}{label}</span>
        <strong>{pct(value)}</strong>
      </div>
      <div className="zf-progress-track">
        <div className="zf-progress-fill" style={{ width: pct(value) }} />
      </div>
    </div>
  );
}

function RecentOrders({ orders = [] }) {
  const rows = safeArray(orders);
  return (
    <div className="zf-table-card">
      <div className="zf-card-head compact">
        <div>
          <h3>Recent Orders</h3>
          <p>Latest order activity for the selected period.</p>
        </div>
      </div>
      <div className="zf-orders-list">
        {rows.length ? rows.map((order) => (
          <div className="zf-order-row" key={order.id || order.orderNumber}>
            <div>
              <strong>{order.orderNumber || 'Order'}</strong>
              <span>{order.customerName || 'Customer'} • {order.date || 'N/A'}</span>
            </div>
            <div className="zf-order-right">
              <strong>৳ {money(order.amount || order.totalAmount || order.requestTotalAmount)}</strong>
              <span className={`zf-status ${statusClass(order.status)}`}>{order.status || 'N/A'}</span>
            </div>
          </div>
        )) : (
          <div className="zf-empty-state">No recent orders found for this period.</div>
        )}
      </div>
    </div>
  );
}

function TopPerformers({ items = [], periodLabel = 'All time' }) {
  const rows = safeArray(items).map((item) => {
    const revenue = Number(item.revenue || 0);
    const collections = Number(item.collections ?? item.collected ?? 0);
    const contribution = Number(item.contribution ?? Math.max(revenue, collections));
    return { ...item, revenue, collections, contribution };
  });
  const max = Math.max(1, ...rows.map((x) => x.contribution));

  return (
    <div className="zf-card zf-performers-card">
      <div className="zf-card-head compact">
        <div>
          <h3>Top Field Performance</h3>
          <p>Revenue and collection contribution • {periodLabel}</p>
        </div>
      </div>

      <div className="zf-performers">
        {rows.length ? rows.map((item, index) => (
          <div className="zf-performer" key={item.userId || item.id || item.name}>
            <div className="zf-rank">{index + 1}</div>
            <div className="zf-performer-main">
              <div className="zf-performer-top">
                <strong>{item.name}</strong>
                <span>৳ {money(item.contribution)}</span>
              </div>
              <div className="zf-performer-bar"><i style={{ width: `${Math.max(7, (item.contribution / max) * 100)}%` }} /></div>
              <div className="zf-performer-sub">
                {number(item.orders)} orders • ৳ {money(item.collections)} collected
              </div>
            </div>
          </div>
        )) : <div className="zf-empty-state">Performance data will appear after field activity.</div>}
      </div>
    </div>
  );
}

const DashboardHome = () => {
  const { user } = useContext(AuthContext);
  const [period, setPeriod] = useState('all');
  const [analytics, setAnalytics] = useState(emptyAnalytics);
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState('');

  const loadDashboard = async (selectedPeriod = period) => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get(`/dashboard/analytics?period=${selectedPeriod}`);
      setAnalytics({ ...emptyAnalytics, ...(res.data || {}) });
    } catch (err) {
      console.error('Error fetching dashboard analytics:', err);
      setError(err?.response?.data?.message || 'Could not load dashboard analytics.');
    } finally {
      setHasLoaded(true);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard(period);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  const data = useMemo(() => ({ ...emptyAnalytics, ...analytics }), [analytics]);
  const overview = data.overview || emptyAnalytics.overview;
  const finance = data.finance || emptyAnalytics.finance;
  const charts = data.charts || emptyAnalytics.charts;
  const trend = safeArray(charts.trend);
  const role = String(user?.role || data.role || '').toUpperCase();
  const periodLabel = data.periodLabel || PERIOD_OPTIONS.find((x) => x.key === period)?.label || 'All time';

  if (loading && !hasLoaded) {
    return (
      <div className="zf-dashboard-page">
        <div className="zf-loading-card">
          <div className="zf-loading-spinner" />
          <strong>Loading dashboard...</strong>
          <span>Preparing charts and business insights</span>
        </div>
      </div>
    );
  }

  return (
    <div className="zf-dashboard-page">
      <div className="zf-hero">
        <div className="zf-hero-content">
          <div className="zf-eyebrow"><FiBarChart2 /> Business Overview</div>
          <h1>Welcome back{user?.name ? `, ${user.name}` : ''}</h1>
          <p>
            Monitor field activity, orders, collections, visits and expenses.
          </p>

          <div className="zf-period-tabs" role="tablist" aria-label="Dashboard period filter">
            {PERIOD_OPTIONS.map((option) => (
              <button
                key={option.key}
                type="button"
                role="tab"
                aria-selected={period === option.key}
                className={period === option.key ? 'active' : ''}
                onClick={() => setPeriod(option.key)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="zf-hero-side">
          <div className="zf-hero-actions">
            <button type="button" onClick={() => loadDashboard(period)} className="zf-refresh-btn" disabled={loading}>
              <FiRefreshCw className={loading ? 'spin' : ''} /> Refresh
            </button>
            <span className="zf-role-pill">{role || 'USER'}</span>
          </div>

          <div className="zf-hero-panel">
            <span>Net Collection</span>
            <strong>৳ {money(finance.netCollection)}</strong>
            <small>{finance.netCollection >= 0 ? <FiArrowUpRight /> : <FiArrowDownRight />} Collection minus expenses</small>
            <div className="zf-hero-split">
              <div><b>Collected</b><em>৳ {money(finance.totalCollected)}</em></div>
              <div><b>Expense</b><em>৳ {money(finance.totalExpenseAmount)}</em></div>
            </div>
          </div>
        </div>
      </div>

      {error ? <div className="zf-error-box">{error}</div> : null}

      <div className="zf-filter-summary">
        <span><FiClock /> Showing: <strong>{periodLabel}</strong></span>
        <span><FiTrendingUp /> Revenue: <strong>৳ {money(finance.totalRevenue)}</strong></span>
        <span><FiCheckCircle /> Completion: <strong>{finance.orderCompletionRate || 0}%</strong></span>
      </div>

      <div className="zf-stat-grid">
        {role !== 'FIELD' ? (
          <StatCard icon={<FiUsers />} label="Users" value={number(overview.totalUsers)} hint={`${periodLabel} user records`} tone="green" />
        ) : null}
        <StatCard icon={<FiUsers />} label="Customers" value={number(overview.totalCustomers)} hint="Customer coverage" tone="blue" />
        <StatCard icon={<FiShoppingCart />} label="Orders" value={number(overview.totalOrders)} hint={`${number(overview.completedOrders)} completed`} tone="indigo" trend={`${finance.orderCompletionRate || 0}%`} />
        <StatCard icon={<FiMapPin />} label="Visits" value={number(overview.totalVisits)} hint={`${number(overview.completedVisits)} completed`} tone="amber" trend={`${finance.visitCompletionRate || 0}%`} />
        <StatCard icon={<FiCreditCard />} label="Collections" value={number(overview.totalCollections)} hint={`${number(overview.approvedCollections)} approved`} tone="emerald" trend={`${finance.collectionRate || 0}%`} />
        <StatCard icon={<FiDollarSign />} label="Expenses" value={number(overview.totalExpenses)} hint={`৳ ${money(finance.totalExpenseAmount)}`} tone="rose" />
      </div>

      <div className="zf-finance-grid">
        <div className="zf-card zf-finance-card">
          <div className="zf-card-head">
            <div>
              <h3>Revenue Trend</h3>
              <p>Order value trend for {String(periodLabel).toLowerCase()}.</p>
            </div>
            <div className="zf-card-total">৳ {money(finance.totalRevenue)}</div>
          </div>
          <LineChart data={trend} valueKey="revenue" period={period} />
        </div>

        <div className="zf-card zf-health-card">
          <div className="zf-card-head compact">
            <div>
              <h3>Business Health</h3>
              <p>Quick performance indicators.</p>
            </div>
          </div>
          <div className="zf-health-number">
            <span>Collection Rate</span>
            <strong>{finance.collectionRate || 0}%</strong>
          </div>
          <ProgressLine label="Order completion" value={finance.orderCompletionRate} icon={<FiCheckCircle />} />
          <ProgressLine label="Visit completion" value={finance.visitCompletionRate} icon={<FiMapPin />} />
          <ProgressLine label="Collection coverage" value={finance.collectionRate} icon={<FiCreditCard />} />
          <div className="zf-money-split">
            <div>
              <span>Collected</span>
              <strong>৳ {money(finance.totalCollected)}</strong>
            </div>
            <div>
              <span>Expense</span>
              <strong>৳ {money(finance.totalExpenseAmount)}</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="zf-chart-grid">
        <div className="zf-card">
          <div className="zf-card-head compact">
            <div>
              <h3>Orders vs Visits</h3>
              <p>Activity volume for the selected period.</p>
            </div>
            <div className="zf-legend"><span className="orders" /> Orders <span className="visits" /> Visits</div>
          </div>
          <MultiBarChart data={trend} />
        </div>

        <div className="zf-card">
          <div className="zf-card-head compact">
            <div>
              <h3>Order Status</h3>
              <p>Pending, completed and cancelled split.</p>
            </div>
          </div>
          <DonutChart items={charts.orderStatus || []} centerLabel="Orders" />
        </div>

        <div className="zf-card">
          <div className="zf-card-head compact">
            <div>
              <h3>Payment Status</h3>
              <p>Collection status against order payments.</p>
            </div>
          </div>
          <DonutChart items={charts.orderPaymentStatus || []} centerLabel="Payments" />
        </div>
      </div>

      <div className="zf-bottom-grid">
        <RecentOrders orders={data.recentOrders || []} />
        {role !== 'FIELD' ? <TopPerformers items={charts.topPerformers || []} periodLabel={periodLabel} /> : (
          <div className="zf-card zf-today-card">
            <div className="zf-card-head compact">
              <div>
                <h3>Field Snapshot</h3>
                <p>Your selected period field progress.</p>
              </div>
            </div>
            <div className="zf-today-list">
              <div><FiClock /><span>Attendance</span><strong>{number(overview.totalAttendance)}</strong></div>
              <div><FiShoppingCart /><span>Orders</span><strong>{number(overview.totalOrders)}</strong></div>
              <div><FiMapPin /><span>Visits</span><strong>{number(overview.totalVisits)}</strong></div>
              <div><FiCreditCard /><span>Collections</span><strong>{number(overview.totalCollections)}</strong></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardHome;
