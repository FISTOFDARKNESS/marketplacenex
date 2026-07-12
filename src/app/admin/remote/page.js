'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Cpu, Check, X } from 'lucide-react';

const STATUS = {
  PENDING: { label: 'Aguardando', cls: 'badge-warn' },
  APPROVED: { label: 'Aprovado', cls: 'badge-ok' },
  ENDED: { label: 'Encerrado', cls: 'badge-fail' },
};

function fmt(d) {
  if (!d) return '-';
  try { return new Date(d).toLocaleString('pt-BR'); } catch { return String(d); }
}

export default function AdminRemotePage() {
  const router = useRouter();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => {
        if (!d.authenticated || d.user?.role !== 'admin') { router.push('/'); return; }
        return fetch('/api/admin/remote');
      })
      .then((r) => (r ? r.json() : null))
      .then((d) => { if (d?.success) setSessions(d.sessions); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function act(id, action) {
    try {
      const res = await fetch('/api/admin/remote/' + id, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (res.ok) load();
    } catch {}
  }

  return (
    <div className="page-layout">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Cpu size={20} style={{ color: '#ef4444' }} />
          <h1 style={{ margin: 0, fontSize: '20px' }}>Acesso Remoto ({sessions.length})</h1>
        </div>
        <button className="admin-revoke" onClick={load}>Atualizar</button>
      </div>

      <div className="page-content">
        {loading ? (
          <p className="page-empty">Carregando...</p>
        ) : sessions.length === 0 ? (
          <p className="page-empty">Nenhuma sessão. O host aparece aqui quando o amigo executa o .exe.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Host</th>
                  <th>Usuário</th>
                  <th>IP</th>
                  <th>OS</th>
                  <th>Tela</th>
                  <th>Status</th>
                  <th>Criado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => (
                  <tr key={s.id}>
                    <td className="admin-strong">{s.hostname || '(desconhecido)'}</td>
                    <td>{s.username || '-'}</td>
                    <td><span className="admin-mono">{s.ip || '-'}</span></td>
                    <td>{s.os || '-'}</td>
                    <td className="admin-sub">{s.screen || '-'}</td>
                    <td>
                      <span className={'badge ' + (STATUS[s.status]?.cls || 'badge-warn')}>
                        {STATUS[s.status]?.label || s.status}
                      </span>
                    </td>
                    <td className="admin-sub">{fmt(s.createdAt)}</td>
                    <td style={{ display: 'flex', gap: '6px' }}>
                      {s.status === 'PENDING' && (
                        <button className="approve-btn" style={{ padding: '7px 12px' }} onClick={() => act(s.id, 'approve')}>
                          <Check size={14} className="icon" /> Aprovar
                        </button>
                      )}
                      {s.status !== 'ENDED' && (
                        <button className="admin-revoke" onClick={() => act(s.id, 'end')}>
                          <X size={14} className="icon" /> Encerrar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="admin-sub" style={{ marginTop: '14px' }}>
          Após aprovar, o seu controller .exe conecta automaticamente à sessão aprovada.
        </p>
      </div>
    </div>
  );
}
