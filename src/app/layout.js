import '@/styles/globals.css';
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
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <meta name="mobile-web-app-capable" content="yes" />
        <script dangerouslySetInnerHTML={{
          __html: `
            document.addEventListener('contextmenu', e => e.preventDefault());
            document.addEventListener('copy', e => e.preventDefault());
            document.addEventListener('cut', e => e.preventDefault());
            document.addEventListener('dragstart', e => e.preventDefault());
          `
        }} />
        <script src="https://accounts.google.com/gsi/client" async defer></script>
        <script src="https://www.google.com/recaptcha/api.js" async defer></script>
        <LanguageProvider>{children}</LanguageProvider>
        <PwaRegister />
      </body>
    </html>
  );
}
