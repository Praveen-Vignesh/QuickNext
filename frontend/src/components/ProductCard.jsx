import { Link } from 'react-router-dom';
import StockBadge from './StockBadge';

const rupees = (n) => `₹${n.toLocaleString('en-IN')}`;

export default function ProductCard({ product, onAdd, adding }) {
  const soldOut = product.stock <= 0;

  return (
    <article className="card">
      <Link to={`/product/${product._id}`} className="card__media">
        {product.images?.[0] ? (
          <img src={product.images[0]} alt={product.name} loading="lazy" />
        ) : (
          <div className="card__placeholder" aria-hidden="true">
            {product.name.slice(0, 1)}
          </div>
        )}
      </Link>

      <div className="card__body">
        <span className="card__category">{product.category}</span>
        <Link to={`/product/${product._id}`} className="card__title">
          {product.name}
        </Link>
        {product.vendorId?.name && <span className="card__vendor">{product.vendorId.name}</span>}

        <div className="card__footer">
          <strong className="card__price">{rupees(product.price)}</strong>
          <StockBadge stock={product.stock} />
        </div>

        <button
          className="btn btn--primary btn--block"
          disabled={soldOut || adding}
          onClick={() => onAdd(product._id)}
        >
          {soldOut ? 'Out of stock' : adding ? 'Adding…' : 'Add to cart'}
        </button>
      </div>
    </article>
  );
}
