/**
 * Live stock indicator. The number is refreshed by the caller's poll, so it
 * ticks down on its own when someone else buys — no reload needed.
 */
export default function StockBadge({ stock, lowThreshold = 5 }) {
  if (stock <= 0) return <span className="badge badge--out">Out of stock</span>;
  if (stock <= lowThreshold) {
    return <span className="badge badge--low">Only {stock} left</span>;
  }
  return <span className="badge badge--in">{stock} in stock</span>;
}
