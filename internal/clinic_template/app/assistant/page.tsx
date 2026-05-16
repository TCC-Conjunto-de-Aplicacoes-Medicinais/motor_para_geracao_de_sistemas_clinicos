'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// --- Utils ---
function getStartOfWeek(date: Date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}
function addDays(date: Date, days: number) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() + days);
  return d;
}
function addWeeks(date: Date, weeks: number) {
  return addDays(date, weeks * 7);
}
function formatMonthYear(weekStart: Date) {
  const mid = addDays(weekStart, 2);
  return mid.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}
// -------------

interface DoctorSchedule {
  doctor: string;
  color: string;
  appointments: { date: string; hour: number; patient: string; type: string }[];
}

export default function AssistantSchedulePage() {
  const hours = Array.from({ length: 9 }, (_, i) => i + 8);
  const dayNames = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

  const [currentWeekStart, setCurrentWeekStart] = useState(getStartOfWeek(new Date()));
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));

  const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null);

  // Mock data: multiple doctors
  const doctorSchedules: DoctorSchedule[] = [
    {
      doctor: 'Dr. Silva',
      color: 'var(--color-primary)',
      appointments: [
        { date: '2026-05-12', hour: 8, patient: 'Maria S.', type: 'Consulta' },
        { date: '2026-05-12', hour: 10, patient: 'João P.', type: 'Retorno' },
        { date: '2026-05-14', hour: 14, patient: 'Ana L.', type: 'Exame' },
        { date: '2026-05-16', hour: 9, patient: 'Pedro M.', type: 'Consulta' },
      ],
    },
    {
      doctor: 'Dra. Lima',
      color: 'var(--color-accent)',
      appointments: [
        { date: '2026-05-13', hour: 9, patient: 'Carlos O.', type: 'Consulta' },
        { date: '2026-05-13', hour: 11, patient: 'Fernanda C.', type: 'Retorno' },
        { date: '2026-05-15', hour: 15, patient: 'Lucia R.', type: 'Exame' },
      ],
    },
    {
      doctor: 'Dr. Santos',
      color: '#F59E0B',
      appointments: [
        { date: '2026-05-12', hour: 14, patient: 'Ricardo B.', type: 'Consulta' },
        { date: '2026-05-15', hour: 8, patient: 'Camila A.', type: 'Retorno' },
      ],
    },
  ];

  const prevWeek = () => setCurrentWeekStart(addWeeks(currentWeekStart, -1));
  const nextWeek = () => setCurrentWeekStart(addWeeks(currentWeekStart, 1));
  const goToday = () => setCurrentWeekStart(getStartOfWeek(new Date()));

  const monthYearStr = formatMonthYear(currentWeekStart);

  // Filter appointments by selected doctor or show all
  const visibleSchedules = selectedDoctor
    ? doctorSchedules.filter(ds => ds.doctor === selectedDoctor)
    : doctorSchedules;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="text-gradient" style={{ fontSize: '2rem', fontWeight: 800 }}>Agendas dos Médicos</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Visualize e gerencie os horários de todos os médicos.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={goToday} style={{ padding: '0.5rem 1rem', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>
            Hoje
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button onClick={prevWeek} style={{ background: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.5rem', cursor: 'pointer', color: 'var(--text-primary)' }}>
              <ChevronLeft size={20} />
            </button>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)', minWidth: '140px', textAlign: 'center', textTransform: 'capitalize' }}>
              {monthYearStr}
            </span>
            <button onClick={nextWeek} style={{ background: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.5rem', cursor: 'pointer', color: 'var(--text-primary)' }}>
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Doctor filter pills */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => setSelectedDoctor(null)}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '20px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: !selectedDoctor ? 700 : 500,
            fontSize: '0.9rem',
            backgroundColor: !selectedDoctor ? 'var(--badge-blue-bg)' : 'transparent',
            color: !selectedDoctor ? 'var(--color-accent)' : 'var(--text-muted)',
            transition: 'all 0.2s ease',
          }}
        >
          Todos
        </button>
        {doctorSchedules.map(ds => (
          <button
            key={ds.doctor}
            onClick={() => setSelectedDoctor(ds.doctor)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '20px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: selectedDoctor === ds.doctor ? 700 : 500,
              fontSize: '0.9rem',
              backgroundColor: selectedDoctor === ds.doctor ? 'var(--badge-blue-bg)' : 'transparent',
              color: selectedDoctor === ds.doctor ? 'var(--color-accent)' : 'var(--text-muted)',
              transition: 'all 0.2s ease',
            }}
          >
            {ds.doctor}
          </button>
        ))}
      </div>

      {/* Calendar Grid */}
      <section className="glass-panel" style={{ overflow: 'hidden' }}>
        <div style={{ minWidth: '900px' }}>
          {/* Calendar Header */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-glass)' }}>
            <div style={{ width: '60px', flexShrink: 0, borderRight: '1px solid var(--border-color)' }}></div>
            {weekDays.map((dateObj, i) => {
              const isToday = dateObj.toISOString().split('T')[0] === new Date().toISOString().split('T')[0];
              return (
                <div key={i} style={{
                  flex: 1,
                  textAlign: 'center',
                  padding: '1rem',
                  borderRight: i < 6 ? '1px solid var(--border-color)' : 'none',
                  backgroundColor: isToday ? 'var(--bg-app)' : 'transparent'
                }}>
                  <div style={{ color: isToday ? 'var(--color-accent)' : 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase' }}>{dayNames[i]}</div>
                  <div style={{ color: isToday ? 'var(--color-accent)' : 'var(--text-primary)', fontSize: '1.2rem', fontWeight: 800 }}>{dateObj.getDate()}</div>
                </div>
              );
            })}
          </div>

          {/* Time Grid */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {hours.map((hour, hourIdx) => (
              <div key={hour} style={{
                display: 'flex',
                borderBottom: hourIdx < hours.length - 1 ? '1px solid var(--border-color)' : 'none',
                minHeight: '70px'
              }}>
                <div style={{
                  width: '60px',
                  flexShrink: 0,
                  color: 'var(--text-muted)',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  textAlign: 'center',
                  paddingTop: '0.5rem',
                  borderRight: '1px solid var(--border-color)'
                }}>
                  {hour.toString().padStart(2, '0')}:00
                </div>
                {weekDays.map((dateObj, dayIdx) => {
                  const dateStr = dateObj.toISOString().split('T')[0];
                  // Find all appointments in this slot across visible doctors
                  const slotApts = visibleSchedules.flatMap(ds =>
                    ds.appointments
                      .filter(a => a.date === dateStr && a.hour === hour)
                      .map(a => ({ ...a, doctor: ds.doctor, color: ds.color }))
                  );

                  return (
                    <div
                      key={`${dateStr}-${hour}`}
                      style={{
                        flex: 1,
                        borderRight: dayIdx < 6 ? '1px solid var(--border-color)' : 'none',
                        padding: '2px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px',
                      }}
                    >
                      {slotApts.map((apt, i) => (
                        <div key={i} style={{
                          backgroundColor: 'var(--badge-blue-bg)',
                          borderLeft: `4px solid ${apt.color}`,
                          borderRadius: '0 4px 4px 0',
                          padding: '0.4rem 0.5rem',
                          cursor: 'default',
                        }}>
                          <span style={{ color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: 700, display: 'block' }}>{apt.patient}</span>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{apt.doctor} • {apt.type}</span>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '1.5rem' }}>
        {doctorSchedules.map(ds => (
          <div key={ds.doctor} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '4px', backgroundColor: ds.color }} />
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{ds.doctor}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
