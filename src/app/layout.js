import '@/styles/globals.css';
import Script from 'next/script';
import { LanguageProvider } from '@/lib/LanguageProvider';
import PwaRegister from '@/components/PwaRegister';

export const metadata = {
  title: 'NexBlox - Buy & Sell Roblox Limiteds',
  description: 'Verified sellers, live RAP tracking, and instant payouts. Your experience, our pleasure.',
  manifest: '/manifest.json',
  applicationName: 'NexBlox',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'NexBlox',
  },
  icons: {
    icon: '/icon.svg',
    apple: '/apple-touch-icon.png',
  },
};

export const viewport = {
  themeColor: '#0A0A0A',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Script id="disable-context-menu" strategy="afterInteractive">{`
          document.addEventListener('contextmenu', e => e.preventDefault());
          document.addEventListener('copy', e => e.preventDefault());
          document.addEventListener('cut', e => e.preventDefault());
          document.addEventListener('dragstart', e => e.preventDefault());
        `}</Script>
        <LanguageProvider>{children}</LanguageProvider>
        <PwaRegister />
        {/* Third-party scripts load after hydration to avoid blocking the main thread and COOP postMessage errors */}
        <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />
        <Script
          src="https://www.google.com/recaptcha/api.js"
          strategy="afterInteractive"
          async
          defer
        />
      </body>
    </html>
  );
}
