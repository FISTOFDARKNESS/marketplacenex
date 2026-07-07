import { Star } from 'lucide-react';
import { locales } from '@/lib/locales';

export default function Testimonials({ lang = 'en' }) {
  const t = locales[lang].testimonials;

  return (
    <section className="testi-section section-wrap">
      <div className="section-head reveal in-view">
        <div className="section-eyebrow">{t.eyebrow}</div>
        <h2>{t.title}</h2>
        <p>{t.subtitle}</p>
      </div>
      <div className="testi-grid reveal-stagger in-view">
        {t.items.map((item, index) => {
          const initials = item.author.substring(0, 2).toUpperCase();
          return (
            <div key={index} className="testi-card">
              <div className="testi-stars">
                <Star className="icon" />
                <Star className="icon" />
                <Star className="icon" />
                <Star className="icon" />
                <Star className="icon" />
              </div>
              <p>{item.text}</p>
              <div className="testi-user">
                <div className="testi-avatar">{initials}</div>
                <div>
                  <div className="testi-name">{item.author}</div>
                  <div className="testi-handle">{item.role}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

