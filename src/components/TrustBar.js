import { ShieldCheck, Bitcoin, Wallet, Zap } from 'lucide-react';

export default function TrustBar() {
  return (
    <div className="trust-bar section-wrap reveal-stagger in-view">
      <div className="trust-item">
        <ShieldCheck className="icon" />
        Admin-verified trades
      </div>
      <div className="trust-item">
        <Bitcoin className="icon" />
        Crypto payouts
      </div>
      <div className="trust-item">
        <Wallet className="icon" />
        PayPal & Cash App
      </div>
      <div className="trust-item">
        <Zap className="icon" />
        Instant delivery
      </div>
    </div>
  );
}
