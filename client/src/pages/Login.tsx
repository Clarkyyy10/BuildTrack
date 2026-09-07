import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth.js';
import { Button, Card } from '../components/ui.js';
import { ApiError } from '../lib/api.js';
import { AuthLayout } from './AuthLayout.js';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('clark@buildtrack.test');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not sign in.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to continue to BuildTrack.">
      <form onSubmit={submit}>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
        </div>
        {error && <Card padding="10px 14px" style={{ background: 'var(--error-soft)', border: '1px solid var(--error)', color: 'var(--error)', marginBottom: 16, fontSize: '0.88rem' }}>{error}</Card>}
        <Button type="submit" disabled={busy} style={{ width: '100%' }}>{busy ? 'Signing in…' : 'Sign in'}</Button>
      </form>
      <p className="muted" style={{ textAlign: 'center', marginTop: 18, fontSize: '0.88rem' }}>
        New here? <Link to="/signup">Create an account</Link>
      </p>
      <p className="muted" style={{ textAlign: 'center', marginTop: 8, fontSize: '0.78rem' }}>
        Demo: clark@buildtrack.test / password123
      </p>
    </AuthLayout>
  );
}
