import { Search, ShieldCheck, PackageCheck } from 'lucide-react';
import { locales } from '@/lib/locales';

export default function HowItWorks({ lang = 'en' }) {
  const t = locales[lang].how;

  return (
    <section className="how-section section-wrap" id="how">
      <div className="section-head reveal in-view">
        <div className="section-eyebrow">{t.eyebrow}</div>
        <h2>{t.title}</h2>
        <p>{t.subtitle}</p>
      </div>
      <div className="how-grid reveal-stagger in-view">
        <div className="how-card">
          <div className="how-num">
            <Search className="icon" />
          </div>
          <h3>{t.step1Title}</h3>
          <p>{t.step1Text}</p>
        </div>
        <div className="how-card">
          <div className="how-num">
            <ShieldCheck className="icon" />
          </div>
          <h3>{t.step2Title}</h3>
          <p>{t.step2Text}</p>
        </div>
        <div className="how-card">
          <div className="how-num">
            <PackageCheck className="icon" />
          </div>
          <h3>{t.step3Title}</h3>
          <p>{t.step3Text}</p>
        </div>
      </div>
    </section>
  );
}

