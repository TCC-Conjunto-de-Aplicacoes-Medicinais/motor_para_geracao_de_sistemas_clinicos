'use client';

import React, { useState } from 'react';

type CheckInStatus = 'presente' | 'aguardando' | 'ausente' | 'nao_chegou';

interface CheckInEntry {
  id: number;
  time: string;
  patient: string;
  doctor: string;
  status: CheckInStatus;
}

const STATUS_CONFIG: Record<CheckInStatus, { emoji: string; label: string; color: string; bg: string }> = {
  presente: { emoji: '✅', label: 'Presente', color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)' },
  aguardando: { emoji: '⏳', label: 'Aguardando', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)' },
  ausente: { emoji: '❌', label: 'Ausente', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.1)' },
  nao_chegou: { emoji: '🔜', label: 'Não chegou', color: '#94A3B8', bg: 'rgba(148, 163, 184, 0.1)' },
};

const STATUS_CYCLE: CheckInStatus[] = ['nao_chegou', 'aguardando', 'presente', 'ausente'];

export default function CheckInPage() {
  const [entries, setEntries] = useState<CheckInEntry[]>([
    { id: 1, time: '08:30', patient: 'Maria Santos', doctor: 'Dr. Silva', status: 'presente' },
    { id: 2, time: '09:00', patient: 'João Pereira', doctor: 'Dr. Silva', status: 'presente' },
    { id: 3, time: '09:30', patient: 'Ana Lima', doctor: 'Dra. Lima', status: 'aguardando' },
    { id: 4, time: '10:00', patient: 'Carlos Oliveira', doctor: 'Dr. Silva', status: 'ausente' },
    { id: 5, time: '10:30', patient: 'Fernanda Costa', doctor: 'Dra. Lima', status: 'aguardando' },
    { id: 6, time: '11:00', patient: 'Pedro Martins', doctor: 'Dr. Santos', status: 'nao_chegou' },
    { id: 7, time: '14:00', patient: 'Ricardo Alves', doctor: 'Dr. Santos', status: 'nao_chegou' },
    { id: 8, time: '14:30', patient: 'Lucia Ribeiro', doctor: 'Dr. Silva', status: 'nao_chegou' },
  ]);

  const toggleStatus = (id: number) => {
    setEntries(entries.map(e => {
      if (e.id !== id) return e;
      const currentIdx = STATUS_CYCLE.indexOf(e.status);
      const nextIdx = (currentIdx + 1) % STATUS_CYCLE.length;
      return { ...e, status: STATUS_CYCLE[nextIdx] };
    }));
  };

  const total = entries.length;
  const presentes = entries.filter(e => e.status === 'presente').length;
  const ausentes = entries.filter(e => e.status === 'ausente').length;
  const aguardando = entries.filter(e => e.status === 'aguardando' || e.status === 'nao_chegou').length;

  const currentDate = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header>
        <h1 className="text-gradient" style={{ fontSize: '2rem', fontWeight: 800 }}>Check-In — Hoje</h1>
        <p style={{ color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
          {currentDate} • Controle de presença
        </p>
      </header>

      {/* Stats */}
      <div style={{ display: 'flex', gap: '1.5rem' }}>
        {[
          { label: 'Total', value: total, color: 'var(--color-accent)' },
          { label: 'Presentes', value: presentes, color: '#10B981' },
          { label: 'Ausentes', value: ausentes, color: '#EF4444' },
          { label: 'Aguardando', value: aguardando, color: '#F59E0B' },
        ].map(stat => (
          <div key={stat.label} className="glass-panel" style={{ flex: 1, padding: '1.5rem', textAlign: 'center' }}>
            <span style={{ fontSize: '2rem', fontWeight: 800, color: stat.color, lineHeight: 1 }}>
              {stat.value}
            </span>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.3rem' }}>
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* Check-in list */}
      <section className="glass-panel" style={{ overflow: 'hidden' }}>
        {entries.map((entry, i) => {
          const sc = STATUS_CONFIG[entry.status];
          return (
            <div
              key={entry.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1.5rem',
                padding: '1rem 1.5rem',
                borderBottom: i < entries.length - 1 ? '1px solid var(--border-color)' : 'none',
                transition: 'background 0.15s ease',
              }}
            >
              {/* Time */}
              <span style={{
                fontSize: '1rem',
                fontWeight: 700,
                color: 'var(--color-accent)',
                minWidth: '55px',
                flexShrink: 0,
              }}>
                {entry.time}
              </span>

              {/* Patient + Doctor */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  margin: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {entry.patient}
                </h3>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  {entry.doctor}
                </span>
              </div>

              {/* Status badge (clickable) */}
              <button
                onClick={() => toggleStatus(entry.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.4rem 0.8rem',
                  borderRadius: '20px',
                  border: 'none',
                  backgroundColor: sc.bg,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  flexShrink: 0,
                }}
                title="Clique para alterar o status"
              >
                <span style={{ fontSize: '0.9rem' }}>{sc.emoji}</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: sc.color }}>
                  {sc.label}
                </span>
              </button>
            </div>
          );
        })}
      </section>
    </div>
  );
}
