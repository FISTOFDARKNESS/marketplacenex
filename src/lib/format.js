// Locale-independent number formatting.
// Using `toLocaleString(undefined, ...)` causes SSR/client hydration
// mismatches because the server (Node) and the browser resolve `undefined`
// to different default locales. Always format with an explicit locale.
const numberFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const decimalFormatterCache = new Map();

function getDecimalFormatter(decimals) {
  let fmt = decimalFormatterCache.get(decimals);
  if (!fmt) {
    fmt = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    decimalFormatterCache.set(decimals, fmt);
  }
  return fmt;
}

export function formatNumber(value, decimals = 0) {
  const num = typeof value === 'number' ? value : Number(value) || 0;
  if (decimals > 0) return getDecimalFormatter(decimals).format(num);
  return numberFormatter.format(num);
}
