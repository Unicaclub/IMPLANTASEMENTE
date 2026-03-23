import '@/styles/globals.css';
import type { Metadata } from 'next';
import { ToastProvider } from '@/components/shared/Toast';

export const metadata: Metadata = {
  title: 'Copalite — Software Discovery Platform',
  description: 'Map, analyze and validate software systems with AI agents. 9 specialized agents, multi-provider AI, automatic discovery.',
  icons: {
    icon: '/favicon.svg',
  },
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
