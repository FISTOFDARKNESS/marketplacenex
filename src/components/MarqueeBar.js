'use client';

import { CheckCircle } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function MarqueeBar({ lang = 'en' }) {
  const [marqueeItems, setMarqueeItems] = useState([]);

  useEffect(() => {
    fetch('/api/items?limit=20')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.items.length > 0) {
          const shuffled = data.items.sort(() => Math.random() - 0.5).slice(0, 12);
          setMarqueeItems(shuffled);
        }
      })
      .catch(() => {});
  }, []);

  if (marqueeItems.length === 0) return null;

  const items = [...marqueeItems, ...marqueeItems];

  return (
    <div className="marquee-bar">
      <div className="marquee-track">
        {items.map((it, idx) => (
          <div key={idx} className="marquee-item">
            <CheckCircle className="icon" />
            <b>{it.name}</b> <span className="gold-text">${it.usdPrice}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
