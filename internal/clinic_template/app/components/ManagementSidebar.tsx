'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, BarChart3, Settings, LogOut } from 'lucide-react';

export default function ManagementSidebar() {
  const pathname = usePathname();

  const menuItems = [
    { name: 'Dashboard', path: '/management', icon: LayoutDashboard },
    { name: 'Equipe', path: '/management/staff', icon: Users },
    { name: 'Faturamento', path: '/management/billing', icon: BarChart3 },
    { name: 'Configurações', path: '/management/config', icon: Settings },
  ];

  return (
    <aside style={{
      width: '260px',
      height: 'calc(100vh - 70px)',
      padding: '2rem 1.5rem',
      display: 'flex',
      flexDirection: 'column',
      borderRight: '1px solid var(--border-color)',
      backgroundColor: 'var(--bg-glass)',
      position: 'sticky',
      top: '70px',
      overflowY: 'auto'
    }}>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {menuItems.map(item => {
          const isActive = pathname === item.path;
          const Icon = item.icon;
          return (
            <Link href={item.path} key={item.name} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              padding: '0.8rem 1rem',
              borderRadius: '12px',
              backgroundColor: isActive ? 'var(--color-primary)' : 'transparent',
              color: isActive ? '#fff' : 'var(--text-secondary)',
              fontWeight: isActive ? 600 : 500,
              transition: 'all 0.2s ease'
            }}>
              <Icon size={20} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div style={{ marginTop: 'auto', paddingTop: '2rem' }}>
        <Link href="/" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          padding: '0.8rem 1rem',
          color: 'var(--text-muted)',
          fontSize: '0.9rem',
          fontWeight: 500,
          transition: 'color 0.2s ease'
        }}>
          <LogOut size={20} /> Sair
        </Link>
      </div>
    </aside>
  );
}
