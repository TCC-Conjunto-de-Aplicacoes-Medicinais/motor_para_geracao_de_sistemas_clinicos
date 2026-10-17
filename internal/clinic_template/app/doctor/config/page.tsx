'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from '../../components/ThemeProvider';

export default function ConfigPage() {
  const { theme, toggleTheme } = useTheme();

  const [name, setName] = useState('Dr. Silva');
  const [specialty, setSpecialty] = useState('Cardiologia');
  const [crm, setCrm] = useState('12345-SP');
  const [email, setEmail] = useState('dr.silva@clinica.com');
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('clinic_doctor_profile');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.name) setName(parsed.name);
        if (parsed.specialty) setSpecialty(parsed.specialty);
        if (parsed.crm) setCrm(parsed.crm);
        if (parsed.email) setEmail(parsed.email);
      } else {
        const userStored = localStorage.getItem('clinic_user');
        if (userStored) {
          const user = JSON.parse(userStored);
          if (user.name) setName(user.name);
        }
      }
    } catch (e) {
      console.error('Erro ao ler perfil do médico:', e);
    }
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSavedSuccess(false);

    setTimeout(() => {
      const profile = { name, specialty, crm, email };
      localStorage.setItem('clinic_doctor_profile', JSON.stringify(profile));

      // Atualiza também clinic_user para sincronizar o nome na sessão
      try {
        const userStored = localStorage.getItem('clinic_user');
        const user = userStored ? JSON.parse(userStored) : {};
        user.name = name;
        localStorage.setItem('clinic_user', JSON.stringify(user));
      } catch {}

      setIsSaving(false);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    }, 500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '800px' }}>
      <header>
        <h1 className="text-gradient" style={{ fontSize: '2rem', fontWeight: 800 }}>Configurações</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Gerencie suas preferências de sistema e perfil profissional.</p>
      </header>

      {savedSuccess && (
        <div style={{
          padding: '1rem 1.5rem',
          borderRadius: '8px',
          backgroundColor: 'rgba(16, 185, 129, 0.15)',
          color: '#10B981',
          border: '1px solid #10B981',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '0.8rem'
        }}>
          <span>✓</span> Perfil profissional atualizado com sucesso!
        </div>
      )}

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
        
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 600 }}>Nome Completo</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                style={{
                  width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)'
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 600 }}>Especialidade</label>
              <input
                type="text"
                value={specialty}
                onChange={e => setSpecialty(e.target.value)}
                style={{
                  width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 600 }}>CRM</label>
              <input
                type="text"
                value={crm}
                onChange={e => setCrm(e.target.value)}
                style={{
                  width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)'
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 600 }}>E-mail de Contato</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{
                  width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)'
                }}
              />
            </div>
          </div>
          
          <div style={{ marginTop: '1rem', textAlign: 'right' }}>
            <button
              type="submit"
              disabled={isSaving}
              style={{
                padding: '0.8rem 2rem',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: isSaving ? 'var(--text-muted)' : 'var(--color-primary)',
                color: '#fff',
                fontWeight: 600,
                cursor: isSaving ? 'not-allowed' : 'pointer',
                boxShadow: 'var(--shadow-md)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.6rem',
                transition: 'all 0.2s ease'
              }}
            >
              {isSaving ? 'Salvando alterações... ⏳' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
