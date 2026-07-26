import '@/styles/globals.css';
import Script from 'next/script';
import { LanguageProvider } from '@/lib/LanguageProvider';

export const metadata = {
  metadataBase: new URL('https://robloxmarket.com'),
  title: {
    default: 'Roblox Studio Marketplace - Buy & Sell Roblox Assets',
    template: '%s | Roblox Studio Marketplace',
  },
  description: 'Upload and sell Roblox Studio assets. Browse VFX, models, scripts, and more. Get your creations to the community.',
  keywords: ['Roblox Studio', 'Roblox assets', 'RBXM', 'RBXL', 'Roblox marketplace', 'Roblox VFX', 'Roblox models'],
  applicationName: 'Roblox Studio Marketplace',
};

export const viewport = {
  themeColor: '#0A0A0A',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta httpEquiv="Content-Security-Policy" content="default-src 'self' blob:; media-src 'self' blob: data:; script-src 'self' 'unsafe-inline' blob:; style-src 'self' 'unsafe-inline' blob:;" />
      </head>
      <body>
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
