import { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import api, { errorMessage } from '../api/client';

const rupees = (n) => `₹${n.toLocaleString('en-IN')}`;

const STATUS_LABEL = {
  pending_payment: 'Awaiting payment',
  paid: 'Paid',
  processing: 'Being prepared',
  completed: 'Delivered',
  cancelled: 'Cancelled',
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const justPlaced = location.state?.justPlaced;

  useEffect(() => {
    api
      .get('/api/orders/mine')
      .then((res) => setOrders(res.data.orders))
      .catch((err) => setError(errorMessage(err, 'Could not load your orders')))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="container muted">Loading…</div>;

  return (
    <div className="container">
      <h1>Your orders</h1>

      {justPlaced && <div className="notice">Order placed. Thanks for shopping local!</div>}
      {error && <div className="error">{error}</div>}

      {orders.length === 0 ? (
        <div className="panel">
          <p className="muted" style={{ margin: 0 }}>
            No orders yet. <Link to="/">Find something →</Link>
          </p>
        </div>
      ) : (
        orders.map((order) => (
          <div
            className="panel"
            key={order._id}
            style={{ marginBottom: '0.75rem', outline: order._id === justPlaced ? '2px solid var(--green)' : 'none' }}
          >
            <div className="page-head" style={{ marginBottom: '0.5rem' }}>
              <div>
                <strong>{rupees(order.totalAmount)}</strong>
                <span className="muted" style={{ fontSize: '0.8rem', marginLeft: '0.5rem' }}>
                  {new Date(order.createdAt).toLocaleString('en-IN')}
                </span>
              </div>
              <span className="chip">{STATUS_LABEL[order.status] ?? order.status}</span>
            </div>

            {order.items.map((item) => (
              <div className="row" key={item.productId}>
                <span className="row__main">
                  {item.name} <span className="muted">× {item.quantity}</span>
                </span>
                <span>{rupees(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  );
}
