'use client';

import { useEffect, useState } from 'react';
import { ShoppingBag } from 'lucide-react';
import { locales } from '@/lib/locales';

function StatCounter({ target, prefix = '', suffix = '', decimals = 0, duration = 1400 }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // cubic ease out
      const value = eased * target;
      setCount(value);
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [target, duration]);

  return (
    <div className="stat-num">
      {prefix}
      {count.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </div>
  );
}

export default function Hero({ onBrowseClick, onHowItWorksClick, lang = 'en' }) {
  const t = locales[lang].hero;

  return (
    <section className="hero" id="hero">
      <div className="hero-glow"></div>
      <div className="hero-eyebrow">
        <span className="live-dot"></span>{t.eyebrow}
      </div>
      <h1>
        {t.title}<br />
        <span>{t.titleSpan}</span>
      </h1>
      <p>{t.subtitle}</p>
      <div className="hero-ctas">
        <button className="hero-cta-primary" onClick={onBrowseClick}>
          <ShoppingBag className="icon" />
          {t.browseBtn}
        </button>
        <button className="hero-cta-secondary" onClick={onHowItWorksClick}>
          {t.howBtn}
        </button>
      </div>
      <div className="stats-row">
        <div className="stat">
          <StatCounter target={42180} />
          <div className="stat-label">{t.stats.itemsListed}</div>
        </div>
        <div className="stat">
          <StatCounter target={2100000} prefix="$" />
          <div className="stat-label">{t.stats.tradedMo}</div>
        </div>
        <div className="stat">
          <StatCounter target={99.4} suffix="%" decimals={1} />
          <div className="stat-label">{t.stats.cleanTrades}</div>
        </div>
      </div>
    </section>
  );
}

