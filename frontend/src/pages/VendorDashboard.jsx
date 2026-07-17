import { useState, useEffect, useCallback } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import api, { errorMessage } from '../api/client';
import { usePoll } from '../hooks/usePoll';

const rupees = (n) => `₹${Number(n).toLocaleString('en-IN')}`;

const STATUS_COLOR = {
  paid: '#2f6f4f',
  processing: '#b54708',
  completed: '#12b76a',
  cancelled: '#b42318',
  pending_payment: '#98a2b3',
};

const NEXT_ACTION = {
  paid: { to: 'processing', label: 'Start preparing' },
  processing: { to: 'completed', label: 'Mark delivered' },
};

export default function VendorDashboard() {
  const [data, setData] = useState(null);
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    try {
      const [dash, ord] = await Promise.all([
        api.get('/api/vendor/dashboard'),
        api.get('/api/vendor/orders'),
      ]);
      setData(dash.data);
      setOrders(ord.data.orders);
      setError(null);
    } catch (err) {
      setError(errorMessage(err, 'Could not load the dashboard'));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Orders land here from other people's browsers, so the feed refreshes itself.
  usePoll(load, 5000);

  const advance = async (orderId, status) => {
    setBusyId(orderId);
    try {
      await api.patch(`/api/vendor/orders/${orderId}/status`, { status });
      await load();
    } catch (err) {
      setError(errorMessage(err, 'Could not update that order'));
    } finally {
      setBusyId(null);
    }
  };

  if (!data) return <div className="container muted">Loading…</div>;

  const { summary, series, byStatus } = data;
  const pie = byStatus
    .filter((row) => row.orders > 0)
    .map((row) => ({ name: row.status.replace('_', ' '), value: row.orders, status: row.status }));

  return (
    <div className="container">
      <div className="page-head">
        <div>
          <h1>Store insights</h1>
          <p className="muted" style={{ margin: 0, fontSize: '0.85rem' }}>
            <span className="live-dot" />
            Updating live
          </p>
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      {/* The three figures the brief names, in its own words. */}
      <div className="stats">
        <div className="stat">
          <div className="stat__label">Gross order total</div>
          <div className="stat__value">{rupees(summary.grossRevenue)}</div>
          <div className="stat__sub">{summary.grossOrders} orders</div>
        </div>
        <div className="stat">
          <div className="stat__label">Active pipeline</div>
          <div className="stat__value">{summary.activeOrders}</div>
          <div className="stat__sub">{rupees(summary.activeRevenue)} in progress</div>
        </div>
        <div className="stat">
          <div className="stat__label">Completed</div>
          <div className="stat__value">{summary.completedOrders}</div>
          <div className="stat__sub">{rupees(summary.completedRevenue)} delivered</div>
        </div>
        <div className="stat">
          <div className="stat__label">Live listings</div>
          <div className="stat__value">{summary.activeListings}</div>
          <div className="stat__sub">{summary.unitsSold} units sold</div>
        </div>
      </div>

      <div className="split">
        <div className="panel">
          <h3>Revenue, last 7 days</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={series} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                tickFormatter={(d) => new Date(d).toLocaleDateString('en-IN', { weekday: 'short' })}
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                formatter={(value) => [rupees(value), 'Revenue']}
                labelFormatter={(d) => new Date(d).toLocaleDateString('en-IN')}
              />
              <Bar dataKey="revenue" fill="#2f6f4f" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="panel">
          <h3>Order pipeline</h3>
          {pie.length === 0 ? (
            <p className="muted">No orders yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={pie} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80}>
                  {pie.map((entry) => (
                    <Cell key={entry.status} fill={STATUS_COLOR[entry.status] ?? '#98a2b3'} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={32} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="panel" style={{ marginTop: '1rem' }}>
        <h3>Incoming orders</h3>
        {orders.length === 0 ? (
          <p className="muted">Nothing yet. Orders appear here the moment a customer pays.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Your total</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const action = NEXT_ACTION[order.status];
                  return (
                    <tr key={order._id}>
                      <td data-label="Customer">{order.customer?.name ?? '—'}</td>
                      <td data-label="Items">
                        {order.items.map((i) => `${i.name} ×${i.quantity}`).join(', ')}
                      </td>
                      <td data-label="Total">{rupees(order.vendorTotal)}</td>
                      <td data-label="Status">
                        <span className="chip">{order.status.replace('_', ' ')}</span>
                      </td>
                      <td data-label="Action">
                        {action && (
                          <button
                            className="btn btn--ghost btn--sm"
                            disabled={busyId === order._id}
                            onClick={() => advance(order._id, action.to)}
                          >
                            {action.label}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
