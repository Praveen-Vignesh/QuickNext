import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { errorMessage } from '../api/client';
import { usePoll } from '../hooks/usePoll';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import ProductCard from '../components/ProductCard';

export default function Catalog() {
  const { user } = useAuth();
  const { addItem } = useCart();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState(null);

  useEffect(() => {
    api
      .get('/api/products/categories')
      .then((res) => setCategories(res.data.categories))
      .catch(() => {});
  }, []);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/api/products', {
        params: { search: search || undefined, category: category || undefined, limit: 24 },
      });
      setProducts(data.items);
      setError(null);
    } catch (err) {
      setError(errorMessage(err, 'Could not load the catalog'));
    } finally {
      setLoading(false);
    }
  }, [search, category]);

  // Debounce the search box so each keystroke isn't a request.
  useEffect(() => {
    const id = setTimeout(load, 250);
    return () => clearTimeout(id);
  }, [load]);

  // The "real-time stock indicator" the brief asks for: re-read every 5s so a
  // purchase in another browser ticks these numbers down without a refresh.
  usePoll(load, 5000);

  const handleAdd = async (productId) => {
    if (!user) return navigate('/login');
    setAddingId(productId);
    try {
      await addItem(productId, 1);
      await load(); // reflect any stock change immediately
    } catch (err) {
      setError(errorMessage(err, 'Could not add to cart'));
    } finally {
      setAddingId(null);
    }
  };

  return (
    <div className="container">
      <div className="page-head">
        <div>
          <h1>Shop your neighbourhood</h1>
          <p className="muted" style={{ margin: 0, fontSize: '0.85rem' }}>
            <span className="live-dot" />
            Stock updates live
          </p>
        </div>
      </div>

      <div className="toolbar">
        <input
          className="input"
          placeholder="Search products…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search products"
        />
        <select
          className="select"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          aria-label="Filter by category"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {error && <div className="error">{error}</div>}

      {loading ? (
        <p className="muted">Loading…</p>
      ) : products.length === 0 ? (
        <div className="panel">
          <p className="muted" style={{ margin: 0 }}>
            No products match. Try a different search or category.
          </p>
        </div>
      ) : (
        <div className="grid">
          {products.map((product) => (
            <ProductCard
              key={product._id}
              product={product}
              onAdd={handleAdd}
              adding={addingId === product._id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
