import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Nav() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="nav">
      <div className="nav__inner">
        <Link to="/" className="nav__brand">
          Quick<span>Next</span>
        </Link>

        <nav className="nav__links">
          <NavLink to="/" end>
            Shop
          </NavLink>

          {user?.role === 'vendor' && (
            <>
              <NavLink to="/vendor">Dashboard</NavLink>
              <NavLink to="/vendor/catalog">My catalog</NavLink>
            </>
          )}

          {user && <NavLink to="/orders">Orders</NavLink>}

          <NavLink to="/cart" className="nav__cart">
            Cart
            {count > 0 && <span className="nav__count">{count}</span>}
          </NavLink>

          {user ? (
            <button className="btn btn--ghost" onClick={handleLogout}>
              Sign out
            </button>
          ) : (
            <Link className="btn btn--primary" to="/login">
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
