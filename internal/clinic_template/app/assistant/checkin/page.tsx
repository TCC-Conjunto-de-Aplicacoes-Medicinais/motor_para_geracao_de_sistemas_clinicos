'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from '../../components/ThemeProvider';

type CheckInStatus = 'presente' | 'aguardando' | 'ausente' | 'nao_chegou';

interface CheckInEntry {
  id: string | number;
  time: string;
  patient: string;
  doctor: string;
  status: CheckInStatus;
  type?: string;
  insurance?: string;
}

const STATUS_CONFIG: Record<CheckInStatus, { emoji: string; label: string; color: string; bg: string }> = {
  presente: { emoji: '✅', label: 'Presente', color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)' },
  aguardando: { emoji: '⏳', label: 'Aguardando', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)' },
  ausente: { emoji: '❌', label: 'Ausente', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.1)' },
  nao_chegou: { emoji: '🔜', label: 'Não chegou', color: '#94A3B8', bg: 'rgba(148, 163, 184, 0.1)' },
};

const STATUS_CYCLE: CheckInStatus[] = ['nao_chegou', 'aguardando', 'presente', 'ausente'];

function formatLocalDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function CheckInPage() {
  const { backendUrl } = useTheme();
  const [entries, setEntries] = useState<CheckInEntry[]>([]);

  const loadTodayCheckIns = async () => {
    const todayStr = formatLocalDate(new Date());

    try {
      const url = backendUrl || 'http://localhost:8081';
      const res = await fetch(`${url}/api/appointments`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const todayApts = data.filter((a: any) => {
            const dt = new Date(a.date_time);
            return formatLocalDate(dt) === todayStr;
          });

          if (todayApts.length > 0) {
            const parsed: CheckInEntry[] = todayApts.map((a: any) => {
              const dt = new Date(a.date_time);
              const hour = dt.getHours();
              const minutes = dt.getMinutes();
              const timeStr = `${String(hour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
              
              let checkStatus: CheckInStatus = 'nao_chegou';
              if (a.status === 'confirmed') checkStatus = 'presente';
              else if (a.status === 'waiting') checkStatus = 'aguardando';
              else if (a.status === 'in_progress') checkStatus = 'presente';
              else if (a.status === 'cancelled') checkStatus = 'ausente';

              return {
                id: a.id,
                time: timeStr,
                patient: a.patient_name || 'Paciente',
                doctor: a.doctor_name || 'Dr. Silva',
                status: checkStatus,
                type: a.reason,
                insurance: a.insurance || 'Particular',
              };
            });
            setEntries(parsed);
            return;
          }
        }
      }
    } catch {}

    // Fallback to localStorage
    try {
      const saved = localStorage.getItem('clinic_appointments');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const todayApts = parsed.filter((a: any) => a.date === todayStr);
          if (todayApts.length > 0) {
            const list: CheckInEntry[] = todayApts.map((a: any) => ({
              id: a.id,
              time: a.time || `${String(a.hour || 9).padStart(2, '0')}:00`,
              patient: a.patient,
              doctor: a.doctor,
              status: a.status === 'Confirmado' ? 'presente' : a.status === 'Aguardando' ? 'aguardando' : a.status === 'Cancelado' ? 'ausente' : 'nao_chegou',
              type: a.type,
              insurance: a.insurance,
            }));
            setEntries(list);
            return;
          }
        }
      }
    } catch {}

    // Default mock today
    setEntries([
      { id: 'apt-1', time: '09:00', patient: 'Maria Santos', doctor: 'Dr. Silva', status: 'presente', insurance: 'Particular' },
      { id: 'apt-2', time: '11:00', patient: 'Carlos Eduardo Oliveira', doctor: 'Dr. Silva', status: 'aguardando', insurance: 'Unimed' },
      { id: 'apt-3', time: '14:00', patient: 'Ana Beatriz Lima', doctor: 'Dra. Lima', status: 'presente', insurance: 'Bradesco' },
      { id: 'apt-4', time: '16:00', patient: 'Roberto Ferreira Costa', doctor: 'Dr. Santos', status: 'nao_chegou', insurance: 'SulAmérica' },
    ]);
  };

  useEffect(() => {
    loadTodayCheckIns();
  }, [backendUrl]);

  const toggleStatus = async (id: string | number) => {
    const updated = entries.map(e => {
      if (e.id !== id) return e;
      const currentIdx = STATUS_CYCLE.indexOf(e.status);
      const nextIdx = (currentIdx + 1) % STATUS_CYCLE.length;
      return { ...e, status: STATUS_CYCLE[nextIdx] };
    });
    setEntries(updated);

    const changed = updated.find(e => e.id === id);
    if (!changed) return;

    // Sync to localStorage
    try {
      const saved = localStorage.getItem('clinic_appointments');
      if (saved) {
        const apts = JSON.parse(saved);
        const nextApts = apts.map((a: any) => {
          if (a.id === id) {
            return {
              ...a,
              status: changed.status === 'presente' ? 'Confirmado' : changed.status === 'aguardando' ? 'Aguardando' : changed.status === 'ausente' ? 'Cancelado' : 'Agendado'
            };
          }
          return a;
        });
        localStorage.setItem('clinic_appointments', JSON.stringify(nextApts));
      }
    } catch {}

    // Sync to backend
    try {
      const url = backendUrl || 'http://localhost:8081';
      const backendStatus = changed.status === 'presente' ? 'confirmed' : changed.status === 'aguardando' ? 'waiting' : changed.status === 'ausente' ? 'cancelled' : 'scheduled';
      await fetch(`${url}/api/appointments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: backendStatus }),
      });
    } catch {}
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
          {currentDate} • Controle de presença integrado ao banco de dados da clínica
        </p>
      </header>

      {/* Stats */}
      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
        {[
          { label: 'Total', value: total, color: 'var(--color-accent)' },
          { label: 'Presentes', value: presentes, color: '#10B981' },
          { label: 'Ausentes', value: ausentes, color: '#EF4444' },
          { label: 'Aguardando', value: aguardando, color: '#F59E0B' },
        ].map(stat => (
          <div key={stat.label} className="glass-panel" style={{ flex: 1, minWidth: '140px', padding: '1.5rem', textAlign: 'center' }}>
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
        {entries.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Nenhum paciente agendado para o dia de hoje.
          </div>
        ) : (
          entries.map((entry, i) => {
            const sc = STATUS_CONFIG[entry.status];
            return (
              <div
                key={entry.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1.5rem',
                  padding: '1.2rem 1.5rem',
                  borderBottom: i < entries.length - 1 ? '1px solid var(--border-color)' : 'none',
                  transition: 'background 0.15s ease',
                }}
              >
                {/* Time */}
                <span style={{
                  fontSize: '1.1rem',
                  fontWeight: 800,
                  color: 'var(--color-accent)',
                  minWidth: '60px',
                  flexShrink: 0,
                }}>
                  {entry.time}
                </span>

                {/* Patient + Doctor */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{
                    fontSize: '1.05rem',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    margin: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {entry.patient}
                  </h3>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginTop: '0.2rem' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                      {entry.doctor}
                    </span>
                    {entry.type && (
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        • {entry.type}
                      </span>
                    )}
                    {entry.insurance && (
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        padding: '0.1rem 0.5rem',
                        borderRadius: '4px',
                        backgroundColor: 'var(--badge-blue-bg)',
                        color: 'var(--color-accent)'
                      }}>
                        {entry.insurance}
                      </span>
                    )}
                  </div>
                </div>

                {/* Status badge (clickable) */}
                <button
                  onClick={() => toggleStatus(entry.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.45rem 0.9rem',
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
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: sc.color }}>
                    {sc.label}
                  </span>
                </button>
              </div>
            );
          })
        )}
      </section>
    </div>
  );
}
