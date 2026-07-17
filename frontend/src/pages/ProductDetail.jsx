import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api, { errorMessage } from '../api/client';
import { usePoll } from '../hooks/usePoll';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import StockBadge from '../components/StockBadge';

const rupees = (n) => `₹${n.toLocaleString('en-IN')}`;

export default function ProductDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { addItem } = useCart();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get(`/api/products/${id}`);
      setProduct(data.product);
    } catch (err) {
      setError(errorMessage(err, 'Product not found'));
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  // This is the page to have open in the second browser during the race demo:
  // the badge drops to "Out of stock" on its own when the first browser buys.
  usePoll(load, 5000);

  const add = async () => {
    if (!user) return navigate('/login');
    setBusy(true);
    try {
      await addItem(product._id, quantity);
      navigate('/cart');
    } catch (err) {
      setError(errorMessage(err, 'Could not add to cart'));
    } finally {
      setBusy(false);
    }
  };

  if (error) return <div className="container"><div className="error">{error}</div></div>;
  if (!product) return <div className="container muted">Loading…</div>;

  const soldOut = product.stock <= 0;
  const max = Math.max(1, product.stock);

  return (
    <div className="container">
      <p className="muted" style={{ fontSize: '0.85rem' }}>
        <Link to="/">← Back to shop</Link>
      </p>

      <div className="detail">
        <div className="detail__media">
          {product.images?.[0] ? (
            <img src={product.images[0]} alt={product.name} />
          ) : (
            <div className="card__placeholder">{product.name.slice(0, 1)}</div>
          )}
        </div>

        <div>
          <span className="card__category">{product.category}</span>
          <h1>{product.name}</h1>
          {product.vendorId?.name && <p className="muted">Sold by {product.vendorId.name}</p>}

          <p style={{ fontSize: '1.6rem', fontWeight: 800, margin: '0.5rem 0' }}>
            {rupees(product.price)}
          </p>

          <p>
            <StockBadge stock={product.stock} />{' '}
            <span className="muted" style={{ fontSize: '0.8rem' }}>
              <span className="live-dot" />
              live
            </span>
          </p>

          <p className="muted">{product.description}</p>

          <div className="qty" style={{ margin: '1rem 0' }}>
            <button
              className="btn btn--ghost btn--sm"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={soldOut || quantity <= 1}
              aria-label="Decrease quantity"
            >
              −
            </button>
            <span className="qty__value">{quantity}</span>
            <button
              className="btn btn--ghost btn--sm"
              onClick={() => setQuantity((q) => Math.min(max, q + 1))}
              disabled={soldOut || quantity >= max}
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>

          <button className="btn btn--primary btn--block" disabled={soldOut || busy} onClick={add}>
            {soldOut ? 'Out of stock' : busy ? 'Adding…' : 'Add to cart'}
          </button>
        </div>
      </div>
    </div>
  );
}
