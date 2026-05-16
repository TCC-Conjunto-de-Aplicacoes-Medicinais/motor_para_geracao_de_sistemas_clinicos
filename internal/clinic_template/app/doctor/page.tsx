'use client';

import React, { useState } from 'react';
import StatCard from '../components/StatCard';

const MOCK_APPOINTMENTS = [
  { time: '08:30', patient: 'Maria Souza', type: 'Retorno', status: 'Aguardando' },
  { time: '09:15', patient: 'João Pereira', type: 'Consulta', status: 'Confirmado' },
  { time: '10:00', patient: 'Ana Lima', type: 'Exame', status: 'Em Sala' },
];

const MOCK_REMINDERS = [
  { text: 'Revisar exames laboratoriais de Carlos', done: true },
  { text: 'Ligar para a farmácia central', done: false },
  { text: 'Atualizar prontuário Maria S.', done: false },
];

export default function DoctorDashboard() {
  const [reminders, setReminders] = useState([
    { id: 1, text: 'Revisar exames laboratoriais de Carlos', done: true },
    { id: 2, text: 'Ligar para a farmácia central', done: false },
    { id: 3, text: 'Atualizar prontuário Maria S.', done: false },
  ]);
  const [newReminder, setNewReminder] = useState('');

  const toggleReminder = (id: number) => {
    setReminders(reminders.map(r => r.id === id ? { ...r, done: !r.done } : r));
  };

  const addReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReminder.trim()) return;
    setReminders([...reminders, { id: Date.now(), text: newReminder, done: false }]);
    setNewReminder('');
  };

  const currentDate = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Header Profile */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 className="text-gradient" style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>
            Olá, Dr(a). Silva! 👋
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
            Hoje é <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{currentDate}</span>.
          </p>
        </div>
      </header>

      {/* Stats */}
      <div style={{ display: 'flex', gap: '1.5rem' }}>
        <StatCard label="Pacientes Hoje" value="12" color="var(--color-primary)" />
        <StatCard label="Em Espera" value="3" color="#F59E0B" />
        <StatCard label="Finalizados" value="5" color="#10B981" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        
        {/* Próximos Atendimentos */}
        <section className="glass-panel" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
            Próximos Atendimentos
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {MOCK_APPOINTMENTS.map((apt, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem',
                borderRadius: '12px',
                backgroundColor: 'var(--bg-app)',
                borderLeft: `4px solid var(--color-accent)`
              }}>
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                  <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                    {apt.time}
                  </span>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>{apt.patient}</h3>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{apt.type}</span>
                  </div>
                </div>
                <span style={{
                  padding: '0.4rem 0.8rem',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  backgroundColor: apt.status === 'Confirmado' ? 'var(--badge-green-bg)' : apt.status === 'Aguardando' ? 'var(--badge-yellow-bg)' : 'var(--badge-blue-bg)',
                  color: apt.status === 'Confirmado' ? 'var(--badge-green-text)' : apt.status === 'Aguardando' ? 'var(--badge-yellow-text)' : 'var(--badge-blue-text)'
                }}>
                  {apt.status}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Lembretes */}
        <section className="glass-panel" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
            Lembretes
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <form onSubmit={addReminder} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <input 
                type="text" 
                value={newReminder}
                onChange={(e) => setNewReminder(e.target.value)}
                placeholder="Novo lembrete..."
                style={{ 
                  flex: 1, 
                  padding: '0.6rem 0.8rem', 
                  borderRadius: '8px', 
                  border: '1px solid var(--border-color)', 
                  background: 'var(--bg-app)', 
                  color: 'var(--text-primary)',
                  outline: 'none'
                }}
              />
              <button 
                type="submit" 
                style={{ 
                  padding: '0 1rem', 
                  background: 'var(--color-primary)', 
                  color: '#fff', 
                  border: 'none', 
                  borderRadius: '8px', 
                  cursor: 'pointer', 
                  fontWeight: 800,
                  fontSize: '1.2rem'
                }}
              >
                +
              </button>
            </form>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
              {reminders.map((reminder) => (
                <label key={reminder.id} style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '1rem',
                  cursor: 'pointer'
                }}>
                  <input 
                    type="checkbox" 
                    checked={reminder.done} 
                    onChange={() => toggleReminder(reminder.id)}
                    style={{ marginTop: '0.3rem', accentColor: 'var(--color-primary)', cursor: 'pointer' }} 
                  />
                  <span style={{
                    fontSize: '0.95rem',
                    color: reminder.done ? 'var(--text-muted)' : 'var(--text-primary)',
                    textDecoration: reminder.done ? 'line-through' : 'none',
                    lineHeight: 1.4,
                    transition: 'all 0.2s ease'
                  }}>
                    {reminder.text}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
