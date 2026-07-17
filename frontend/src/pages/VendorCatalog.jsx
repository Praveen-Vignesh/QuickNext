import { useState, useEffect, useCallback } from 'react';
import api, { errorMessage } from '../api/client';
import StockBadge from '../components/StockBadge';

const rupees = (n) => `₹${Number(n).toLocaleString('en-IN')}`;

const BLANK = { name: '', description: '', price: '', category: '', stock: '', images: '' };

export default function VendorCatalog() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(BLANK);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/api/vendor/products');
      setProducts(data.products);
    } catch (err) {
      setError(errorMessage(err, 'Could not load your catalog'));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const reset = () => {
    setForm(BLANK);
    setEditingId(null);
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const payload = {
      name: form.name,
      description: form.description,
      price: Number(form.price),
      category: form.category,
      stock: Number(form.stock),
      // Comma-separated URLs. No upload service wired up — paste a link.
      images: form.images
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    };

    try {
      if (editingId) await api.put(`/api/vendor/products/${editingId}`, payload);
      else await api.post('/api/vendor/products', payload);
      reset();
      await load();
    } catch (err) {
      setError(errorMessage(err, 'Could not save that product'));
    } finally {
      setBusy(false);
    }
  };

  const edit = (product) => {
    setEditingId(product._id);
    setForm({
      name: product.name,
      description: product.description ?? '',
      price: String(product.price),
      category: product.category,
      stock: String(product.stock),
      images: (product.images ?? []).join(', '),
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const remove = async (id) => {
    if (!window.confirm('Remove this listing from the shop?')) return;
    try {
      await api.delete(`/api/vendor/products/${id}`);
      await load();
    } catch (err) {
      setError(errorMessage(err, 'Could not remove that product'));
    }
  };

  return (
    <div className="container">
      <h1>My catalog</h1>

      {error && <div className="error">{error}</div>}

      <div className="split">
        <div className="panel">
          <h3>{products.length} live listing{products.length === 1 ? '' : 's'}</h3>
          {products.length === 0 ? (
            <p className="muted">Nothing listed yet. Add your first product →</p>
          ) : (
            products.map((product) => (
              <div className="row" key={product._id}>
                <div className="row__main">
                  <div className="row__title">{product.name}</div>
                  <span className="muted" style={{ fontSize: '0.8rem' }}>
                    {product.category} · {rupees(product.price)}
                  </span>
                </div>
                <StockBadge stock={product.stock} />
                <button className="btn btn--ghost btn--sm" onClick={() => edit(product)}>
                  Edit
                </button>
                <button className="btn btn--danger btn--sm" onClick={() => remove(product._id)}>
                  Remove
                </button>
              </div>
            ))
          )}
        </div>

        <aside className="panel">
          <h3>{editingId ? 'Edit listing' : 'Add a product'}</h3>
          <form onSubmit={submit}>
            <div className="field">
              <label htmlFor="name">Name</label>
              <input id="name" className="input" value={form.name} onChange={set('name')} required />
            </div>

            <div className="field">
              <label htmlFor="category">Category</label>
              <input
                id="category"
                className="input"
                value={form.category}
                onChange={set('category')}
                placeholder="Groceries, Bakery…"
                required
              />
            </div>

            <div className="field">
              <label htmlFor="price">Price (₹)</label>
              <input
                id="price"
                className="input"
                type="number"
                min="0"
                step="1"
                value={form.price}
                onChange={set('price')}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="stock">Stock</label>
              <input
                id="stock"
                className="input"
                type="number"
                min="0"
                step="1"
                value={form.stock}
                onChange={set('stock')}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="images">Image URLs (comma separated)</label>
              <input
                id="images"
                className="input"
                value={form.images}
                onChange={set('images')}
                placeholder="https://…"
              />
            </div>

            <div className="field">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                className="input"
                rows="3"
                value={form.description}
                onChange={set('description')}
              />
            </div>

            <button className="btn btn--primary btn--block" disabled={busy}>
              {busy ? 'Saving…' : editingId ? 'Save changes' : 'Add product'}
            </button>

            {editingId && (
              <button type="button" className="btn btn--ghost btn--block" onClick={reset} style={{ marginTop: '0.4rem' }}>
                Cancel
              </button>
            )}
          </form>
        </aside>
      </div>
    </div>
  );
}
