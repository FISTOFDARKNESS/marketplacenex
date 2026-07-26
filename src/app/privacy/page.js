export default function PrivacyPage() {
  return (
    <>
      <main style={{ maxWidth: 720, margin: '48px auto', padding: '0 24px' }}>
        <h1 style={{ fontSize: 28, marginBottom: 24 }}>Privacy Policy</h1>
        <div style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.8 }}>
          <p style={{ marginBottom: 16 }}>This Privacy Policy describes how NexBlox Asset Marketplace collects, uses, and protects your information when you use our Service.</p>

          <h2 style={{ fontSize: 18, marginBottom: 12, color: 'var(--text)' }}>1. Information We Collect</h2>
          <p style={{ marginBottom: 16 }}>We collect information you provide directly, including your username, email (if you registered via Google), profile details, and the assets you upload.</p>

          <h2 style={{ fontSize: 18, marginBottom: 12, color: 'var(--text)' }}>2. Roblox Data</h2>
          <p style={{ marginBottom: 16 }}>When you verify your account, we may receive limited profile information from Roblox (such as your username and avatar URL). We do not store your Roblox password or any sensitive Roblox tokens.</p>

          <h2 style={{ fontSize: 18, marginBottom: 12, color: 'var(--text)' }}>3. Cookies</h2>
          <p style={{ marginBottom: 16 }}>We use cookies to maintain your session and remember your preferences. By using the Service, you consent to the use of cookies.</p>

          <h2 style={{ fontSize: 18, marginBottom: 12, color: 'var(--text)' }}>4. Data Storage</h2>
          <p style={{ marginBottom: 16 }}>Your data is stored on secure servers. Assets you upload are stored via Supabase Storage and associated with your account.</p>

          <h2 style={{ fontSize: 18, marginBottom: 12, color: 'var(--text)' }}>5. Third-Party Services</h2>
          <p style={{ marginBottom: 16 }}>We use Supabase for database and storage, Vercel for hosting, and Roblox APIs for gamepass verification. These third parties have their own privacy policies.</p>

          <h2 style={{ fontSize: 18, marginBottom: 12, color: 'var(--text)' }}>6. Contact</h2>
          <p>For privacy-related questions, contact us via our <a href="/contact" style={{ color: 'var(--gold)' }}>contact page</a>.</p>
        </div>
      </main>
    </>
  );
}