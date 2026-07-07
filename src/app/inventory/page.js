'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Backpack, ArrowLeft } from 'lucide-react';

export default function InventoryPage() {
  const router = useRouter();
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => {
        if (!d.authenticated) { router.push('/'); return; }
        return fetch('/api/inventory');
      })
      .then(r => r ? r.json() : null)
      .then(d => { if (d?.success) setInventory(d.inventory); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-layout">
      <div className="page-header">
        <button className="icon-btn" onClick={() => router.push('/')}><ArrowLeft className="icon" /></button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Backpack size={20} style={{ color: '#22c55e' }} />
          <h1 style={{ margin: 0, fontSize: '20px' }}>Inventory ({inventory.length})</h1>
        </div>
        <div />
      </div>

      <div className="page-content">
        {loading ? (
          <p className="page-empty">Loading...</p>
        ) : inventory.length === 0 ? (
          <p className="page-empty">No items yet</p>
        ) : (
          <div className="page-grid">
            {inventory.map(inv => (
              <div key={inv.id} className="page-grid-card">
                <img src={inv.item.img} alt={inv.item.name} />
                <div className="page-grid-name">{inv.item.name}</div>
                <div className="page-grid-price">${inv.item.usdPrice}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
