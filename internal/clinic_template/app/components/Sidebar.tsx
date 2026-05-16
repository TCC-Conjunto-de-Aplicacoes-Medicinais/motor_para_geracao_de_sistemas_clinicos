'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, CalendarDays, History, Settings, LogOut } from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();

  const menuItems = [
    { name: 'Dashboard', path: '/doctor', icon: LayoutDashboard },
    { name: 'Pacientes', path: '/doctor/patients', icon: Users },
    { name: 'Agenda', path: '/doctor/schedule', icon: CalendarDays },
    { name: 'Histórico', path: '/doctor/history', icon: History },
    { name: 'Configurações', path: '/doctor/config', icon: Settings },
  ];

  return (
    <aside style={{
      width: '260px',
      height: 'calc(100vh - 70px)', // Desconta a altura da Navbar
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
