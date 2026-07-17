import { useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GoogleLoginButton from '../components/GoogleLoginButton';
import { errorMessage } from '../api/client';

// Surfaced right on the login screen on purpose: a judge must be able to see
// both the customer and the vendor experience without owning two Google
// accounts. One click each.
const DEMO_ACCOUNTS = [
  { email: 'customer@quicknext.demo', label: 'Customer', hint: 'browse, cart, checkout' },
  { email: 'vendor@quicknext.demo', label: 'Vendor', hint: 'catalog + dashboard' },
  { email: 'vendor2@quicknext.demo', label: 'Vendor 2', hint: 'second store' },
];
const DEMO_PASSWORD = 'demo1234';

export default function Login() {
  const { loginWithPassword, loginWithGoogle, config } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const goNext = (user) => {
    const from = location.state?.from;
    if (!user.roleSelected) return navigate('/role', { replace: true });
    navigate(from || (user.role === 'vendor' ? '/vendor' : '/'), { replace: true });
  };

  const submit = async (e, creds) => {
    e?.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const user = await loginWithPassword(creds?.email ?? email, creds?.password ?? password);
      goNext(user);
    } catch (err) {
      setError(errorMessage(err, 'Sign-in failed'));
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = useCallback(
    async (credential) => {
      setError(null);
      try {
        goNext(await loginWithGoogle(credential));
      } catch (err) {
        setError(errorMessage(err, 'Google sign-in failed'));
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [loginWithGoogle]
  );

  return (
    <div className="container">
      <div className="auth panel">
        <h1>Sign in</h1>
        <p className="muted">Welcome back to your neighbourhood marketplace.</p>

        {error && <div className="error">{error}</div>}

        <form onSubmit={submit}>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              className="input"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              className="input"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button className="btn btn--primary btn--block" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        {config.googleEnabled && (
          <>
            <div className="divider">or</div>
            <GoogleLoginButton
              clientId={config.googleClientId}
              onCredential={handleGoogle}
              onError={setError}
            />
          </>
        )}

        <div className="divider">demo accounts</div>
        <div className="demo-list">
          {DEMO_ACCOUNTS.map((account) => (
            <button
              key={account.email}
              className="demo-btn"
              disabled={busy}
              onClick={() => submit(null, { email: account.email, password: DEMO_PASSWORD })}
            >
              <span>
                <strong>{account.label}</strong>
                <br />
                <span className="muted">{account.hint}</span>
              </span>
              <span className="chip">one click</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
