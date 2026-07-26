import { Package } from 'lucide-react';

export default function Footer({ onScrollTo, lang = 'en' }) {
  return (
    <footer className="footer">
      <div className="section-wrap">
        <div className="footer-top">
          <div>
            <div className="footer-brand" style={{ cursor: 'pointer' }} onClick={() => onScrollTo('hero')}>
              <Package className="icon" />
              StudioMarket
            </div>
            <p className="legal">
              The Roblox Studio asset marketplace. Upload, share, and sell your creations.
            </p>
          </div>
          <div className="footer-links">
            <div className="footer-col">
              <h4>Marketplace</h4>
              <a href="/marketplace">Browse Assets</a>
              <a href="/upload">Upload</a>
              <a href="/queue">Queue</a>
            </div>
            <div className="footer-col">
              <h4>Legal</h4>
              <a href="/terms">Terms of Service</a>
              <a href="/privacy">Privacy Policy</a>
            </div>
            <div className="footer-col">
              <h4>Support</h4>
              <a href="/help">Help</a>
              <a href="/contact">Contact</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>&copy; {new Date().getFullYear()} StudioMarket. Not affiliated with Roblox.</span>
        </div>
      </div>
    </footer>
  );
}
