export function sanitizeHtml(dirty: string): string {
  if (typeof window === 'undefined') return dirty;
  const purify = require('dompurify');
  return purify.sanitize(dirty, { ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'], ALLOWED_ATTR: ['href', 'target', 'rel'] });
}

export function sanitizeText(dirty: string): string {
  if (typeof window === 'undefined') return dirty;
  const purify = require('dompurify');
  return purify.sanitize(dirty, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
}

export function sanitizeDescription(dirty: string): string {
  if (typeof window === 'undefined') return dirty;
  const purify = require('dompurify');
  return purify.sanitize(dirty, { ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'code', 'pre'], ALLOWED_ATTR: ['href', 'target', 'rel', 'class'] });
}