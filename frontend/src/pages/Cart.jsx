import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { usePoll } from '../hooks/usePoll';
import { useCheckout } from '../hooks/useCheckout';
import StockBadge from '../components/StockBadge';

const rupees = (n) => `₹${n.toLocaleString('en-IN')}`;

export default function Cart() {
  const { cart, refresh, setQuantity, removeItem, busy } = useCart();
  const { user, config } = useAuth();
  const { checkout, busy: paying, error, setError } = useCheckout({ user });
  const navigate = useNavigate();
  const [placed, setPlaced] = useState(null);

  // The cart shows live stock too, so an item that sells out while it's sitting
  // in the basket is flagged before checkout rather than failing at it.
  usePoll(refresh, 5000);

  const pay = async () => {
    try {
      const order = await checkout();
      setPlaced(order);
      navigate('/orders', { state: { justPlaced: order._id } });
    } catch {
      // useCheckout already surfaced the message; also re-read stock so the
      // reason (someone else took the last one) is visible.
      refresh();
    }
  };

  if (placed) return null;

  if (cart.items.length === 0) {
    return (
      <div className="container">
        <h1>Your basket</h1>
        <div className="panel">
          <p className="muted" style={{ margin: 0 }}>
            Nothing here yet. <Link to="/">Start shopping →</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <h1>Your basket</h1>
      <p className="muted" style={{ fontSize: '0.85rem', marginTop: '-0.25rem' }}>
        Saved to your account — it'll still be here on another device.
      </p>

      {error && <div className="error">{error}</div>}
      {cart.hasIssues && (
        <div className="notice">
          Some items are no longer available and won't be charged. Remove them to continue.
        </div>
      )}

      <div className="split">
        <div className="panel">
          {cart.items.map((item) => (
            <div className="row" key={item.productId}>
              <div className="row__main">
                <div className="row__title">{item.name}</div>
                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                  <span className="muted" style={{ fontSize: '0.85rem' }}>
                    {rupees(item.price)}
                  </span>
                  <StockBadge stock={item.stock} />
                </div>
              </div>

              <div className="qty">
                <button
                  className="btn btn--ghost btn--sm"
                  disabled={busy || item.quantity <= 1}
                  onClick={() => setQuantity(item.productId, item.quantity - 1)}
                  aria-label={`Decrease ${item.name}`}
                >
                  −
                </button>
                <span className="qty__value">{item.quantity}</span>
                <button
                  className="btn btn--ghost btn--sm"
                  disabled={busy || item.quantity >= item.stock}
                  onClick={() => setQuantity(item.productId, item.quantity + 1)}
                  aria-label={`Increase ${item.name}`}
                >
                  +
                </button>
              </div>

              <strong style={{ minWidth: '5ch', textAlign: 'right' }}>
                {rupees(item.lineTotal)}
              </strong>

              <button
                className="btn btn--danger btn--sm"
                disabled={busy}
                onClick={() => removeItem(item.productId)}
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        <aside className="panel">
          <h3>Summary</h3>
          <div className="row" style={{ borderBottom: 0 }}>
            <span className="row__main muted">Subtotal</span>
            <strong style={{ fontSize: '1.25rem' }}>{rupees(cart.subtotal)}</strong>
          </div>

          <button
            className="btn btn--primary btn--block"
            disabled={paying || busy || cart.subtotal <= 0}
            onClick={pay}
          >
            {paying ? 'Processing…' : `Pay ${rupees(cart.subtotal)}`}
          </button>

          <p className="muted" style={{ fontSize: '0.75rem', marginBottom: 0 }}>
            {config.razorpayEnabled
              ? 'Secured by Razorpay (test mode — no real money moves).'
              : 'Simulated payment — no gateway configured.'}
          </p>
        </aside>
      </div>
    </div>
  );
}
