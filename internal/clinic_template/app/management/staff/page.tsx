'use client';

import React from 'react';
import { UserPlus, UserMinus, MoreHorizontal } from 'lucide-react';

const MOCK_STAFF = [
  { name: 'Dr. Silva', role: 'Médico', status: 'ativo', days: 20, absences: 1, presence: 95 },
  { name: 'Dra. Lima', role: 'Médica', status: 'ativo', days: 19, absences: 2, presence: 90 },
  { name: 'Dr. Santos', role: 'Médico', status: 'ativo', days: 21, absences: 0, presence: 100 },
  { name: 'Carla M.', role: 'Assistente', status: 'ativo', days: 22, absences: 1, presence: 96 },
  { name: 'Juliana R.', role: 'Assistente', status: 'ativo', days: 22, absences: 0, presence: 100 },
  { name: 'Roberto S.', role: 'Assistente', status: 'inativo', days: 0, absences: 0, presence: 0 },
];

export default function StaffPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="text-gradient" style={{ fontSize: '2rem', fontWeight: 800 }}>Equipe & Presença</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Gerencie os funcionários e monitore o controle de presença mensal.</p>
        </div>
        <button style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem', 
          padding: '0.6rem 1.2rem', 
          backgroundColor: 'var(--color-primary)', 
          color: '#fff', 
          border: 'none', 
          borderRadius: '8px', 
          fontWeight: 600,
          cursor: 'pointer'
        }}>
          <UserPlus size={18} /> Cadastrar Funcionário
        </button>
      </header>

      {/* Summary Cards */}
      <div style={{ display: 'flex', gap: '1.5rem' }}>
        {[
          { label: 'Ativos', value: 5, color: 'var(--color-accent)' },
          { label: 'Médicos', value: 3, color: 'var(--color-primary)' },
          { label: 'Assistentes', value: 2, color: '#3B82F6' },
          { label: 'Inativos', value: 1, color: '#EF4444' },
        ].map(stat => (
          <div key={stat.label} className="glass-panel" style={{ flex: 1, padding: '1.5rem', textAlign: 'center' }}>
            <span style={{ fontSize: '2rem', fontWeight: 800, color: stat.color, lineHeight: 1 }}>{stat.value}</span>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.3rem' }}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Staff Table */}
      <section className="glass-panel" style={{ overflow: 'hidden' }}>
        <div style={{ minWidth: '800px' }}>
          {/* Table Header */}
          <div style={{ 
            display: 'flex', 
            padding: '1rem 1.5rem', 
            borderBottom: '1px solid var(--border-color)', 
            backgroundColor: 'var(--bg-glass)',
            color: 'var(--text-muted)',
            fontSize: '0.75rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            <div style={{ flex: 2 }}>Funcionário</div>
            <div style={{ flex: 1, textAlign: 'center' }}>Cargo</div>
            <div style={{ flex: 1, textAlign: 'center' }}>Dias Trab.</div>
            <div style={{ flex: 1, textAlign: 'center' }}>Faltas</div>
            <div style={{ flex: 1.5, textAlign: 'center' }}>Presença</div>
            <div style={{ width: '40px' }}></div>
          </div>

          {/* Table Body */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {MOCK_STAFF.map((member, i) => {
              const presenceColor = member.presence >= 95 ? 'var(--color-accent)' : member.presence >= 85 ? '#F59E0B' : '#EF4444';
              return (
                <div key={member.name} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  padding: '1rem 1.5rem', 
                  borderBottom: i < MOCK_STAFF.length - 1 ? '1px solid var(--border-color)' : 'none',
                  opacity: member.status === 'inativo' ? 0.5 : 1,
                  transition: 'background-color 0.2s ease'
                }}>
                  {/* Name + Status */}
                  <div style={{ flex: 2, display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ 
                      width: '40px', 
                      height: '40px', 
                      borderRadius: '50%', 
                      backgroundColor: 'var(--bg-app)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      fontWeight: 700,
                      color: 'var(--color-accent)',
                      border: '1px solid var(--border-color)'
                    }}>
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{member.name}</h4>
                      <span style={{ 
                        fontSize: '0.7rem', 
                        fontWeight: 700, 
                        color: member.status === 'ativo' ? 'var(--badge-green-text)' : 'var(--badge-red-text)',
                        textTransform: 'uppercase'
                      }}>
                        {member.status}
                      </span>
                    </div>
                  </div>

                  {/* Cargo */}
                  <div style={{ flex: 1, textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    {member.role}
                  </div>

                  {/* Dias */}
                  <div style={{ flex: 1, textAlign: 'center', fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {member.days}
                  </div>

                  {/* Faltas */}
                  <div style={{ flex: 1, textAlign: 'center', fontSize: '0.95rem', fontWeight: 600, color: member.absences > 0 ? '#EF4444' : 'var(--text-primary)' }}>
                    {member.absences}
                  </div>

                  {/* Presença % with bar */}
                  <div style={{ flex: 1.5, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: presenceColor }}>{member.presence}%</span>
                    <div style={{ width: '80%', height: '4px', backgroundColor: 'var(--bg-app)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ width: `${member.presence}%`, height: '100%', backgroundColor: presenceColor }} />
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ width: '40px', display: 'flex', justifyContent: 'center', color: 'var(--text-muted)', cursor: 'pointer' }}>
                    <MoreHorizontal size={18} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Quick Actions Footer */}
      <div style={{ display: 'flex', gap: '1rem' }}>
        <button style={{ flex: 1, padding: '1rem', borderRadius: '12px', border: '1px dashed var(--border-color)', background: 'transparent', color: 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          <UserPlus size={18} /> Adicionar novo cargo
        </button>
        <button style={{ flex: 1, padding: '1rem', borderRadius: '12px', border: '1px dashed var(--border-color)', background: 'transparent', color: '#EF4444', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          <UserMinus size={18} /> Relatório de desligamento
        </button>
      </div>
    </div>
  );
}
