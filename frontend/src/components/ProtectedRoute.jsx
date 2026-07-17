import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, vendorOnly = false }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="container muted">Loading…</div>;

  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;

  // Anyone who hasn't picked a role yet gets sent to pick one first.
  if (!user.roleSelected) return <Navigate to="/role" replace />;

  if (vendorOnly && user.role !== 'vendor') {
    return (
      <div className="container">
        <h2>Vendors only</h2>
        <p className="muted">
          You're signed in as a customer. Switch to a vendor account from the menu to manage a
          store.
        </p>
      </div>
    );
  }

  return children;
}
