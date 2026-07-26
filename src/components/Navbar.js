'use client';

import { useState, useRef, useEffect } from 'react';
import { Crown, Upload, Bell, User, Users, LogOut, Menu, Shield, CheckCircle, Download, Heart } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar({ user, onOpenAuth, onLogout, onScrollTo }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const menuRef = useRef(null);

  useEffect(() => {
    if (user) {
      fetch('/api/notifications').then(r => {
        if (r.status === 401) { onLogout(); return; }
        return r.json();
      }).then(d => {
        if (d && d.success) {
          setNotifications(d.notifications);
          setUnreadCount(d.unreadCount);
        }
      }).catch(() => {});
    }
  }, [user, onLogout]);

  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
        setNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const markAllRead = async () => {
    const res = await fetch('/api/notifications', { method: 'POST' });
    if (res.status === 401) { onLogout(); return; }
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const isActive = (path) => pathname === path ? 'active' : '';

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <Link href="/" className="logo-box" style={{ cursor: 'pointer' }}>
          <Crown className="icon" />
        </Link>
        <div className="nav-links">
          <Link href="/marketplace" className={isActive('/marketplace')}>Marketplace</Link>
          <Link href="/upload" className={isActive('/upload')}>Upload</Link>
          <Link href="/queue" className={isActive('/queue')}>Queue</Link>
        </div>
      </div>
      <div className="auth-buttons">
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }} ref={menuRef}>
            <div style={{ position: 'relative' }}>
              <button className="icon-btn" onClick={() => { setNotifOpen(!notifOpen); setMenuOpen(false); }} aria-label="Notifications">
                <Bell className="icon" />
                {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
              </button>
              {notifOpen && (
                <div style={{
                  position: 'absolute', top: '100%', right: 0, marginTop: 8,
                  width: 320, maxHeight: 400, overflowY: 'auto',
                  background: 'var(--bg-2)', border: '1px solid var(--line)',
                  borderRadius: 12, padding: 8, zIndex: 100,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 8px 12px', borderBottom: '1px solid var(--line)', marginBottom: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>Notifications</span>
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} style={{ fontSize: 11, color: 'var(--gold)', background: 'none', border: 'none', cursor: 'pointer' }}>
                        Mark all read
                      </button>
                    )}
                  </div>
                  {notifications.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 24, color: 'var(--muted)', fontSize: 12 }}>No notifications</div>
                  ) : notifications.slice(0, 20).map(n => (
                    <Link key={n.id} href={n.link || '#'} style={{
                      display: 'block', padding: '8px 10px', borderRadius: 8,
                      background: n.read ? 'transparent' : 'rgba(234,200,71,0.06)',
                      textDecoration: 'none', color: 'var(--text)', fontSize: 12,
                      marginBottom: 2,
                    }}>
                      <div style={{ fontWeight: 600, marginBottom: 2 }}>{n.title}</div>
                      <div style={{ color: 'var(--muted)', fontSize: 11 }}>{n.message}</div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {user.role === 'admin' && (
              <Link href="/queue" className="icon-btn" title="Admin Queue" style={{ color: '#ef4444' }}>
                <Shield className="icon" />
              </Link>
            )}

            <Link href="/likes" className="icon-btn" title="Liked Assets">
              <Heart size={16} />
            </Link>
            <Link href="/downloads" className="icon-btn" title="Download History">
              <Download className="icon" />
            </Link>

            <Link href={`/profile/${user.username}`} className="nav-link-btn" style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
              {user.username}
              {user.verified && <CheckCircle size={12} style={{ color: '#3b82f6', marginLeft: 4 }} />}
            </Link>

            <button className="signup-btn" style={{ background: '#ef4444', color: '#fff', fontSize: 12, padding: '7px 14px' }} onClick={onLogout}>
              <LogOut size={12} /> Logout
            </button>
          </div>
        ) : (
          <>
            <button className="login-link" onClick={() => onOpenAuth('login')}>Login</button>
            <button className="signup-btn" onClick={() => onOpenAuth('register')}>Sign Up</button>
          </>
        )}
      </div>
    </nav>
  );
}
