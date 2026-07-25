'use client';

import { CheckCircle } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

export default function MarqueeBar({ lang = 'en' }) {
  const [marqueeItems, setMarqueeItems] = useState([]);
  const containerRef = useRef(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    // Defer the network request until the bar is near the viewport (below the fold)
    const el = containerRef.current;
    if (!el || loadedRef.current) return;

    const load = () => {
      if (loadedRef.current) return;
      loadedRef.current = true;
      fetch('/api/items?limit=20')
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.items) && data.items.length > 0) {
            const shuffled = data.items.slice(0, 12);
            setMarqueeItems(shuffled);
          }
        })
        .catch(() => {
          /* Silent fallback: bar stays empty, no console noise */
        });
    };

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          load();
          io.disconnect();
        }
      },
      { rootMargin: '200px' }
    );
    io.observe(el);

    return () => io.disconnect();
  }, []);

  if (marqueeItems.length === 0) return <div ref={containerRef} className="marquee-bar" aria-hidden="true" />;

  const items = [...marqueeItems, ...marqueeItems];

  return (
    <div ref={containerRef} className="marquee-bar" aria-hidden="true">
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
