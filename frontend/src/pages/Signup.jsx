import { useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GoogleLoginButton from '../components/GoogleLoginButton';
import { errorMessage } from '../api/client';

export default function Signup() {
  const { signUp, loginWithGoogle, config } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  // New accounts always have roleSelected:false, so they land on the role picker.
  const goNext = (user) => navigate(user.roleSelected ? '/' : '/role', { replace: true });

  const submit = async (e) => {
    e.preventDefault();
    setError(null);

    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setBusy(true);
    try {
      goNext(await signUp(form));
    } catch (err) {
      setError(errorMessage(err, 'Could not create your account'));
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = useCallback(
    async (credential) => {
      setError(null);
      try {
        // Google is find-or-create, so the same call covers signup and sign-in.
        goNext(await loginWithGoogle(credential));
      } catch (err) {
        setError(errorMessage(err, 'Google sign-up failed'));
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [loginWithGoogle]
  );

  return (
    <div className="container">
      <div className="auth panel">
        <h1>Create your account</h1>
        <p className="muted">Shop your neighbourhood, or start selling in minutes.</p>

        {error && <div className="error">{error}</div>}

        <form onSubmit={submit}>
          <div className="field">
            <label htmlFor="name">Full name</label>
            <input
              id="name"
              className="input"
              autoComplete="name"
              value={form.name}
              onChange={set('name')}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              className="input"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={set('email')}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              className="input"
              type="password"
              autoComplete="new-password"
              minLength={8}
              value={form.password}
              onChange={set('password')}
              required
            />
            <span className="muted" style={{ fontSize: '0.72rem' }}>
              At least 8 characters.
            </span>
          </div>

          <button className="btn btn--primary btn--block" disabled={busy}>
            {busy ? 'Creating account…' : 'Create account'}
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

        <p className="muted" style={{ marginTop: '1.25rem', fontSize: '0.85rem' }}>
          Already have an account? <Link to="/login"><strong>Sign in</strong></Link>
        </p>
      </div>
    </div>
  );
}
