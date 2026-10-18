'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import StatCard from '../components/StatCard';

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
    } else {
      const initialReminders = [
        { id: 1, text: 'Revisar exames laboratoriais de Carlos Eduardo', done: false },
        { id: 2, text: 'Prescrever medicação de retorno para Maria Santos', done: true },
        { id: 3, text: 'Avaliar laudo de ECG 12 derivações com IA', done: false },
      ];
      setReminders(initialReminders);
      localStorage.setItem('clinic_doctor_reminders', JSON.stringify(initialReminders));
    }

    // Agendamentos Reais (base POHINC)
    const savedApts = localStorage.getItem('clinic_appointments');
    if (savedApts) {
      try {
        setAppointments(JSON.parse(savedApts));
        return;
      } catch {}
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const baseAppointments: AppointmentItem[] = [
      { id: 1, date: todayStr, time: '08:30', hour: 8, patient: 'Maria Santos', patientId: '1', type: 'Retorno Cardiológico', status: 'Aguardando' },
      { id: 2, date: todayStr, time: '09:30', hour: 9, patient: 'Carlos Eduardo Oliveira', patientId: '2', type: 'Consulta — Hipertensão', status: 'Confirmado' },
      { id: 3, date: todayStr, time: '11:00', hour: 11, patient: 'Ana Beatriz Lima', patientId: '3', type: 'Avaliação de ECG com IA', status: 'Em Sala' },
      { id: 4, date: todayStr, time: '14:30', hour: 14, patient: 'Roberto Ferreira Costa', patientId: '4', type: 'Exame de Rotina', status: 'Agendado' },
    ];
    setAppointments(baseAppointments);
    localStorage.setItem('clinic_appointments', JSON.stringify(baseAppointments));
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
