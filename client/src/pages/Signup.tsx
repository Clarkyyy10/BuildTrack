import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth.js';
import { Button, Card } from '../components/ui.js';
import { ApiError } from '../lib/api.js';
import { AuthLayout } from './AuthLayout.js';

export function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await signup(displayName, email, password);
      navigate('/');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create account.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout title="Create your account" subtitle="Start tracking your construction projects.">
      <form onSubmit={submit}>
        <div className="field">
          <label htmlFor="name">Full name</label>
          <input id="name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required autoComplete="name" />
        </div>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} autoComplete="new-password" />
          <p className="muted" style={{ fontSize: '0.78rem', marginTop: 6 }}>At least 8 characters.</p>
        </div>
        {error && <Card padding="10px 14px" style={{ background: 'var(--error-soft)', border: '1px solid var(--error)', color: 'var(--error)', marginBottom: 16, fontSize: '0.88rem' }}>{error}</Card>}
        <Button type="submit" disabled={busy} style={{ width: '100%' }}>{busy ? 'Creating…' : 'Create account'}</Button>
      </form>
      <p className="muted" style={{ textAlign: 'center', marginTop: 18, fontSize: '0.88rem' }}>
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </AuthLayout>
  );
}
