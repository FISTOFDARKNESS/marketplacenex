'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import MarqueeBar from '@/components/MarqueeBar';
import TrustBar from '@/components/TrustBar';
import Catalog from '@/components/Catalog';
import HowItWorks from '@/components/HowItWorks';
import Testimonials from '@/components/Testimonials';
import FAQ from '@/components/FAQ';
import Footer from '@/components/Footer';
import Toast from '@/components/Toast';
import { useLang } from '@/lib/LanguageProvider';

// Interactive overlays: code-split and skip SSR (they mount only on user action)
const AuthModal = dynamic(() => import('@/components/Modals').then((m) => m.AuthModal), { ssr: false });
const PurchaseModal = dynamic(() => import('@/components/PurchaseModal'), { ssr: false });
const FinancePanel = dynamic(() => import('@/components/finance/FinancePanel'), { ssr: false });
const WishlistDrawer = dynamic(() => import('@/components/WishlistDrawer'), { ssr: false });

export default function Home() {
  const { lang } = useLang();
  const searchParams = useSearchParams();
  const [user, setUser] = useState(null);
  const [items, setItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [totalItems, setTotalItems] = useState(0);

  // Filters state
  const [activeCatFilter, setActiveCatFilter] = useState('all');
  const [activeRarityFilter, setActiveRarityFilter] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [minPrice, setMinPrice] = useState(null);
  const [maxPrice, setMaxPrice] = useState(null);
  const [sortMode, setSortMode] = useState('demand');

  const [wishlist, setWishlist] = useState(new Set());       // set of itemIds
  const [wishlistItems, setWishlistItems] = useState([]);     // full item objects
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [modalState, setModalState] = useState({ type: null, data: null }); // type: 'login' | 'register' | 'detail' | null
  const [financeOpen, setFinanceOpen] = useState(false);

  // Fetch current user on mount
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated) {
            setUser(data.user);
          }
        }
      } catch {
        // Silently ignore if not authenticated
      }
    }
    checkAuth();
  }, []);

  // Fetch items whenever filter options change
  useEffect(() => {
    let cancelled = false;
    async function fetchListings(retries = 2) {
      setLoadingItems(true);
      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          const params = new URLSearchParams();
          if (activeCatFilter !== 'all') params.append('cat', activeCatFilter);
          if (activeRarityFilter) params.append('rarity', activeRarityFilter);
          if (searchTerm) params.append('search', searchTerm);
          if (minPrice !== null) params.append('minPrice', minPrice);
          if (maxPrice !== null) params.append('maxPrice', maxPrice);
          params.append('sort', sortMode);
          params.append('_t', Date.now());

          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 30000);

          const res = await fetch(`/api/items?${params.toString()}`, { signal: controller.signal });
          clearTimeout(timeout);
           if (res.ok) {
             const data = await res.json();
             if (!cancelled) {
               setItems(data.items || []);
               if (typeof data.total === 'number') setTotalItems(data.total);
             }
             return;
           }
        } catch {
          if (attempt < retries) {
            await new Promise(r => setTimeout(r, 1000));
          }
          // On final failure, loadingItems stays false and the empty-state
          // fallback is shown — no console noise.
        } finally {
          if (!cancelled) setLoadingItems(false);
        }
      }
    }

    const delayDebounceFn = setTimeout(() => {
      fetchListings();
    }, 200);

    return () => { clearTimeout(delayDebounceFn); cancelled = true; };
  }, [activeCatFilter, activeRarityFilter, searchTerm, minPrice, maxPrice, sortMode]);

  // Auto-open purchase modal when URL has ?item= (from push notification click)
  useEffect(() => {
    const itemId = searchParams.get('item');
    if (!itemId) return;
    window.history.replaceState({}, '', '/');
    if (!user) {
      setModalState({ type: 'login', data: null });
      return;
    }
    const found = items.find((i) => i.id === itemId);
    if (found) { setModalState({ type: 'purchase', data: found }); return; }
    fetch(`/api/items/${itemId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.item) setModalState({ type: 'purchase', data: d.item });
      })
      .catch(() => {});
  }, [searchParams, user, items]);

  const addToast = (icon, message) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, icon, message }]);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        setUser(null);
        addToast('check-circle', lang === 'pt' ? 'Sessão encerrada com sucesso' : 'Logged out successfully');
      }
    } catch (err) {
      addToast('alert-triangle', lang === 'pt' ? 'Falha ao sair' : 'Failed to logout');
    }
  };

  const handleBuyClick = (item) => {
    if (!user) {
      addToast('info', lang === 'pt' ? 'Por favor faça login para comprar' : 'Please login to buy items');
      setModalState({ type: 'login', data: null });
      return;
    }
    setModalState({ type: 'purchase', data: item });
  };

  // Load wishlist from the DB (call after login or on mount when authenticated)
  const loadWishlist = useCallback(async () => {
    try {
      const res = await fetch('/api/wishlist');
      if (res.ok) {
        const data = await res.json();
        setWishlistItems(data.items || []);
        setWishlist(new Set((data.items || []).map((i) => i.id)));
      } else {
        // Not logged in – clear
        setWishlistItems([]);
        setWishlist(new Set());
      }
    } catch { /* ignore */ }
  }, []);

  const toggleWishlist = async (itemId) => {
    const isIn = wishlist.has(itemId);
    // Optimistic UI update
    const updated = new Set(wishlist);
    if (isIn) {
      updated.delete(itemId);
      setWishlist(updated);
      setWishlistItems((prev) => prev.filter((i) => i.id !== itemId));
      addToast('info', lang === 'pt' ? 'Removido dos favoritos' : 'Removed from favorites');
    } else {
      updated.add(itemId);
      setWishlist(updated);
      // Find the full item from current listings to show in drawer
      const fullItem = items.find((i) => i.id === itemId);
      if (fullItem) setWishlistItems((prev) => [fullItem, ...prev]);
      addToast('heart', lang === 'pt' ? 'Adicionado aos favoritos!' : 'Added to favorites!');
    }

    // Sync with DB if user is logged in
    if (user) {
      try {
        if (isIn) {
          await fetch('/api/wishlist', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ itemId }) });
        } else {
          await fetch('/api/wishlist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ itemId }) });
        }
      } catch { /* fallback: keep optimistic state */ }
    }
  };

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <Navbar
        user={user}
        wishlistCount={wishlist.size}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onOpenAuth={(type) => setModalState({ type, data: null })}
        onLogout={handleLogout}
        onScrollTo={scrollToSection}
        onOpenWishlist={() => setWishlistOpen(true)}
        onOpenFinance={() => setFinanceOpen(true)}
      />

      <Hero
        onBrowseClick={() => scrollToSection('catalog')}
        onHowItWorksClick={() => scrollToSection('how')}
        itemsListed={totalItems}
        lang={lang}
      />

      <MarqueeBar lang={lang} />

      <TrustBar />

      <Catalog
        items={items}
        loadingItems={loadingItems}
        activeCatFilter={activeCatFilter}
        setActiveCatFilter={setActiveCatFilter}
        activeRarityFilter={activeRarityFilter}
        setActiveRarityFilter={setActiveRarityFilter}
        minPrice={minPrice}
        setMinPrice={setMinPrice}
        maxPrice={maxPrice}
        setMaxPrice={setMaxPrice}
        sortMode={sortMode}
        setSortMode={setSortMode}
        totalItems={totalItems}
        wishlist={wishlist}
        toggleWishlist={toggleWishlist}
        onStartSelling={() => addToast('rocket', lang === 'pt' ? 'Redirecionando para onboarding do vendedor...' : 'Redirecting to seller onboarding...')}
        onCardClick={handleBuyClick}
        onBuyClick={handleBuyClick}
        lang={lang}
      />

      <HowItWorks lang={lang} />

      <Testimonials lang={lang} />

      <FAQ lang={lang} />

      <div className="cta-banner section-wrap">
        <h2>{lang === 'pt' ? 'Pronto para negociar?' : 'Ready to trade?'}</h2>
        <p>{lang === 'pt' ? 'Junte-se a milhares de compradores e vendedores verificados na NexBlox.' : 'Join thousands of verified buyers and sellers on NexBlox.'}</p>
        <button className="hero-cta-primary" onClick={() => scrollToSection('catalog')}>
          {lang === 'pt' ? 'Começar' : 'Get started'}
        </button>
      </div>

      <Footer onScrollTo={scrollToSection} lang={lang} />

      {/* Dynamic Overlays */}
      {modalState.type === 'purchase' && (
        <PurchaseModal
          item={modalState.data}
          user={user}
          onClose={() => setModalState({ type: null, data: null })}
          onOpenFinance={() => setFinanceOpen(true)}
          onPurchaseComplete={(newBalance) => setUser(prev => prev ? { ...prev, balance: newBalance } : prev)}
        />
      )}

      {(modalState.type === 'login' || modalState.type === 'register') && (
        <AuthModal
          type={modalState.type}
          onClose={() => setModalState({ type: null, data: null })}
          onSubmit={(loggedInUser) => {
            setUser(loggedInUser);
            addToast('check-circle', lang === 'pt' ? `Bem-vindo, ${loggedInUser.username}!` : `Welcome, ${loggedInUser.username}!`);
            loadWishlist(); // Sync wishlist from DB after login
          }}
          lang={lang}
        />
      )}

      {financeOpen && (
        <FinancePanel
          user={user}
          onClose={() => setFinanceOpen(false)}
        />
      )}

      <WishlistDrawer
        open={wishlistOpen}
        onClose={() => setWishlistOpen(false)}
        wishlistItems={wishlistItems}
        onRemove={(itemId) => toggleWishlist(itemId)}
        onBuyClick={handleBuyClick}
        lang={lang}
      />

      {/* Notification Toast Stack */}
      <div className="toast-wrap">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            id={toast.id}
            icon={toast.icon}
            message={toast.message}
            onRemove={removeToast}
          />
        ))}
      </div>
    </>
  );
}
