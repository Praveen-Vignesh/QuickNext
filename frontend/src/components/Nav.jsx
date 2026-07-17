import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Nav() {
  const { user, logout, chooseRole } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleToggleRole = async () => {
    const targetRole = user?.role === 'vendor' ? 'customer' : 'vendor';
    try {
      await chooseRole(targetRole);
      navigate(targetRole === 'vendor' ? '/vendor' : '/');
    } catch (err) {
      console.error('Failed to toggle role', err);
    }
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button className="btn btn--ghost btn--sm" onClick={handleToggleRole}>
                Switch to {user.role === 'vendor' ? 'Buyer' : 'Seller'}
              </button>
              <button className="btn btn--ghost btn--sm" onClick={handleLogout}>
                Sign out
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Link className="btn btn--ghost btn--sm" to="/login">
                Sign in
              </Link>
              <Link className="btn btn--primary btn--sm" to="/signup">
                Sign up
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
