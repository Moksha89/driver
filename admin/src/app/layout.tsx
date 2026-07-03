import './globals.css';
import 'leaflet/dist/leaflet.css';
import type { Metadata } from 'next';
import { AuthProvider } from '@/components/auth/AuthProvider';

export const metadata: Metadata = {
  title: 'Fleet Safety Admin',
  description: 'Fleet safety and driver operations dashboard',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
