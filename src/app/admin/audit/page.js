'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ScrollText } from 'lucide-react';

function fmt(d) {
  if (!d) return '-';
  try {
    return new Date(d).toLocaleString('pt-BR');
  } catch {
    return String(d);
  }
}

function fmtMeta(meta) {
  if (!meta) return '';
  try {
    const obj = typeof meta === 'string' ? JSON.parse(meta) : meta;
    return JSON.stringify(obj);
  } catch {
    return String(meta);
  }
}

export default function AdminAuditPage() {
  const router = useRouter();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  function load() {
    setLoading(true);
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => {
        if (!d.authenticated || d.user.role !== 'admin') { router.push('/'); return; }
        return fetch('/api/admin/audit');
      })
      .then((r) => (r ? r.json() : null))
      .then((d) => { if (d?.success) setLogs(d.logs); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  const filtered = filter
    ? logs.filter((l) => (l.action || '').toLowerCase().includes(filter.toLowerCase()) || (l.username || '').toLowerCase().includes(filter.toLowerCase()))
    : logs;

  return (
    <div className="page-layout">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ScrollText size={20} style={{ color: '#ef4444' }} />
          <h1 style={{ margin: 0, fontSize: '20px' }}>Log de Auditoria ({logs.length})</h1>
        </div>
        <input
          className="admin-search"
          placeholder="Filtrar por ação ou usuário..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      <div className="page-content">
        {loading ? (
          <p className="page-empty">Carregando...</p>
        ) : filtered.length === 0 ? (
          <p className="page-empty">Nenhum registro.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Ação</th>
                  <th>Usuário</th>
                  <th>IP</th>
                  <th>Alvo</th>
                  <th>Detalhes</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((l) => (
                  <tr key={l.id}>
                    <td className="admin-sub">{fmt(l.createdAt)}</td>
                    <td><span className="admin-mono">{l.action}</span></td>
                    <td>{l.username || <span className="admin-sub">(sistema)</span>}</td>
                    <td><span className="admin-mono">{l.ip || '-'}</span></td>
                    <td className="admin-sub">{l.target || '-'}</td>
                    <td className="admin-sub admin-meta">{fmtMeta(l.meta)}</td>
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
