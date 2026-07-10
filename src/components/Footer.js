import { Crown } from 'lucide-react';
import { locales } from '@/lib/locales';

const MessageCircleSvg = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="icon">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
);

const TwitterSvg = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="icon">
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  </svg>
);

const MailSvg = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="icon">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

export default function Footer({ onScrollTo, lang = 'en' }) {
  const t = locales[lang].footer;
  const n = locales[lang].nav;
  const c = locales[lang].catalog;
  const isPt = lang === 'pt';

  return (
    <footer className="footer">
      <div className="section-wrap">
        <div className="footer-top">
          <div>
            <div className="footer-brand" style={{ cursor: 'pointer' }} onClick={() => onScrollTo('hero')}>
              <Crown className="icon" />
              NexBlox
            </div>
            <p className="legal">
              {t.desc}
            </p>
          </div>
          <div className="footer-col">
            <p className="footer-label">{isPt ? 'Plataforma' : 'Platform'}</p>
            <a href="#catalog" onClick={(e) => { e.preventDefault(); onScrollTo('catalog'); }}>{c.browseBtn || (isPt ? 'Navegar' : 'Browse items')}</a>
            <a href="#catalog" onClick={(e) => { e.preventDefault(); onScrollTo('catalog'); }}>{c.sellBtn}</a>
            <a href="#how" onClick={(e) => { e.preventDefault(); onScrollTo('how'); }}>{n.howItWorks}</a>
          </div>
          <div className="footer-col">
            <p className="footer-label">{isPt ? 'Suporte' : 'Support'}</p>
            <a href="#" onClick={(e) => e.preventDefault()}>{isPt ? 'Contato' : 'Contact'}</a>
            <a href="#" onClick={(e) => e.preventDefault()}>{t.privacy}</a>
            <a href="#" onClick={(e) => e.preventDefault()}>{t.terms}</a>
          </div>
          <div className="footer-col">
            <p className="footer-label">{isPt ? 'Comunidade' : 'Community'}</p>
            <a href="#" onClick={(e) => e.preventDefault()}>Discord</a>
            <a href="#" onClick={(e) => e.preventDefault()}>Twitter / X</a>
            <a href="#faq" onClick={(e) => { e.preventDefault(); onScrollTo('faq'); }}>{n.faq}</a>
          </div>
        </div>
        <div className="footer-bottom">
          <span style={{ fontSize: '12px', color: 'var(--muted)' }}>{t.copy}</span>
          <div className="footer-socials">
            <a href="#" onClick={(e) => e.preventDefault()} aria-label="Discord"><MessageCircleSvg /></a>
            <a href="#" onClick={(e) => e.preventDefault()} aria-label="Twitter"><TwitterSvg /></a>
            <a href="#" onClick={(e) => e.preventDefault()} aria-label="Email"><MailSvg /></a>
          </div>
        </div>
      </div>
    </footer>
  );
}

