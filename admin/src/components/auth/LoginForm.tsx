'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthProvider';
import styles from './LoginForm.module.css';

export function LoginForm() {
  const router = useRouter();
  const { login, message } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(message);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setError(message);
  }, [message]);

  return (
    <div className={styles.page}>
      <form
        className={styles.card}
        onSubmit={async (event) => {
          event.preventDefault();
          setLoading(true);
          setError(null);
          try {
            await login(phone, password);
            router.replace('/dashboard');
          } catch (caught) {
            setError(caught instanceof Error ? caught.message : 'Login failed');
          } finally {
            setLoading(false);
          }
        }}
      >
        <h1>Admin Login</h1>
        <p>Sign in with an ADMIN or DISPATCHER account.</p>

        <label className={styles.field}>
          <span>Phone</span>
          <input value={phone} onChange={(event) => setPhone(event.target.value)} type="tel" required />
        </label>

        <label className={styles.field}>
          <span>Password</span>
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            required
          />
        </label>

        {error ? <div className={styles.error}>{error}</div> : null}

        <button type="submit" disabled={loading}>
          {loading ? 'Signing in…' : 'Login'}
        </button>
      </form>
    </div>
  );
}
