'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Shield, ShoppingCart, MonitorSmartphone, ScrollText, ArrowLeft, Cpu } from 'lucide-react';

const links = [
  { href: '/admin/orders', label: 'Pedidos', icon: ShoppingCart },
  { href: '/admin/sessions', label: 'Sessões / IP', icon: MonitorSmartphone },
  { href: '/admin/audit', label: 'Log de Auditoria', icon: ScrollText },
  { href: '/admin/remote', label: 'Acesso Remoto', icon: Cpu },
];

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch('/api/auth/me');
        const d = await res.json();
        if (!active) return;
        if (!d.authenticated || d.user?.role !== 'admin') {
          router.push('/');
          return;
        }
        setOk(true);
      } catch {
        // Transient network/parse error: do NOT bounce the user out.
        // Leave the guard as loading so a flaky request doesn't kick
        // an admin back to the homepage.
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [router]);

  if (loading || !ok) return null;

  return (
    <div className="admin-shell">
      <aside className="admin-nav">
        <div className="admin-brand">
          <Shield size={18} style={{ color: 'var(--gold)' }} />
          <span>Admin</span>
        </div>
        <nav className="admin-nav-links">
          {links.map((l) => {
            const Icon = l.icon;
            const active = pathname === l.href;
            return (
              <Link key={l.href} href={l.href} className={'admin-nav-link' + (active ? ' active' : '')}>
                <Icon size={16} className="icon" />
                <span>{l.label}</span>
              </Link>
            );
          })}
        </nav>
        <button className="admin-nav-back" onClick={() => router.push('/')}>
          <ArrowLeft size={16} className="icon" />
          <span>Voltar ao site</span>
        </button>
      </aside>
      <main className="admin-main">{children}</main>
    </div>
  );
}
