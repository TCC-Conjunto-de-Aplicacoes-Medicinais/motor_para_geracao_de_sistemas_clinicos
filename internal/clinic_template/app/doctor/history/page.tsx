'use client';

import React, { useState, useEffect } from 'react';
import PatientAvatar from '../../components/PatientAvatar';
import { useTheme } from '../../components/ThemeProvider';

type FilterType = 'Todos' | 'Consulta' | 'Retorno' | 'Exame';

export default function HistoryPage() {
  const { backendUrl } = useTheme();
  const [activeFilter, setActiveFilter] = useState<FilterType>('Todos');
  const [historyItems, setHistoryItems] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${backendUrl || 'http://localhost:8081'}/api/records`)
      .then(res => res.json())
      .then((records: any[]) => {
        if (Array.isArray(records) && records.length > 0) {
          const mapped = records.map((r, idx) => ({
            id: r.id || String(idx),
            date: r.date ? new Date(r.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : 'Hoje',
            time: r.date ? new Date(r.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '10:00',
            patient: r.patient_name || 'Paciente',
            type: (r.record_type || 'Consulta') as any,
            duration: '30 min',
            status: 'concluído' as const,
            summary: r.title ? `${r.title} — ${r.diagnosis || r.prescription || 'Atendimento registrado.'}` : (r.diagnosis || 'Atendimento clínico registrado no banco local'),
          }));
          setHistoryItems(mapped);
        }
      })
      .catch(err => console.warn('Aviso ao carregar prontuários da API da clínica:', err));
  }, [backendUrl]);

  const filteredHistory = activeFilter === 'Todos'
    ? historyItems
    : historyItems.filter(h => h.type === activeFilter);

  const filters: FilterType[] = ['Todos', 'Consulta', 'Retorno', 'Exame'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="text-gradient" style={{ fontSize: '2rem', fontWeight: 800 }}>Histórico de Consultas</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Últimos atendimentos realizados</p>
        </div>
        {/* Filter pills */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {filters.map(filter => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              style={{
                padding: '0.4rem 1rem',
                borderRadius: '20px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: activeFilter === filter ? 700 : 500,
                fontSize: '0.9rem',
                backgroundColor: activeFilter === filter ? 'var(--badge-blue-bg)' : 'transparent',
                color: activeFilter === filter ? 'var(--color-accent)' : 'var(--text-muted)',
                transition: 'all 0.2s ease',
              }}
            >
              {filter}
            </button>
          ))}
        </div>
      </header>

      {/* Stats */}
      <div style={{ display: 'flex', gap: '1.5rem' }}>
        {[
          { label: 'Esta semana', value: '12', color: 'var(--color-accent)' },
          { label: 'Este mês', value: '47', color: 'var(--color-primary)' },
          { label: 'Cancelados', value: '3', color: '#EF4444' },
        ].map(stat => (
          <div key={stat.label} className="glass-panel" style={{ flex: 1, padding: '1.5rem' }}>
            <span style={{ fontSize: '2rem', fontWeight: 800, color: stat.color, lineHeight: 1 }}>
              {stat.value}
            </span>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.3rem' }}>
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* Timeline */}
      <div style={{ position: 'relative', paddingLeft: '2rem' }}>
        {/* Vertical timeline line */}
        <div style={{
          position: 'absolute',
          left: '7px',
          top: '12px',
          bottom: '12px',
          width: '3px',
          backgroundColor: 'var(--color-accent)',
          opacity: 0.2,
          borderRadius: '2px',
        }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {filteredHistory.map(entry => {
            const isCanceled = entry.status === 'cancelado';
            return (
              <div key={entry.id} style={{ display: 'flex', gap: '1.5rem', position: 'relative' }}>
                {/* Timeline dot */}
                <div style={{
                  position: 'absolute',
                  left: '-2rem',
                  top: '1.4rem',
                  width: '14px',
                  height: '14px',
                  borderRadius: '50%',
                  backgroundColor: isCanceled ? '#EF4444' : 'var(--color-accent)',
                  border: '3px solid var(--bg-glass)',
                  zIndex: 1,
                  boxShadow: `0 0 0 3px ${isCanceled ? 'rgba(239, 68, 68, 0.15)' : 'rgba(var(--color-accent-rgb, 59, 130, 246), 0.15)'}`,
                }} />

                {/* Card */}
                <div className="glass-panel" style={{
                  flex: 1,
                  padding: '1.5rem',
                  transition: 'border-color 0.2s ease',
                  cursor: 'default',
                }}>
                  {/* Top row: date/time + status */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-accent)' }}>
                        {entry.date}
                      </span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {entry.time}
                      </span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        • {entry.duration}
                      </span>
                    </div>
                    <span style={{
                      padding: '0.3rem 0.8rem',
                      borderRadius: '20px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      backgroundColor: isCanceled ? 'var(--badge-red-bg)' : 'var(--badge-green-bg)',
                      color: isCanceled ? 'var(--badge-red-text)' : 'var(--badge-green-text)',
                    }}>
                      {isCanceled ? 'Cancelado' : 'Concluído'}
                    </span>
                  </div>

                  {/* Patient + type */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <PatientAvatar name={entry.patient} size={36} />
                    <span style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {entry.patient}
                    </span>
                    <span style={{
                      padding: '0.2rem 0.6rem',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      fontWeight: 500,
                      backgroundColor: 'var(--bg-app)',
                      color: 'var(--text-muted)',
                    }}>
                      {entry.type}
                    </span>
                  </div>

                  {/* Summary */}
                  <p style={{
                    fontSize: '0.95rem',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.6,
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical' as any,
                    margin: 0,
                  }}>
                    {entry.summary}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
