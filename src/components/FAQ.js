'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { locales } from '@/lib/locales';

export default function FAQ({ lang = 'en' }) {
  const [openIndex, setOpenIndex] = useState(null);
  const t = locales[lang].faq;
  const faqData = t.items;

  const handleToggle = (idx) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section className="faq-section section-wrap" id="faq">
      <div className="section-head reveal in-view">
        <div className="section-eyebrow">{t.eyebrow}</div>
        <h2>{t.title}</h2>
        <p>{t.subtitle}</p>
      </div>
      <div className="faq-list reveal in-view">
        {faqData.map((item, idx) => (
          <div key={idx} className={`faq-item ${openIndex === idx ? 'open' : ''}`}>
            <div className="faq-question" onClick={() => handleToggle(idx)}>
              {item.q} <Plus className="icon" />
            </div>
            <div className="faq-answer">
              <p>{item.a}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

