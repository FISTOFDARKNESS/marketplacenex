'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Toast from '@/components/Toast';
import { Loader, Save } from 'lucide-react';

export default function EditAssetPage() {
  const { id } = useParams();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [asset, setAsset] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [price, setPrice] = useState('Free');
  const [priceRobux, setPriceRobux] = useState('');
  const [saving, setSaving] = useState(false);
  const [toasts, setToasts] = useState([]);

  const addToast = (icon, message) => {
    const t = Date.now();
    setToasts(prev => [...prev, { id: t, icon, message }]);
  };
  const removeToast = (tid) => setToasts(prev => prev.filter(t => t.id !== tid));

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (!d.authenticated) { router.push('/'); return; }
      setUser(d.user);
    }).catch(() => router.push('/'));
  }, []);

  useEffect(() => {
    fetch(`/api/assets/${id}`).then(r => r.json()).then(d => {
      if (!d.success) { router.push('/'); return; }
      if (d.asset.owner?.id !== user?.id && user?.role !== 'admin') { router.push(`/asset/${id}`); return; }
      setAsset(d.asset);
      setName(d.asset.name);
      setDescription(d.asset.description || '');
      setTags((d.asset.tags || []).join(', '));
      setPrice(d.asset.price || 'Free');
      setPriceRobux(d.asset.priceRobux || '');
    }).catch(() => router.push('/'));
  }, [id, user]);

  const handleSave = async () => {
    if (!name.trim()) { addToast('alert-triangle', 'Name is required'); return; }
    setSaving(true);
    const res = await fetch(`/api/assets/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.trim(),
        description: description.trim(),
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        price,
        priceRobux: price === 'Robux' ? parseInt(priceRobux) : null,
      }),
    });
    const d = await res.json();
    if (d.success) {
      addToast('check-circle', 'Asset updated!');
      setTimeout(() => router.push(`/asset/${id}`), 1000);
    } else {
      addToast('alert-triangle', d.error || 'Failed to update');
    }
    setSaving(false);
  };

  if (!asset) return <div style={{ padding: 48, textAlign: 'center' }}>Loading...</div>;

  return (
    <>
      <Navbar user={user} onOpenAuth={() => {}} onLogout={() => router.push('/')} onScrollTo={() => {}} />
      <main style={{ maxWidth: 720, margin: '48px auto', padding: '0 24px' }}>
        <h1 style={{ fontSize: 24, marginBottom: 24 }}>Edit Asset</h1>
        <div className="upload-form">
          <label style={{ fontWeight: 600, fontSize: 14 }}>Asset Name</label>
          <input className="upload-input" value={name} onChange={e => setName(e.target.value)} />

          <label style={{ fontWeight: 600, fontSize: 14 }}>Description</label>
          <textarea className="upload-textarea" value={description} onChange={e => setDescription(e.target.value)} rows={4} />

          <label style={{ fontWeight: 600, fontSize: 14 }}>Tags (comma separated)</label>
          <input className="upload-input" value={tags} onChange={e => setTags(e.target.value)} placeholder="vfx, aura, animation" />

          <label style={{ fontWeight: 600, fontSize: 14 }}>Price</label>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <button className={`price-option ${price === 'Free' ? 'active' : ''}`} onClick={() => setPrice('Free')}>Free</button>
            <button className={`price-option ${price === 'Robux' ? 'active' : ''}`} onClick={() => { if (!user?.verified) { addToast('info', 'Verify your account first'); return; } setPrice('Robux'); }}>
              Robux
            </button>
          </div>
          {price === 'Robux' && (
            <input className="upload-input" type="number" min="1" value={priceRobux} onChange={e => setPriceRobux(e.target.value)} placeholder="50" />
          )}

          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            <button className="hero-cta-secondary" onClick={() => router.push(`/asset/${id}`)} style={{ flex: 1 }}>Cancel</button>
            <button className="hero-cta-primary" onClick={handleSave} disabled={saving} style={{ flex: 1, opacity: saving ? 0.6 : 1 }}>
              {saving ? <><Loader size={14} className="spin" /> Saving...</> : <><Save size={14} /> Save Changes</>}
            </button>
          </div>
        </div>
      </main>
      <Footer onScrollTo={() => {}} lang="en" />
      <div className="toast-wrap">
        {toasts.map(t => <Toast key={t.id} id={t.id} icon={t.icon} message={t.message} onRemove={removeToast} />)}
      </div>
    </>
  );
}
