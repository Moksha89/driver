'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../auth/AuthProvider';
import styles from './AppShell.module.css';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout, message } = useAuth();

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div>
          <div className={styles.brand}>Fleet Safety</div>
          <div className={styles.subtitle}>Admin Dashboard</div>
        </div>

        <nav className={styles.nav}>
          <Link className={pathname === '/dashboard' ? styles.activeLink : styles.link} href="/dashboard">
            Dashboard
          </Link>
        </nav>

        <div className={styles.userBox}>
          <div className={styles.userName}>{user?.name ?? 'Signed in'}</div>
          <div className={styles.userMeta}>{user?.phone}</div>
          <button className={styles.logoutButton} onClick={logout} type="button">
            Logout
          </button>
        </div>
      </aside>

      <main className={styles.main}>
        {message ? <div className={styles.banner}>{message}</div> : null}
        {children}
      </main>
    </div>
  );
}
