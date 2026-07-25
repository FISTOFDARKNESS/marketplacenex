'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import { formatNumber } from '@/lib/format';
import { Heart, X, ShoppingCart, Trash2, Star, Gem } from 'lucide-react';

const LANG = {
  en: {
    title: 'Favorites',
    empty: "You haven't saved any items yet.",
    emptyHint: 'Tap the ♥ on any item to save it here.',
    remove: 'Remove',
    buy: 'Buy now',
    rap: 'RAP',
    legendary: 'Legendary',
    rare: 'Rare',
  },
  pt: {
    title: 'Favoritos',
    empty: 'Você ainda não salvou nenhum item.',
    emptyHint: 'Toque no ♥ em qualquer item para salvá-lo aqui.',
    remove: 'Remover',
    buy: 'Comprar agora',
    rap: 'RAP',
    legendary: 'Lendário',
    rare: 'Raro',
  },
  it: {
    title: 'Preferiti',
    empty: 'Non hai ancora salvato nessun oggetto.',
    emptyHint: 'Tocca il ♥ su qualsiasi oggetto per salvarlo qui.',
    remove: 'Rimuovi',
    buy: 'Acquista ora',
    rap: 'RAP',
    legendary: 'Leggendario',
    rare: 'Raro',
  },
  es: {
    title: 'Favoritos',
    empty: 'Aún no has guardado ningún artículo.',
    emptyHint: 'Toca el ♥ en cualquier artículo para guardarlo aquí.',
    remove: 'Eliminar',
    buy: 'Comprar ahora',
    rap: 'RAP',
    legendary: 'Legendario',
    rare: 'Raro',
  },
  fr: {
    title: 'Favoris',
    empty: "Vous n'avez encore enregistré aucun article.",
    emptyHint: "Appuyez sur le ♥ sur n'importe quel article pour le sauvegarder ici.",
    remove: 'Supprimer',
    buy: 'Acheter maintenant',
    rap: 'RAP',
    legendary: 'Légendaire',
    rare: 'Rare',
  },
  de: {
    title: 'Favoriten',
    empty: 'Du hast noch keine Artikel gespeichert.',
    emptyHint: 'Tippe auf das ♥ bei einem Artikel, um ihn hier zu speichern.',
    remove: 'Entfernen',
    buy: 'Jetzt kaufen',
    rap: 'RAP',
    legendary: 'Legendär',
    rare: 'Selten',
  },
};

export default function WishlistDrawer({
  open,
  onClose,
  wishlistItems,   // array of full item objects
  onRemove,        // (itemId) => void
  onBuyClick,      // (item) => void
  lang = 'en',
}) {
  const t = LANG[lang] || LANG.en;

  // Close drawer on Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`wl-backdrop ${open ? 'wl-open' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <aside className={`wl-drawer ${open ? 'wl-open' : ''}`} role="dialog" aria-label={t.title}>
        {/* Header */}
        <div className="wl-header">
          <div className="wl-header-left">
            <Heart className="icon" style={{ color: 'var(--gold)', fill: 'var(--gold)' }} />
            <span className="wl-title">{t.title}</span>
            {wishlistItems.length > 0 && (
              <span className="wl-count">{wishlistItems.length}</span>
            )}
          </div>
          <button className="wl-close-btn" onClick={onClose} aria-label="Close">
            <X className="icon" />
          </button>
        </div>

        {/* Content */}
        <div className="wl-body">
          {wishlistItems.length === 0 ? (
            <div className="wl-empty">
              <div className="wl-empty-icon">
                <Heart style={{ width: 48, height: 48, stroke: 'var(--muted)', opacity: 0.4 }} />
              </div>
              <p className="wl-empty-title">{t.empty}</p>
              <p className="wl-empty-hint">{t.emptyHint}</p>
            </div>
          ) : (
            <ul className="wl-list">
              {wishlistItems.map((item) => (
                <li key={item.id} className="wl-item">
                  <div className="wl-item-img">
                    <Image src={item.img} alt={item.name} width={150} height={150} sizes="100px" />
                    {item.rarity === 'legendary' && (
                      <span className="wl-rarity-badge legendary">
                        <Gem style={{ width: 10, height: 10 }} />
                        {t.legendary}
                      </span>
                    )}
                    {item.rarity === 'rare' && (
                      <span className="wl-rarity-badge rare">
                        <Star style={{ width: 10, height: 10 }} />
                        {t.rare}
                      </span>
                    )}
                  </div>
                  <div className="wl-item-info">
                    <p className="wl-item-name">{item.name}</p>
                    <div className="wl-item-meta">
                      <span className="wl-item-rap">{t.rap}: {item.rapLabel}</span>
                      <span className="wl-item-price">${formatNumber(item.price)}</span>
                    </div>
                    <div className="wl-item-actions">
                      <button
                        className="wl-buy-btn"
                        onClick={() => { onBuyClick(item); onClose(); }}
                      >
                        <ShoppingCart style={{ width: 13, height: 13 }} />
                        {t.buy}
                      </button>
                      <button
                        className="wl-remove-btn"
                        onClick={() => onRemove(item.id)}
                        title={t.remove}
                        aria-label={t.remove}
                      >
                        <Trash2 style={{ width: 14, height: 14 }} />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
    </>
  );
}
