'use client';

import React from 'react';
import { useTheme } from './ThemeProvider';
import { Moon, Sun, User, Bell } from 'lucide-react';

export default function Navbar() {
  const { theme, toggleTheme, clinicName } = useTheme();

  return (
    <header style={{
      height: '70px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 2rem',
      backgroundColor: 'var(--bg-glass)',
      borderBottom: '1px solid var(--border-color)',
      position: 'sticky',
      top: 0,
      zIndex: 10
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <h1 className="clinic-logo" style={{ fontSize: '1.2rem', fontWeight: 700 }}>
          {clinicName}
        </h1>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <button 
          onClick={toggleTheme}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title={theme === 'light' ? 'Ativar Modo Escuro' : 'Ativar Modo Claro'}
        >
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>

        <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
          <Bell size={20} />
        </button>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.8rem',
          paddingLeft: '1.5rem',
          borderLeft: '1px solid var(--border-color)'
        }}>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }}>Dr. Silva</p>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Cardiologia</span>
          </div>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.1rem',
            fontWeight: 'bold',
            boxShadow: 'var(--shadow-sm)'
          }}>
            DS
          </div>
        </div>
      </div>
    </header>
  );
}
