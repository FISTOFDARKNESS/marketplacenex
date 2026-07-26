'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Toast from '@/components/Toast';
import { Send, Mail, MessageCircle } from 'lucide-react';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [toasts, setToasts] = useState([]);

  const addToast = (icon, message) => {
    const t = Date.now();
    setToasts(prev => [...prev, { id: t, icon, message }]);
  };
  const removeToast = (tid) => setToasts(prev => prev.filter(t => t.id !== tid));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !message.trim()) {
      addToast('alert-triangle', 'Name and message are required');
      return;
    }
    setSending(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), message: message.trim() }),
      });
      const d = await res.json();
      if (d.success) {
        addToast('check-circle', 'Message sent! We will get back to you soon.');
        setName('');
        setEmail('');
        setMessage('');
      } else {
        addToast('alert-triangle', d.error || 'Failed to send');
      }
    } catch {
      addToast('alert-triangle', 'Network error. Try again.');
    }
    setSending(false);
  };

  return (
    <>
      <Navbar user={null} onOpenAuth={() => {}} onLogout={() => {}} onScrollTo={() => {}} />
      <main style={{ maxWidth: 720, margin: '48px auto', padding: '0 24px' }}>
        <h1 style={{ fontSize: 28, marginBottom: 8 }}>Contact Us</h1>
        <p style={{ color: 'var(--muted)', marginBottom: 32, fontSize: 14 }}>
          Have a question, feedback, or need help? Fill out the form below and we will get back to you.
        </p>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontWeight: 600, fontSize: 14, display: 'block', marginBottom: 4 }}>Name</label>
            <input className="upload-input" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
          </div>
          <div>
            <label style={{ fontWeight: 600, fontSize: 14, display: 'block', marginBottom: 4 }}>Email (optional)</label>
            <input className="upload-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <div>
            <label style={{ fontWeight: 600, fontSize: 14, display: 'block', marginBottom: 4 }}>Message</label>
            <textarea className="upload-textarea" value={message} onChange={e => setMessage(e.target.value)} placeholder="Tell us what is on your mind..." rows={5} />
          </div>
          <button className="hero-cta-primary" type="submit" disabled={sending} style={{ alignSelf: 'flex-start', opacity: sending ? 0.6 : 1 }}>
            {sending ? <><Send size={14} className="spin" /> Sending...</> : <><Send size={14} /> Send Message</>}
          </button>
        </form>
      </main>
      <Footer onScrollTo={() => {}} lang="en" />
      <div className="toast-wrap">
        {toasts.map(t => <Toast key={t.id} id={t.id} icon={t.icon} message={t.message} onRemove={removeToast} />)}
      </div>
    </>
  );
}
