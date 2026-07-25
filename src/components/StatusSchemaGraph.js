'use client';

const W = 200;
const H = 100;
const PAD = 24;

const DEMAND_MAP = { '-1': 'None', '0': 'Terrible', '1': 'Low', '2': 'Normal', '3': 'High', '4': 'Amazing' };
const TREND_MAP = { '-1': 'None', '0': 'Lowering', '1': 'Unstable', '2': 'Stable', '3': 'Raising', '4': 'Fluctuating' };
const FLAG_MAP = { '-1': 'False', '1': 'True' };

const LABELS = ['Demand', 'Trend', 'Projected', 'Hyped', 'Rare'];

function normalize(val, min, max) {
  return ((val - min) / (max - min)) * (H - PAD * 2);
}

function getLabel(index, val) {
  if (index === 0) return DEMAND_MAP[val] || String(val);
  if (index === 1) return TREND_MAP[val] || String(val);
  return FLAG_MAP[val] || String(val);
}

function getY(val) {
  if (val === 1) return H - PAD;
  if (val === -1) return PAD;
  if (val === 0) return H / 2;
  if (val === 2) return H - PAD - (H - PAD * 2) * 0.33;
  if (val === 3) return H - PAD - (H - PAD * 2) * 0.66;
  if (val === 4) return PAD;
  return H / 2;
}

function getMinMax(index) {
  if (index <= 1) return [-1, 4];
  return [-1, 1];
}

export default function StatusSchemaGraph({ demand, trend, projected, hyped, rare }) {
  const values = [demand ?? -1, trend ?? -1, projected ?? -1, hyped ?? -1, rare ?? -1];
  const points = values.map((v, i) => {
    const x = PAD + (i / 4) * (W - PAD * 2);
    const [_min, _max] = getMinMax(i);
    const y = H - PAD - normalize(v, _min, _max);
    return { x, y, v, label: getLabel(i, v) };
  });
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  return (
    <div className="status-graph">
      <div className="status-graph-title">Status Schema Graph</div>
      <svg width={W} height={H + 20} viewBox={`0 0 ${W} ${H + 20}`} className="status-graph-svg">
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="#EAC847" stroke="#0B0B0F" strokeWidth="1.5" />
        ))}
        {points.map((p, i) => (
          <text key={`l${i}`} x={p.x} y={H + 14} textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize="8" fontFamily="JetBrains Mono, monospace">
            {LABELS[i]}
          </text>
        ))}
        <path d={pathD} fill="none" stroke="#EAC847" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
      </svg>
      <div className="status-graph-values">
        {points.map((p, i) => (
          <div key={i} className="status-graph-value">
            <span className="sgv-label">{LABELS[i]}</span>
            <span className="sgv-val">{p.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
