import '@/styles/globals.css';
import Script from 'next/script';
import { LanguageProvider } from '@/lib/LanguageProvider';
import PwaRegister from '@/components/PwaRegister';

export const metadata = {
  metadataBase: new URL('https://nexblox.com'),
  title: {
    default: 'NexBlox - Buy & Sell Roblox Limiteds',
    template: '%s | NexBlox',
  },
  description: 'Verified sellers, live RAP tracking, and instant payouts. Trade Roblox limiteds safely with admin-verified transactions on NexBlox.',
  keywords: ['Roblox limiteds', 'Roblox trading', 'buy Roblox items', 'sell Roblox limiteds', 'Roblox marketplace', 'RAP tracking'],
  applicationName: 'NexBlox',
  manifest: '/manifest.json',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: '/',
    languages: {
      en: '/',
      'pt-BR': '/',
      it: '/',
      es: '/',
      fr: '/',
      de: '/',
    },
  },
  openGraph: {
    type: 'website',
    url: 'https://nexblox.com',
    siteName: 'NexBlox',
    title: 'NexBlox - Buy & Sell Roblox Limiteds',
    description: 'Verified sellers, live RAP tracking, and instant payouts. Trade Roblox limiteds safely with admin-verified transactions.',
    locale: 'en_US',
    images: [
      {
        url: '/icon.svg',
        width: 512,
        height: 512,
        alt: 'NexBlox',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NexBlox - Buy & Sell Roblox Limiteds',
    description: 'Verified sellers, live RAP tracking, and instant payouts. Trade Roblox limiteds safely.',
    images: ['/icon.svg'],
  },
  appleWebApp: {
    capable: false,
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
        <meta name="mobile-web-app-capable" content="yes" />
        <Script id="disable-context-menu" strategy="afterInteractive">{`
          document.addEventListener('contextmenu', e => e.preventDefault());
          document.addEventListener('copy', e => e.preventDefault());
          document.addEventListener('cut', e => e.preventDefault());
          document.addEventListener('dragstart', e => e.preventDefault());
        `}</Script>
        <LanguageProvider>{children}</LanguageProvider>
        <PwaRegister />
        {/* Google Identity Services loads after hydration (used by the auth modal).
            reCAPTCHA is loaded on-demand inside the modal to avoid its cross-origin
            frame SecurityError on every page load. */}
        <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />
      </body>
    </html>
  );
}
