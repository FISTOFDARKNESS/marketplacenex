'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MonitorSmartphone, Ban } from 'lucide-react';

function fmt(d) {
  if (!d) return '-';
  try {
    return new Date(d).toLocaleString('pt-BR');
  } catch {
    return String(d);
  }
}

export default function AdminSessionsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);

  function load() {
    setLoading(true);
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => {
        if (!d.authenticated || d.user?.role !== 'admin') { router.push('/'); return; }
        return fetch('/api/admin/sessions');
      })
      .then((r) => (r ? r.json() : null))
      .then((d) => { if (d?.success) setSessions(d.sessions); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function revoke(id) {
    if (!confirm('Revogar esta sessão? O usuario precisara logar novamente.')) return;
    setBusy(id);
    try {
      const res = await fetch('/api/admin/sessions/' + id, { method: 'DELETE' });
      if (res.ok) setSessions((s) => s.filter((x) => x.id !== id));
    } catch {} finally { setBusy(null); }
  }

  return (
    <div className="page-layout">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <MonitorSmartphone size={20} style={{ color: '#ef4444' }} />
          <h1 style={{ margin: 0, fontSize: '20px' }}>Sessões e IPs ({sessions.length})</h1>
        </div>
        <div />
      </div>

      <div className="page-content">
        {loading ? (
          <p className="page-empty">Carregando...</p>
        ) : sessions.length === 0 ? (
          <p className="page-empty">Nenhuma sessão ativa.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Usuário</th>
                  <th>IP</th>
                  <th>Dispositivo</th>
                  <th>Navegador</th>
                  <th>OS</th>
                  <th>Último acesso</th>
                  <th>Início</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <div className="admin-strong">{s.username || '(sem usuário)'}</div>
                      {s.email && <div className="admin-sub">{s.email}</div>}
                      {s.role === 'admin' && <span className="badge badge-warn">admin</span>}
                    </td>
                    <td><span className="admin-mono">{s.ip}</span></td>
                    <td>{s.device || '-'}</td>
                    <td>{s.browser || '-'}</td>
                    <td>{s.os || '-'}</td>
                    <td className="admin-sub">{fmt(s.lastSeen)}</td>
                    <td className="admin-sub">{fmt(s.createdAt)}</td>
                    <td>
                      <button className="admin-revoke" disabled={busy === s.id} onClick={() => revoke(s.id)}>
                        <Ban size={14} className="icon" />
                        {busy === s.id ? '...' : 'Revogar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
