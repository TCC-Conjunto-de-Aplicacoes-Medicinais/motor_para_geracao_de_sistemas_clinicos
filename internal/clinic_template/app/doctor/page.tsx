'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import StatCard from '../components/StatCard';
import { useTheme } from '../components/ThemeProvider';

interface AppointmentItem {
  id: number;
  date: string;
  time: string;
  hour?: number;
  patient: string;
  patientId: string;
  type: string;
  status: string;
}

export default function DoctorDashboard() {
  const router = useRouter();
  const { backendUrl } = useTheme();
  const [doctorName, setDoctorName] = useState('Dr. Silva');
  const [reminders, setReminders] = useState<Array<{ id: number; text: string; done: boolean }>>([]);
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [newReminder, setNewReminder] = useState('');

  // 1. Carregar Perfil, Lembretes e Agendamentos Reais
  useEffect(() => {
    // Perfil do médico
    try {
      const stored = localStorage.getItem('clinic_doctor_profile');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.name) setDoctorName(parsed.name);
      } else {
        const userStored = localStorage.getItem('clinic_user');
        if (userStored) {
          const user = JSON.parse(userStored);
          if (user.name) setDoctorName(user.name);
        }
      }
    } catch {}

    // Lembretes persistentes
    const savedReminders = localStorage.getItem('clinic_doctor_reminders');
    if (savedReminders) {
      try {
        setReminders(JSON.parse(savedReminders));
      } catch {}
    }

    // Consultas de hoje vêm do banco da clínica (sem dados de exemplo).
    const todayStr = new Date().toISOString().split('T')[0];
    const statusLabel: Record<string, string> = {
      scheduled: 'Agendado', confirmed: 'Confirmado', waiting: 'Aguardando',
      in_progress: 'Em Sala', completed: 'Concluído', cancelled: 'Cancelado',
    };
    fetch(`${backendUrl || 'http://localhost:8081'}/api/appointments`)
      .then((r) => (r.ok ? r.json() : []))
      .then((list: Array<{ id: string; patient_id: string; patient_name: string; date_time: string; reason: string; status: string }>) => {
        const today = (Array.isArray(list) ? list : [])
          .map((a) => ({ ...a, when: new Date(a.date_time) }))
          .filter((a) => a.when.toISOString().split('T')[0] === todayStr || a.when.toLocaleDateString('en-CA') === todayStr);
        setAppointments(
          today.map((a, i) => ({
            id: i + 1,
            date: todayStr,
            time: a.when.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            hour: a.when.getHours(),
            patient: a.patient_name,
            patientId: a.patient_id,
            type: a.reason,
            status: statusLabel[a.status] || a.status,
          })).sort((x, y) => (x.hour ?? 0) - (y.hour ?? 0))
        );
      })
      .catch(() => setAppointments([]));
  }, []);

  const toggleReminder = (id: number) => {
    const updated = reminders.map(r => r.id === id ? { ...r, done: !r.done } : r);
    setReminders(updated);
    localStorage.setItem('clinic_doctor_reminders', JSON.stringify(updated));
  };

  const addReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReminder.trim()) return;
    const updated = [...reminders, { id: Date.now(), text: newReminder.trim(), done: false }];
    setReminders(updated);
    localStorage.setItem('clinic_doctor_reminders', JSON.stringify(updated));
    setNewReminder('');
  };

  const removeReminder = (id: number) => {
    const updated = reminders.filter(r => r.id !== id);
    setReminders(updated);
    localStorage.setItem('clinic_doctor_reminders', JSON.stringify(updated));
  };

  const currentDate = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });

  const totalToday = appointments.length;
  const waitingCount = appointments.filter(a => a.status === 'Aguardando' || a.status === 'Agendado').length;
  const inProgressCount = appointments.filter(a => a.status === 'Em Sala' || a.status === 'Confirmado').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Header Profile */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 className="text-gradient" style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>
            Olá, {doctorName}! 👋
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
            Hoje é <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{currentDate}</span>.
          </p>
        </div>
      </header>

      {/* Stats Dinâmicos */}
      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
        <StatCard label="Pacientes Hoje" value={String(totalToday)} color="var(--color-primary)" />
        <StatCard label="Em Espera" value={String(waitingCount)} color="#F59E0B" />
        <StatCard label="Em Atendimento" value={String(inProgressCount)} color="#10B981" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        
        {/* Próximos Atendimentos Reais */}
        <section className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.4rem', color: 'var(--text-primary)', margin: 0 }}>
              Próximos Atendimentos
            </h2>
            <button 
              onClick={() => router.push('/doctor/schedule')}
              style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--color-accent)', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
            >
              Ver Agenda Completa →
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {appointments.map((apt) => (
              <div 
                key={apt.id} 
                onClick={() => router.push(`/doctor/patients/${apt.patientId || '1'}`)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1rem',
                  borderRadius: '12px',
                  backgroundColor: 'var(--bg-app)',
                  borderLeft: `4px solid var(--color-accent)`,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  border: '1px solid var(--border-color)'
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-glass)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--bg-app)'}
                title="Clique para abrir o prontuário deste paciente"
              >
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                  <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                    {apt.time}
                  </span>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{apt.patient}</h3>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{apt.type}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
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
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>➔</span>
                </div>
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
