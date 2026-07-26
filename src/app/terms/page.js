export default function TermsPage() {
  return (
    <>
      <main style={{ maxWidth: 720, margin: '48px auto', padding: '0 24px' }}>
        <h1 style={{ fontSize: 28, marginBottom: 24 }}>Terms of Service</h1>
        <div style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.8 }}>
          <p style={{ marginBottom: 16 }}>By accessing and using the NexBlox Asset Marketplace, you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you may not use the Service.</p>

          <h2 style={{ fontSize: 18, marginBottom: 12, color: 'var(--text)' }}>1. Asset Upload and Responsibility</h2>
          <p style={{ marginBottom: 16 }}>Users are solely responsible for the content they upload. You must have the right, copyright, and permissions to distribute any asset you submit. Prohibited content includes copyrighted material without permission, malicious files, and content that violates Roblox Community Standards.</p>

          <h2 style={{ fontSize: 18, marginBottom: 12, color: 'var(--text)' }}>2. Moderation</h2>
          <p style={{ marginBottom: 16 }}>All uploads go through an admin review queue before being approved. We reserve the right to reject, remove, or take down any asset at our discretion for any reason.</p>

          <h2 style={{ fontSize: 18, marginBottom: 12, color: 'var(--text)' }}>3. Purchases</h2>
          <p style={{ marginBottom: 16 }}>Some assets may require Robux to purchase. Purchases are processed through Roblox Gamepasses. We do not handle Robux transactions directly and are not responsible for any issues with your Roblox transactions.</p>

          <h2 style={{ fontSize: 18, marginBottom: 12, color: 'var(--text)' }}>4. User Conduct</h2>
          <p style={{ marginBottom: 16 }}>You agree not to: spam, harass other users, abuse the reporting system, attempt to circumvent moderation, or use the Service for any illegal purpose.</p>

          <h2 style={{ fontSize: 18, marginBottom: 12, color: 'var(--text)' }}>5. Disclaimer</h2>
          <p style={{ marginBottom: 16 }}>The Service is provided as is without warranties of any kind. We are not liable for any damages arising from the use of the Service.</p>

          <h2 style={{ fontSize: 18, marginBottom: 12, color: 'var(--text)' }}>6. Changes</h2>
          <p>We reserve the right to modify these Terms at any time. Changes will be effective immediately upon posting.</p>
        </div>
      </main>
    </>
  );
}