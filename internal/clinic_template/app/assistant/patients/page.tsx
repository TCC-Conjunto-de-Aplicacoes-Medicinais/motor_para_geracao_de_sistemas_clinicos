'use client';

import React, { useState } from 'react';
import { Search, Phone } from 'lucide-react';

const MOCK_PATIENTS = [
  { name: 'Maria Santos', gender: 'F', age: 45, phone: '(11) 99123-4567', insurance: 'SulAmérica', lastVisit: '10/05' },
  { name: 'João Pereira', gender: 'M', age: 62, phone: '(11) 98765-4321', insurance: 'Bradesco', lastVisit: '08/05' },
  { name: 'Ana Lima', gender: 'F', age: 33, phone: '(11) 97654-3210', insurance: 'Unimed', lastVisit: '05/05' },
  { name: 'Carlos Oliveira', gender: 'M', age: 58, phone: '(11) 96543-2109', insurance: 'Particular', lastVisit: '01/05' },
  { name: 'Fernanda Costa', gender: 'F', age: 27, phone: '(11) 95432-1098', insurance: 'SulAmérica', lastVisit: '28/04' },
  { name: 'Ricardo Alves', gender: 'M', age: 41, phone: '(11) 94321-0987', insurance: 'Bradesco', lastVisit: '25/04' },
  { name: 'Lucia Ribeiro', gender: 'F', age: 55, phone: '(11) 93210-9876', insurance: 'Unimed', lastVisit: '22/04' },
  { name: 'Pedro Martins', gender: 'M', age: 36, phone: '(11) 92109-8765', insurance: 'Particular', lastVisit: '20/04' },
];

const insuranceColors: Record<string, string> = {
  'SulAmérica': '#3B82F6',
  'Bradesco': '#EF4444',
  'Unimed': '#10B981',
  'Particular': '#F59E0B',
};

export default function AssistantPatientsPage() {
  const [search, setSearch] = useState('');

  const filtered = MOCK_PATIENTS.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.insurance.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header>
        <h1 className="text-gradient" style={{ fontSize: '2rem', fontWeight: 800 }}>Pacientes</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Consulta rápida de informações dos pacientes cadastrados.</p>
      </header>

      {/* Search */}
      <div style={{ position: 'relative', maxWidth: '400px' }}>
        <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nome ou convênio..."
          style={{
            width: '100%',
            padding: '0.8rem 0.8rem 0.8rem 2.5rem',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-glass)',
            color: 'var(--text-primary)',
            fontSize: '0.95rem',
            outline: 'none',
          }}
        />
      </div>

      {/* Patient Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {filtered.map(patient => {
          const insColor = insuranceColors[patient.insurance] || 'var(--color-accent)';
          return (
            <div key={patient.name} className="glass-panel" style={{
              padding: '1.5rem',
              transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
              cursor: 'default',
            }}>
              {/* Top: Avatar + Name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--badge-blue-bg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-accent)' }}>
                    {patient.name.charAt(0)}
                  </span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                    {patient.name}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
                    <span style={{
                      padding: '0.15rem 0.5rem',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      backgroundColor: patient.gender === 'F' ? 'rgba(236, 72, 153, 0.12)' : 'rgba(59, 130, 246, 0.12)',
                      color: patient.gender === 'F' ? '#EC4899' : '#3B82F6',
                    }}>
                      {patient.gender === 'F' ? '♀ Fem' : '♂ Masc'}
                    </span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {patient.age} anos
                    </span>
                  </div>
                </div>
              </div>

              {/* Info rows */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Phone size={14} color="var(--text-muted)" />
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{patient.phone}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: insColor, flexShrink: 0 }} />
                  <span style={{ fontSize: '0.9rem', fontWeight: 500, color: insColor }}>{patient.insurance}</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Último atendimento: {patient.lastVisit}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
