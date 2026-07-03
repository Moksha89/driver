'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthProvider';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { state, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (state === 'unauthenticated') {
      router.replace('/login');
    }
  }, [router, state]);

  if (state === 'loading') {
    return <div style={{ padding: 24 }}>Loading...</div>;
  }

  if (!user) {
    return <div style={{ padding: 24 }}>Redirecting to login...</div>;
  }

  return <>{children}</>;
}
