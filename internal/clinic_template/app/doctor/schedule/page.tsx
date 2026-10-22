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

import { useRouter } from 'next/navigation';
import { useTheme } from '../../components/ThemeProvider';

function formatLocalDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function SchedulePage() {
  const router = useRouter();
  const { backendUrl } = useTheme();
  const hours = Array.from({ length: 9 }, (_, i) => i + 8); // 08:00 to 16:00
  const dayNames = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

  const [currentWeekStart, setCurrentWeekStart] = useState(getStartOfWeek(new Date()));
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));

  const [appointments, setAppointments] = useState<any[]>([]);

  // Carregar agendamentos do backend e localStorage
  const loadAppointments = async () => {
    try {
      const url = backendUrl || 'http://localhost:8081';
      const res = await fetch(`${url}/api/appointments`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const parsed = data.map((a: any) => {
            const dt = new Date(a.date_time);
            const hour = dt.getHours();
            const dateStr = formatLocalDate(dt);
            return {
              id: a.id,
              date: dateStr,
              hour: hour,
              time: `${String(hour).padStart(2, '0')}:00`,
              patient: a.patient_name || 'Paciente',
              patientId: a.patient_id || '1',
              doctor: a.doctor_name || 'Dr. Silva',
              doctorId: a.doctor_id || '',
              type: a.reason || 'Consulta',
              status: a.status === 'confirmed' ? 'Confirmado' : a.status === 'waiting' ? 'Aguardando' : a.status === 'in_progress' ? 'Em Sala' : a.status === 'completed' ? 'Finalizado' : a.status === 'cancelled' ? 'Cancelado' : 'Agendado',
              insurance: a.insurance || 'Particular',
              price: a.price || 250,
            };
          });
          setAppointments(parsed);
          localStorage.setItem('clinic_appointments', JSON.stringify(parsed));
          return;
        }
      }
    } catch {}

    try {
      const saved = localStorage.getItem('clinic_appointments');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setAppointments(parsed);
          return;
        }
      }
    } catch {}

    // Sem consultas no banco da clínica, a agenda fica vazia (sem dados de exemplo).
    setAppointments([]);
  };

  React.useEffect(() => {
    loadAppointments();
  }, [backendUrl]);

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ date: string, hour: number } | null>(null);
  const [selectedApt, setSelectedApt] = useState<any>(null);

  const [newAptForm, setNewAptForm] = useState({ patient: '', type: 'Consulta', doctor: 'Dr. Silva', insurance: 'Particular' });

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
      setNewAptForm({ patient: '', type: 'Consulta', doctor: 'Dr. Silva', insurance: 'Particular' });
      setIsAddModalOpen(true);
    }
  };

  const handleAddAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot || !newAptForm.patient) return;

    const newId = `apt-${Date.now()}`;
    const newApt = {
      id: newId,
      date: selectedSlot.date,
      hour: selectedSlot.hour,
      time: `${selectedSlot.hour.toString().padStart(2, '0')}:00`,
      patient: newAptForm.patient,
      patientId: '1',
      doctor: newAptForm.doctor || 'Dr. Silva',
      doctorId: 'mock-doctor-silva',
      type: newAptForm.type,
      status: 'Confirmado',
      insurance: newAptForm.insurance || 'Particular',
      price: newAptForm.insurance === 'Particular' ? 280 : 220,
    };

    const updated = [...appointments, newApt];
    setAppointments(updated);
    localStorage.setItem('clinic_appointments', JSON.stringify(updated));

    try {
      const url = backendUrl || 'http://localhost:8081';
      const dt = new Date(`${selectedSlot.date}T${String(selectedSlot.hour).padStart(2, '0')}:00:00`);
      await fetch(`${url}/api/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: newId,
          patient_id: '1',
          patient_name: newApt.patient,
          doctor_id: 'mock-doctor-silva',
          doctor_name: newApt.doctor,
          date_time: dt.toISOString(),
          status: 'confirmed',
          reason: newApt.type,
          insurance: newApt.insurance,
          price: newApt.price,
        }),
      });
    } catch {}

    setIsAddModalOpen(false);
  };

  const handleCancelAppointment = async (id: any) => {
    const updated = appointments.filter(a => a.id !== id);
    setAppointments(updated);
    localStorage.setItem('clinic_appointments', JSON.stringify(updated));

    try {
      const url = backendUrl || 'http://localhost:8081';
      await fetch(`${url}/api/appointments/${id}`, { method: 'DELETE' });
    } catch {}

    setIsViewModalOpen(false);
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
              const isToday = formatLocalDate(dateObj) === formatLocalDate(new Date());
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
                  const dateStr = formatLocalDate(dateObj);
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
              <button 
                type="button"
                onClick={() => handleCancelAppointment(selectedApt.id)} 
                style={{ flex: 1, padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--badge-red-text)', background: 'transparent', color: 'var(--badge-red-text)', fontWeight: 600, cursor: 'pointer' }}
              >
                Cancelar Agendamento
              </button>
              <button 
                type="button"
                onClick={() => {
                  setIsViewModalOpen(false);
                  router.push(`/doctor/patients/${selectedApt.patientId || '1'}`);
                }} 
                style={{ flex: 1, padding: '0.8rem', borderRadius: '8px', border: 'none', background: 'var(--color-primary)', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
              >
                Iniciar Atendimento
              </button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
}
