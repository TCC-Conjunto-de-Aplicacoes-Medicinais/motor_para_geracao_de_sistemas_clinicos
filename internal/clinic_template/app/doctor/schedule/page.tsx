'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import Modal from '../../components/Modal';

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
  // Use Wednesday (midpoint) to determine the displayed month
  const mid = addDays(weekStart, 2);
  return mid.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}
// -------------

export default function SchedulePage() {
  const hours = Array.from({ length: 9 }, (_, i) => i + 8); // 08:00 to 16:00
  const dayNames = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

  const [currentWeekStart, setCurrentWeekStart] = useState(getStartOfWeek(new Date()));
  
  // Array of 7 days for the current week
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));

  const [appointments, setAppointments] = useState([
    { id: 1, date: '2026-05-13', hour: 9, patient: 'João P.', type: 'Consulta', status: 'Confirmado' },
    { id: 2, date: '2026-05-15', hour: 14, patient: 'Maria S.', type: 'Retorno', status: 'Aguardando' }
  ]);

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ date: string, hour: number } | null>(null);
  const [selectedApt, setSelectedApt] = useState<any>(null);

  const [newAptForm, setNewAptForm] = useState({ patient: '', type: 'Consulta' });

  // Navigation
  const prevWeek = () => setCurrentWeekStart(addWeeks(currentWeekStart, -1));
  const nextWeek = () => setCurrentWeekStart(addWeeks(currentWeekStart, 1));
  const goToday = () => setCurrentWeekStart(getStartOfWeek(new Date()));

  // Handlers
  const handleSlotClick = (dateStr: string, hour: number, apt: any) => {
    if (apt) {
      setSelectedApt(apt);
      setIsViewModalOpen(true);
    } else {
      setSelectedSlot({ date: dateStr, hour });
      setNewAptForm({ patient: '', type: 'Consulta' });
      setIsAddModalOpen(true);
    }
  };

  const handleAddAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot || !newAptForm.patient) return;

    const newApt = {
      id: Date.now(),
      date: selectedSlot.date,
      hour: selectedSlot.hour,
      patient: newAptForm.patient,
      type: newAptForm.type,
      status: 'Agendado'
    };

    setAppointments([...appointments, newApt]);
    setIsAddModalOpen(false);
  };

  const monthYearStr = formatMonthYear(currentWeekStart);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="text-gradient" style={{ fontSize: '2rem', fontWeight: 800 }}>Agenda Semanal</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Clique em um horário vazio para agendar um paciente.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={goToday} style={{ padding: '0.5rem 1rem', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>
            Hoje
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button onClick={prevWeek} style={{ background: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.5rem', cursor: 'pointer', color: 'var(--text-primary)' }}>
              <ChevronLeft size={20} />
            </button>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)', minWidth: '120px', textAlign: 'center', textTransform: 'capitalize' }}>
              {monthYearStr}
            </span>
            <button onClick={nextWeek} style={{ background: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.5rem', cursor: 'pointer', color: 'var(--text-primary)' }}>
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </header>

      <section className="glass-panel" style={{ overflow: 'hidden' }}>
        <div style={{ minWidth: '800px' }}>
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

          {/* Calendar Grid */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {hours.map((hour, hourIdx) => (
              <div key={hour} style={{ 
                display: 'flex', 
                borderBottom: hourIdx < hours.length - 1 ? '1px solid var(--border-color)' : 'none',
                minHeight: '80px'
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
                  const apt = appointments.find(a => a.date === dateStr && a.hour === hour);
                  
                  return (
                    <div 
                      key={`${dateStr}-${hour}`} 
                      onClick={() => handleSlotClick(dateStr, hour, apt)}
                      style={{ 
                        flex: 1,
                        borderRight: dayIdx < 6 ? '1px solid var(--border-color)' : 'none',
                        padding: '4px',
                        cursor: 'pointer',
                        position: 'relative',
                        transition: 'background-color 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        if (!apt) e.currentTarget.style.backgroundColor = 'var(--bg-app)';
                      }}
                      onMouseLeave={(e) => {
                        if (!apt) e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      {apt ? (
                        <div style={{
                          height: '100%',
                          backgroundColor: 'var(--badge-blue-bg)',
                          borderLeft: '4px solid var(--badge-blue-text)',
                          borderRadius: '0 4px 4px 0',
                          padding: '0.5rem',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          boxShadow: 'var(--shadow-sm)',
                          transition: 'transform 0.2s ease',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                          <span style={{ color: 'var(--badge-blue-text)', fontSize: '0.9rem', fontWeight: 700 }}>{apt.patient}</span>
                          <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 500 }}>{apt.type}</span>
                        </div>
                      ) : (
                        <div style={{
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          opacity: 0,
                          transition: 'opacity 0.2s ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = '0'}
                        >
                          <Plus size={20} color="var(--color-primary)" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MODALS */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Novo Agendamento">
        <form onSubmit={handleAddAppointment} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Nome do Paciente</label>
            <input 
              type="text" 
              value={newAptForm.patient}
              onChange={e => setNewAptForm({...newAptForm, patient: e.target.value})}
              required
              style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Tipo de Consulta</label>
            <select 
              value={newAptForm.type}
              onChange={e => setNewAptForm({...newAptForm, type: e.target.value})}
              style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none' }}
            >
              <option value="Consulta">Consulta</option>
              <option value="Retorno">Retorno</option>
              <option value="Exame">Exame</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button type="button" onClick={() => setIsAddModalOpen(false)} style={{ flex: 1, padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', fontWeight: 600, cursor: 'pointer' }}>
              Cancelar
            </button>
            <button type="submit" style={{ flex: 1, padding: '0.8rem', borderRadius: '8px', border: 'none', background: 'var(--color-primary)', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
              Agendar
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Detalhes do Agendamento">
        {selectedApt && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Paciente</span>
              <span style={{ color: 'var(--text-primary)', fontSize: '1.2rem', fontWeight: 600 }}>{selectedApt.patient}</span>
            </div>
            <div style={{ display: 'flex', gap: '2rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Tipo</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{selectedApt.type}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Horário</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{selectedApt.hour.toString().padStart(2, '0')}:00</span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Status</span>
              <span style={{ 
                display: 'inline-block',
                padding: '0.4rem 0.8rem',
                borderRadius: '20px',
                fontSize: '0.8rem',
                fontWeight: 600,
                width: 'fit-content',
                backgroundColor: 'var(--badge-blue-bg)',
                color: 'var(--badge-blue-text)'
              }}>
                {selectedApt.status}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button onClick={() => setIsViewModalOpen(false)} style={{ flex: 1, padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--badge-red-text)', background: 'transparent', color: 'var(--badge-red-text)', fontWeight: 600, cursor: 'pointer' }}>
                Cancelar Agendamento
              </button>
              <button onClick={() => setIsViewModalOpen(false)} style={{ flex: 1, padding: '0.8rem', borderRadius: '8px', border: 'none', background: 'var(--color-primary)', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
                Iniciar Atendimento
              </button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
}
