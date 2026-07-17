import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { errorMessage } from '../api/client';

/**
 * Closes a hole in the original design: sign-in defaulted everyone to
 * 'customer' with no way to ever become a vendor, which left the entire vendor
 * module unreachable.
 */
export default function RoleSelect() {
  const { chooseRole } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const pick = async (role) => {
    setBusy(true);
    setError(null);
    try {
      await chooseRole(role);
      navigate(role === 'vendor' ? '/vendor' : '/', { replace: true });
    } catch (err) {
      setError(errorMessage(err, 'Could not set your role'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container">
      <div className="auth panel" style={{ maxWidth: 560 }}>
        <h1>How will you use QuickNext?</h1>
        <p className="muted">You can switch at any time.</p>

        {error && <div className="error">{error}</div>}

        <div className="role-grid" style={{ marginTop: '1rem' }}>
          <button className="role-card" disabled={busy} onClick={() => pick('customer')}>
            <h3>I'm shopping</h3>
            <p className="muted" style={{ margin: 0, fontSize: '0.85rem' }}>
              Browse local stock, fill a basket, check out.
            </p>
          </button>

          <button className="role-card" disabled={busy} onClick={() => pick('vendor')}>
            <h3>I'm selling</h3>
            <p className="muted" style={{ margin: 0, fontSize: '0.85rem' }}>
              List products, manage stock, track orders.
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}
