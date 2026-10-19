'use client';

import React from 'react';
import { useTheme } from './ThemeProvider';
import { Moon, Sun, User, Bell } from 'lucide-react';

export default function Navbar() {
  const { theme, toggleTheme, clinicName, logoFile } = useTheme();
  const [userName, setUserName] = React.useState('Dr. Silva');
  const [userRole, setUserRole] = React.useState('Cardiologia');

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem('clinic_doctor_profile');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.name) setUserName(parsed.name);
        if (parsed.specialty) setUserRole(parsed.specialty);
      } else {
        const userStored = localStorage.getItem('clinic_user');
        if (userStored) {
          const user = JSON.parse(userStored);
          if (user.name) setUserName(user.name);
          if (user.role) setUserRole(user.role === 'doctor' ? 'Médico' : user.role === 'assistant' ? 'Assistente' : 'Gestão');
        }
      }
    } catch {}
  }, []);

  const initials = userName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(n => n[0].toUpperCase())
    .join('');

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
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {logoFile && logoFile !== '[LOGO_UPLOADED]' ? (
          <img 
            src={logoFile} 
            alt={clinicName} 
            style={{ 
              height: '38px', 
              maxWidth: '140px', 
              objectFit: 'contain', 
              borderRadius: '6px' 
            }} 
          />
        ) : (
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 800,
            fontSize: '1rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
          }}>
            ✚
          </div>
        )}
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
            <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }}>{userName}</p>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{userRole}</span>
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
            fontSize: '1rem',
            fontWeight: 'bold',
            boxShadow: 'var(--shadow-sm)'
          }}>
            {initials || 'CL'}
          </div>
        </div>
      </div>
    </header>
  );
}
