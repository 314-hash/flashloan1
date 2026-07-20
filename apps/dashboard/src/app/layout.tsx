import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FlashLoan AI — Arbitrage Dashboard',
  description: 'Real-time multi-chain flash loan arbitrage monitoring and control panel.',
  keywords: ['flash loan', 'arbitrage', 'DeFi', 'ethereum', 'arbitrum'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="bg-grid antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
