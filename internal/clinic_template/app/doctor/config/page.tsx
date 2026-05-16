'use client';

import React from 'react';
import { useTheme } from '../../components/ThemeProvider';

export default function ConfigPage() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '800px' }}>
      <header>
        <h1 className="text-gradient" style={{ fontSize: '2rem', fontWeight: 800 }}>Configurações</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Gerencie suas preferências de sistema e perfil.</p>
      </header>

      <section className="glass-panel" style={{ padding: '2rem' }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
          Preferências Visuais
        </h2>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>Modo de Exibição</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Alterne entre o modo claro e escuro para maior conforto visual.</p>
          </div>
          <button onClick={toggleTheme} style={{
            padding: '0.6rem 1.5rem',
            borderRadius: '8px',
            border: '1px solid var(--color-primary)',
            backgroundColor: theme === 'dark' ? 'var(--color-primary)' : 'transparent',
            color: theme === 'dark' ? '#fff' : 'var(--color-primary)',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}>
            {theme === 'light' ? 'Ativar Modo Escuro' : 'Ativar Modo Claro'}
          </button>
        </div>
      </section>

      <section className="glass-panel" style={{ padding: '2rem' }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
          Perfil Profissional
        </h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 600 }}>Nome Completo</label>
              <input type="text" defaultValue="Dr. Silva" style={{
                width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)'
              }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 600 }}>Especialidade</label>
              <input type="text" defaultValue="Cardiologia" style={{
                width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)'
              }} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 600 }}>CRM</label>
              <input type="text" defaultValue="12345-SP" style={{
                width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)'
              }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 600 }}>E-mail de Contato</label>
              <input type="email" defaultValue="dr.silva@clinica.com" style={{
                width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)'
              }} />
            </div>
          </div>
          
          <div style={{ marginTop: '1rem', textAlign: 'right' }}>
            <button style={{
              padding: '0.8rem 2rem',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: 'var(--color-primary)',
              color: '#fff',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: 'var(--shadow-md)'
            }}>
              Salvar Alterações
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
