'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Search, Filter, MoreVertical } from 'lucide-react';

const MOCK_PATIENTS = [
  { id: '1', name: 'Maria Souza', age: 45, lastVisit: '10/04/2026', status: 'Ativo' },
  { id: '2', name: 'João Pereira', age: 32, lastVisit: '05/04/2026', status: 'Em Tratamento' },
  { id: '3', name: 'Ana Lima', age: 28, lastVisit: '12/03/2026', status: 'Alta' },
  { id: '4', name: 'Carlos Santos', age: 60, lastVisit: '01/05/2026', status: 'Ativo' },
];

export default function PatientsPage() {
  const router = useRouter();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="text-gradient" style={{ fontSize: '2rem', fontWeight: 800 }}>Pacientes</h1>
        <button style={{
          padding: '0.8rem 1.5rem',
          borderRadius: '8px',
          border: 'none',
          backgroundColor: 'var(--color-primary)',
          color: '#fff',
          fontWeight: 600,
          cursor: 'pointer',
          boxShadow: 'var(--shadow-md)'
        }}>
          + Novo Paciente
        </button>
      </header>

      <section className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ 
            flex: 1, 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            padding: '0.8rem 1rem', 
            borderRadius: '8px', 
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-app)'
          }}>
            <Search size={20} color="var(--text-muted)" />
            <input 
              type="text" 
              placeholder="Buscar por nome, CPF ou prontuário..." 
              style={{ border: 'none', background: 'transparent', width: '100%', outline: 'none', color: 'var(--text-primary)' }} 
            />
          </div>
          <button style={{
            padding: '0 1.5rem',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-app)',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            cursor: 'pointer'
          }}>
            <Filter size={20} /> Filtros
          </button>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)' }}>
              <th style={{ padding: '1rem', fontWeight: 600 }}>Nome</th>
              <th style={{ padding: '1rem', fontWeight: 600 }}>Idade</th>
              <th style={{ padding: '1rem', fontWeight: 600 }}>Última Consulta</th>
              <th style={{ padding: '1rem', fontWeight: 600 }}>Status</th>
              <th style={{ padding: '1rem', fontWeight: 600 }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_PATIENTS.map(p => (
              <tr 
                key={p.id} 
                onClick={() => router.push(`/doctor/patients/${p.id}`)}
                style={{ 
                  borderBottom: '1px solid var(--border-color)', 
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-app)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <td style={{ padding: '1rem', fontWeight: 500 }}>{p.name}</td>
                <td style={{ padding: '1rem' }}>{p.age} anos</td>
                <td style={{ padding: '1rem' }}>{p.lastVisit}</td>
                <td style={{ padding: '1rem' }}>
                  <span style={{
                    padding: '0.3rem 0.8rem',
                    borderRadius: '20px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    backgroundColor: p.status === 'Alta' ? '#D1FAE5' : p.status === 'Em Tratamento' ? '#FEF3C7' : '#DBEAFE',
                    color: p.status === 'Alta' ? '#065F46' : p.status === 'Em Tratamento' ? '#92400E' : '#1E40AF'
                  }}>
                    {p.status}
                  </span>
                </td>
                <td style={{ padding: '1rem' }}>
                  <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                    <MoreVertical size={20} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
