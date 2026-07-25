'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Tag, Package, Backpack, Clock, ArrowLeftRight, HelpCircle, Settings,
  Crown, LogOut, ArrowLeft, Menu, X
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/sell', label: 'Sell', icon: Tag },
  { href: '/orders', label: 'Orders', icon: Package },
  { href: '/inventory', label: 'Inventory', icon: Backpack },
  { href: '/history', label: 'History', icon: Clock },
  { href: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { href: '/help', label: 'Help', icon: HelpCircle },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ onLogout }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <>
      <button className="mobile-menu-btn" onClick={() => setMenuOpen(true)} aria-label="Open menu">
        <Menu size={22} />
      </button>

      {menuOpen && <div className="sidebar-backdrop" onClick={closeMenu} />}

      <aside className={`sidebar${menuOpen ? ' sidebar-open' : ''}`}>
        <div className="sidebar-header show-mobile">
          <Link href="/" className="sidebar-logo" onClick={closeMenu} style={{ textDecoration: 'none' }}>
            <Crown size={22} style={{ color: '#f59e0b' }} />
            <span>NexBlox</span>
          </Link>
          <button className="mobile-close-btn" onClick={closeMenu} aria-label="Close menu">
            <X size={20} />
          </button>
        </div>
        <Link href="/" className="sidebar-logo hide-mobile" style={{ textDecoration: 'none' }}>
          <Crown size={22} style={{ color: '#f59e0b' }} />
          <span>NexBlox</span>
        </Link>

        <nav className="sidebar-nav">
          {navItems.map(item => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMenu}
                className={`sidebar-link${active ? ' active' : ''}`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
                {active && <span className="sidebar-indicator" />}
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <Link href="/" onClick={closeMenu} className="sidebar-link" style={{ width: '100%', color: '#9ca3af' }}>
            <ArrowLeft size={18} />
            <span>Back to Menu</span>
          </Link>
          <button className="sidebar-link" onClick={() => { closeMenu(); onLogout(); }} style={{ color: '#ef4444', width: '100%' }}>
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
