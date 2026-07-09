import '@/styles/globals.css';
import { LanguageProvider } from '@/lib/LanguageProvider';

export const metadata = {
  title: 'NexBlox - Buy & Sell Roblox Limiteds',
  description: 'Verified sellers, live RAP tracking, and instant payouts. Your experience, our pleasure.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
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
      </body>
    </html>
  );
}
