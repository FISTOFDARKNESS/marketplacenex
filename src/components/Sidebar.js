'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Tag, Package, Clock, ArrowLeftRight, HelpCircle, Settings, Crown, LogOut, ArrowLeft
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/sell', label: 'Sell', icon: Tag },
  { href: '/orders', label: 'Orders', icon: Package },
  { href: '/history', label: 'History', icon: Clock },
  { href: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { href: '/help', label: 'Help', icon: HelpCircle },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ onLogout }) {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <Link href="/" className="sidebar-logo" style={{ textDecoration: 'none' }}>
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
        <Link href="/" className="sidebar-link" style={{ width: '100%', color: '#9ca3af' }}>
          <ArrowLeft size={18} />
          <span>Back to Menu</span>
        </Link>
        <button className="sidebar-link" onClick={onLogout} style={{ color: '#ef4444', width: '100%' }}>
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
