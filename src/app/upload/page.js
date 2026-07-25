'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, Image, Video, File, Tag, DollarSign, X, Loader } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Toast from '@/components/Toast';
import { useLang } from '@/lib/LanguageProvider';

export default function UploadPage() {
  const router = useRouter();
  const { lang } = useLang();
  const [user, setUser] = useState(null);
  const [toasts, setToasts] = useState([]);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [price, setPrice] = useState('Free');
  const [priceRobux, setPriceRobux] = useState('');
  const [thumbnail, setThumbnail] = useState(null);
  const [video, setVideo] = useState(null);
  const [assetFile, setAssetFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [step, setStep] = useState(1);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (!d.authenticated) { router.push('/'); return; }
      setUser(d.user);
    }).catch(() => router.push('/'));
  }, []);

  const addToast = (icon, message) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, icon, message }]);
  };
  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  const uploadFile = async (file, type) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    return data.url;
  };

  const handleSubmit = async () => {
    if (!name || !thumbnail || !assetFile) {
      addToast('alert-triangle', 'Name, thumbnail, and asset file are required');
      return;
    }

    if (price === 'Robux' && (!priceRobux || parseInt(priceRobux) < 1)) {
      addToast('alert-triangle', 'Price must be at least 1 Robux');
      return;
    }

    if (price === 'Robux' && !user?.verified) {
      addToast('alert-triangle', 'You need a verified account to set Robux prices');
      return;
    }

    setUploading(true);
    try {
      const thumbUrl = await uploadFile(thumbnail, 'image');
      let videoUrl = null;
      if (video) videoUrl = await uploadFile(video, 'video');
      const assetUrl = await uploadFile(assetFile, 'asset');

      const res = await fetch('/api/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          tags: tags.split(',').map(t => t.trim()).filter(Boolean),
          price,
          priceRobux: price === 'Robux' ? parseInt(priceRobux) : null,
          thumbnailUrl: thumbUrl,
          videoUrl,
          assetFileUrl: assetUrl,
          assetType: assetFile.name.endsWith('.rbxl') ? 'rbxl' : 'rbxm',
          fileSize: Math.round(assetFile.size / 1024),
        }),
      });

      const data = await res.json();
      if (data.success) {
        addToast('check-circle', `"${name}" submitted for review!`);
        setTimeout(() => router.push('/queue'), 1500);
      } else {
        addToast('alert-triangle', data.error || 'Failed to submit asset');
      }
    } catch (err) {
      addToast('alert-triangle', err.message);
    } finally {
      setUploading(false);
    }
  };

  if (!user) return null;

  return (
    <>
      <Navbar user={user} onOpenAuth={() => {}} onLogout={() => { router.push('/'); }} onScrollTo={() => {}} />
      <main style={{ maxWidth: 720, margin: '48px auto', padding: '0 24px' }}>
        <h1 style={{ fontSize: 28, marginBottom: 8 }}>Upload Asset</h1>
        <p style={{ color: 'var(--muted)', marginBottom: 32, fontSize: 14 }}>
          Submit your Roblox Studio asset for admin review
        </p>

        <div style={{ display: 'flex', gap: 12, marginBottom: 32 }}>
          {['Details', 'Media', 'Pricing'].map((s, i) => (
            <div key={s} style={{
              flex: 1, padding: '12px 16px', borderRadius: 10,
              border: `1px solid ${step === i + 1 ? 'var(--gold)' : 'var(--line)'}`,
              background: step === i + 1 ? 'var(--gold-soft)' : 'var(--bg-2)',
              textAlign: 'center', fontSize: 13, fontWeight: 600,
              color: step === i + 1 ? 'var(--gold)' : 'var(--muted)',
            }}>
              Step {i + 1}: {s}
            </div>
          ))}
        </div>

        {step === 1 && (
          <div className="upload-form">
            <label style={{ fontWeight: 600, fontSize: 14 }}>Asset Name *</label>
            <input className="upload-input" value={name} onChange={e => setName(e.target.value)} placeholder="My Awesome VFX" />

            <label style={{ fontWeight: 600, fontSize: 14 }}>Description</label>
            <textarea className="upload-textarea" value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe what your asset does..." rows={4} />

            <label style={{ fontWeight: 600, fontSize: 14 }}>Tags (comma separated)</label>
            <input className="upload-input" value={tags} onChange={e => setTags(e.target.value)} placeholder="vfx, aura, animation" />

            <button className="hero-cta-primary" style={{ marginTop: 16 }} onClick={() => setStep(2)}>
              Next: Media
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="upload-form">
            <div className="upload-dropzone" onClick={() => document.getElementById('thumbInput').click()}>
              {thumbnail ? (
                <div style={{ position: 'relative' }}>
                  <img src={URL.createObjectURL(thumbnail)} alt="" style={{ maxHeight: 200, borderRadius: 8 }} />
                  <button className="upload-remove" onClick={(e) => { e.stopPropagation(); setThumbnail(null); }}><X size={14} /></button>
                </div>
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <Image size={32} style={{ opacity: 0.4, marginBottom: 8 }} />
                  <div>Click to upload thumbnail * (max 25MB)</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>PNG, JPEG, WebP</div>
                </div>
              )}
              <input id="thumbInput" type="file" accept="image/*" style={{ display: 'none' }} onChange={e => setThumbnail(e.target.files[0])} />
            </div>

            <div className="upload-dropzone" onClick={() => document.getElementById('videoInput').click()}>
              {video ? (
                <div style={{ position: 'relative' }}>
                  <video src={URL.createObjectURL(video)} style={{ maxHeight: 150, borderRadius: 8 }} controls />
                  <button className="upload-remove" onClick={(e) => { e.stopPropagation(); setVideo(null); }}><X size={14} /></button>
                </div>
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <Video size={32} style={{ opacity: 0.4, marginBottom: 8 }} />
                  <div>Click to upload preview video (optional, max 25MB)</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>MP4 only</div>
                </div>
              )}
              <input id="videoInput" type="file" accept="video/mp4" style={{ display: 'none' }} onChange={e => setVideo(e.target.files[0])} />
            </div>

            <div className="upload-dropzone" onClick={() => document.getElementById('assetInput').click()}>
              {assetFile ? (
                <div style={{ position: 'relative' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <File size={20} />
                    <div>
                      <div style={{ fontWeight: 600 }}>{assetFile.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>{(assetFile.size / 1024).toFixed(0)} KB</div>
                    </div>
                  </div>
                  <button className="upload-remove" onClick={(e) => { e.stopPropagation(); setAssetFile(null); }}><X size={14} /></button>
                </div>
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <File size={32} style={{ opacity: 0.4, marginBottom: 8 }} />
                  <div>Click to upload asset file * (max 25MB)</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>.rbxm or .rbxl</div>
                </div>
              )}
              <input id="assetInput" type="file" accept=".rbxm,.rbxl" style={{ display: 'none' }} onChange={e => setAssetFile(e.target.files[0])} />
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              <button className="hero-cta-secondary" onClick={() => setStep(1)}>Back</button>
              <button className="hero-cta-primary" onClick={() => setStep(3)}>Next: Pricing</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="upload-form">
            <label style={{ fontWeight: 600, fontSize: 14 }}>Price</label>
            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              <button
                className={`price-option ${price === 'Free' ? 'active' : ''}`}
                onClick={() => setPrice('Free')}
              >Free</button>
              <button
                className={`price-option ${price === 'Robux' ? 'active' : ''}`}
                onClick={() => {
                  if (!user?.verified) {
                    addToast('info', 'Verify your account to set Robux prices');
                    return;
                  }
                  setPrice('Robux');
                }}
              >
                <DollarSign size={14} /> Robux
              </button>
            </div>

            {price === 'Robux' && (
              <div>
                <label style={{ fontWeight: 600, fontSize: 14 }}>Price in Robux</label>
                <input className="upload-input" type="number" min="1" value={priceRobux} onChange={e => setPriceRobux(e.target.value)} placeholder="50" />
              </div>
            )}

            {!user?.verified && (
              <div style={{ background: 'rgba(234,200,71,0.1)', border: '1px solid rgba(234,200,71,0.2)', borderRadius: 10, padding: 16, marginTop: 16, fontSize: 13 }}>
                To set Robux prices, you need to <a href="/verify" style={{ color: 'var(--gold)', fontWeight: 600 }}>verify your account</a> with your Roblox cookie and Universe ID.
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              <button className="hero-cta-secondary" onClick={() => setStep(2)}>Back</button>
              <button className="hero-cta-primary" onClick={handleSubmit} disabled={uploading} style={{ opacity: uploading ? 0.6 : 1 }}>
                {uploading ? <><Loader size={14} className="spin" /> Submitting...</> : <><Upload size={14} /> Submit for Review</>}
              </button>
            </div>
          </div>
        )}
      </main>
      <Footer onScrollTo={() => {}} lang={lang} />
      <div className="toast-wrap">
        {toasts.map(t => <Toast key={t.id} id={t.id} icon={t.icon} message={t.message} onRemove={removeToast} />)}
      </div>
    </>
  );
}
