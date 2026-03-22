import '@/styles/globals.css';
import type { Metadata } from 'next';
import { ToastProvider } from '@/components/shared/Toast';

export const metadata: Metadata = {
  title: 'Copalite',
  description: 'Platform for software discovery, mapping and validation',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
