'use client';

import React from 'react';
import { User, Mail, Phone, Shield, Briefcase } from 'lucide-react';

export default function ManagementConfigPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header>
        <h1 className="text-gradient" style={{ fontSize: '2rem', fontWeight: 800 }}>Configurações</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Dados do perfil e preferências do gestor.</p>
      </header>

      <section className="glass-panel" style={{ padding: '2rem' }}>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
          Perfil Administrativo
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {[
            { icon: User, label: 'Nome', value: 'Ricardo Oliveira' },
            { icon: Mail, label: 'E-mail', value: 'ricardo.gestao@clinica.com' },
            { icon: Phone, label: 'Telefone', value: '(11) 91234-5678' },
            { icon: Briefcase, label: 'Cargo', value: 'Administrador Hospitalar' },
            { icon: Shield, label: 'Nível de Acesso', value: 'Administrador (Total)' },
          ].map(field => {
            const Icon = field.icon;
            return (
              <div key={field.label} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--badge-blue-bg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Icon size={18} color="var(--color-accent)" />
                </div>
                <div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block' }}>{field.label}</span>
                  <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-primary)' }}>{field.value}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
