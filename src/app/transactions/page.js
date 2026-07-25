'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ChevronDown } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import { useLang } from '@/lib/LanguageProvider';
import { appLocales } from '@/lib/appLocales';

export default function TransactionsPage() {
  const router = useRouter();
  const { lang } = useLang();
  const t = appLocales[lang].transactions;
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => {
        if (!d.authenticated) { router.push('/'); return; }
        return fetch('/api/transactions');
      })
      .then(r => r ? r.json() : null)
      .then(d => { if (d?.success) setTransactions(d.transactions); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  }

  const filtered = transactions.filter(t =>
    !search || t.id.toLowerCase().includes(search.toLowerCase())
  );

  function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  return (
    <div className="app-layout">
      <Sidebar onLogout={handleLogout} />
      <main className="main-content">
        <div className="page-top">
          <div>
            <h1 className="page-title">{t.title}</h1>
            <p className="page-desc">{t.desc}</p>
          </div>
          <div className="search-bar">
            <Search size={16} />
            <input
              type="text"
              placeholder={t.search}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t.id}</th>
                <th>{t.type}</th>
                <th>{t.amount}</th>
                <th>{t.method}</th>
                <th>{t.status}</th>
                <th>{t.date}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="table-empty">{appLocales[lang].common.loading}</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="table-empty">{t.noTransactions}</td></tr>
              ) : (
                filtered.map(t => (
                  <tr key={t.id}>
                    <td className="cell-id">#{t.id.slice(0, 8)}</td>
                    <td>
                      <span className={`badge-status ${t.type === 'Deposit' ? 'status-approved' : 'status-pending'}`}>
                        {t.type}
                      </span>
                    </td>
                    <td className="cell-price">
                      {t.type === 'Deposit' ? '+' : '-'}${typeof t.amount === 'number' ? t.amount.toFixed(2) : t.amount}
                    </td>
                    <td className="cell-buyer" style={{ textTransform: 'capitalize' }}>{t.method}</td>
                    <td>
                      <span className={`badge-status status-${t.status.toLowerCase()}`}>
                        {t.status}
                      </span>
                    </td>
                    <td style={{ fontSize: '12px', color: '#6b7280' }}>{formatDate(t.date)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
