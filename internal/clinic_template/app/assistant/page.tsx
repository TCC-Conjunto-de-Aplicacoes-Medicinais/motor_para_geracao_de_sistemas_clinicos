'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Calendar, Clock, User, Stethoscope, Shield, CheckCircle, Trash2 } from 'lucide-react';
import Modal from '../components/Modal';
import { useTheme } from '../components/ThemeProvider';

// --- Date Utils ---
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

function formatLocalDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatMonthYear(weekStart: Date) {
  const mid = addDays(weekStart, 2);
  return mid.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

interface AppointmentItem {
  id: string | number;
  date: string;
  hour: number;
  time: string;
  patient: string;
  patientId: string;
  doctor: string;
  doctorId: string;
  type: string;
  status: string;
  insurance: string;
  price: number;
  color?: string;
}

const DOCTORS = [
  { id: 'mock-doctor-silva', name: 'Dr. Silva', specialty: 'Cardiologia', color: 'var(--color-primary)' },
  { id: 'mock-doctor-lima', name: 'Dra. Lima', specialty: 'Clínica Geral', color: 'var(--color-accent)' },
  { id: 'mock-doctor-santos', name: 'Dr. Santos', specialty: 'Cardiologia / Exames', color: '#F59E0B' },
];

export default function AssistantSchedulePage() {
  const { backendUrl } = useTheme();
  const hours = Array.from({ length: 9 }, (_, i) => i + 8); // 08:00 to 16:00
  const dayNames = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

  const [currentWeekStart, setCurrentWeekStart] = useState(getStartOfWeek(new Date()));
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));

  const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [patientsList, setPatientsList] = useState<any[]>([]);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedApt, setSelectedApt] = useState<AppointmentItem | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    doctor: 'Dr. Silva',
    patient: '',
    patientId: '',
    date: formatLocalDate(new Date()),
    hour: 9,
    type: 'Consulta',
    insurance: 'Particular',
  });

  // Load appointments & patients
  const loadAppointments = async () => {
    try {
      const url = backendUrl;
      const res = await fetch(`${url}/api/appointments`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const parsed: AppointmentItem[] = data.map((a: any) => {
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
    } catch (err) {
      console.warn('Erro ao carregar agendamentos do back-end, usando cache:', err);
    }

    // Fallback to localStorage
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

    // Sem consultas no banco da clínica, a lista fica vazia (sem dados de exemplo).
    setAppointments([]);
  };

  const loadPatients = async () => {
    try {
      const url = backendUrl;
      const res = await fetch(`${url}/api/patients`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setPatientsList(data);
          return;
        }
      }
    } catch {}

    setPatientsList([]);
  };

  useEffect(() => {
    loadAppointments();
    loadPatients();
  }, [backendUrl]);

  const prevWeek = () => setCurrentWeekStart(addWeeks(currentWeekStart, -1));
  const nextWeek = () => setCurrentWeekStart(addWeeks(currentWeekStart, 1));
  const goToday = () => setCurrentWeekStart(getStartOfWeek(new Date()));

  const monthYearStr = formatMonthYear(currentWeekStart);

  const getDoctorColor = (docName: string) => {
    const doc = DOCTORS.find(d => d.name === docName);
    return doc?.color || 'var(--color-primary)';
  };

  // Filter appointments
  const filteredAppointments = selectedDoctor
    ? appointments.filter(a => a.doctor === selectedDoctor)
    : appointments;

  const handleOpenAddModal = (dateStr?: string, hour?: number) => {
    setFormData({
      doctor: selectedDoctor || 'Dr. Silva',
      patient: patientsList[0]?.name || '',
      patientId: patientsList[0]?.id || '1',
      date: dateStr || formatLocalDate(new Date()),
      hour: hour || 9,
      type: 'Consulta',
      insurance: 'Particular',
    });
    setIsAddModalOpen(true);
  };

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    const doc = DOCTORS.find(d => d.name === formData.doctor) || DOCTORS[0];
    const newId = `apt-${Date.now()}`;
    const dt = new Date(`${formData.date}T${String(formData.hour).padStart(2, '0')}:00:00`);

    const newApt: AppointmentItem = {
      id: newId,
      date: formData.date,
      hour: formData.hour,
      time: `${String(formData.hour).padStart(2, '0')}:00`,
      patient: formData.patient,
      patientId: formData.patientId,
      doctor: doc.name,
      doctorId: doc.id,
      type: formData.type,
      status: 'Confirmado',
      insurance: formData.insurance,
      price: formData.insurance === 'Particular' ? 280 : formData.insurance === 'Bradesco' ? 250 : 220,
    };

    // Update local state and localStorage
    const updated = [...appointments, newApt];
    setAppointments(updated);
    localStorage.setItem('clinic_appointments', JSON.stringify(updated));

    // Send to backend
    try {
      const url = backendUrl;
      await fetch(`${url}/api/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: newId,
          patient_id: newApt.patientId,
          patient_name: newApt.patient,
          doctor_id: newApt.doctorId,
          doctor_name: newApt.doctor,
          date_time: dt.toISOString(),
          status: 'confirmed',
          reason: newApt.type,
          insurance: newApt.insurance,
          price: newApt.price,
        }),
      });
    } catch (err) {
      console.warn('Erro ao salvar no backend:', err);
    }

    setIsAddModalOpen(false);
  };

  const handleUpdateStatus = async (id: string | number, newStatus: string) => {
    const updated = appointments.map(a => a.id === id ? { ...a, status: newStatus } : a);
    setAppointments(updated);
    localStorage.setItem('clinic_appointments', JSON.stringify(updated));

    try {
      const url = backendUrl;
      const backendStatus = newStatus === 'Confirmado' ? 'confirmed' : newStatus === 'Aguardando' ? 'waiting' : newStatus === 'Em Sala' ? 'in_progress' : newStatus === 'Finalizado' ? 'completed' : 'cancelled';
      await fetch(`${url}/api/appointments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: backendStatus }),
      });
    } catch {}

    if (selectedApt && selectedApt.id === id) {
      setSelectedApt({ ...selectedApt, status: newStatus });
    }
  };

  const handleDeleteAppointment = async (id: string | number) => {
    if (!confirm('Deseja realmente cancelar este agendamento?')) return;
    const updated = appointments.filter(a => a.id !== id);
    setAppointments(updated);
    localStorage.setItem('clinic_appointments', JSON.stringify(updated));

    try {
      const url = backendUrl;
      await fetch(`${url}/api/appointments/${id}`, { method: 'DELETE' });
    } catch {}

    setIsViewModalOpen(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="text-gradient" style={{ fontSize: '2rem', fontWeight: 800 }}>Agendas dos Médicos</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Central integrada de marcação e visualização de consultas da clínica.</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <button 
            onClick={() => handleOpenAddModal()}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              padding: '0.6rem 1.2rem', 
              background: 'var(--color-primary)', 
              color: '#fff', 
              border: 'none', 
              borderRadius: '8px', 
              cursor: 'pointer', 
              fontWeight: 700,
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <Plus size={18} /> Novo Agendamento
          </button>

          <button onClick={goToday} style={{ padding: '0.55rem 1rem', background: 'var(--bg-app)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>
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
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginRight: '0.5rem' }}>Filtrar por Médico:</span>
        <button
          onClick={() => setSelectedDoctor(null)}
          style={{
            padding: '0.45rem 1rem',
            borderRadius: '20px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: !selectedDoctor ? 700 : 500,
            fontSize: '0.85rem',
            backgroundColor: !selectedDoctor ? 'var(--badge-blue-bg)' : 'transparent',
            color: !selectedDoctor ? 'var(--color-accent)' : 'var(--text-muted)',
            transition: 'all 0.2s ease',
          }}
        >
          Todos os Médicos ({appointments.length})
        </button>
        {DOCTORS.map(doc => {
          const count = appointments.filter(a => a.doctor === doc.name).length;
          const isSelected = selectedDoctor === doc.name;
          return (
            <button
              key={doc.name}
              onClick={() => setSelectedDoctor(doc.name)}
              style={{
                padding: '0.45rem 1rem',
                borderRadius: '20px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: isSelected ? 700 : 500,
                fontSize: '0.85rem',
                backgroundColor: isSelected ? 'var(--badge-blue-bg)' : 'transparent',
                color: isSelected ? doc.color : 'var(--text-muted)',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: doc.color }} />
              {doc.name} ({count})
            </button>
          );
        })}
      </div>

      {/* Calendar Grid */}
      <section className="glass-panel" style={{ overflow: 'hidden' }}>
        <div style={{ minWidth: '950px' }}>
          {/* Header row */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-glass)' }}>
            <div style={{ width: '70px', flexShrink: 0, borderRight: '1px solid var(--border-color)' }}></div>
            {weekDays.map((dateObj, i) => {
              const dateStr = formatLocalDate(dateObj);
              const isToday = dateStr === formatLocalDate(new Date());
              return (
                <div key={i} style={{
                  flex: 1,
                  textAlign: 'center',
                  padding: '1rem',
                  borderRight: i < 6 ? '1px solid var(--border-color)' : 'none',
                  backgroundColor: isToday ? 'var(--bg-app)' : 'transparent'
                }}>
                  <div style={{ color: isToday ? 'var(--color-accent)' : 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase' }}>
                    {dayNames[i]}
                  </div>
                  <div style={{ color: isToday ? 'var(--color-accent)' : 'var(--text-primary)', fontSize: '1.25rem', fontWeight: 800 }}>
                    {dateObj.getDate()}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Time Slots */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {hours.map((hour, hourIdx) => (
              <div key={hour} style={{
                display: 'flex',
                borderBottom: hourIdx < hours.length - 1 ? '1px solid var(--border-color)' : 'none',
                minHeight: '85px'
              }}>
                <div style={{
                  width: '70px',
                  flexShrink: 0,
                  color: 'var(--text-muted)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  textAlign: 'center',
                  paddingTop: '0.6rem',
                  borderRight: '1px solid var(--border-color)'
                }}>
                  {hour.toString().padStart(2, '0')}:00
                </div>

                {weekDays.map((dateObj, dayIdx) => {
                  const dateStr = formatLocalDate(dateObj);
                  const slotApts = filteredAppointments.filter(a => a.date === dateStr && a.hour === hour);

                  return (
                    <div
                      key={`${dateStr}-${hour}`}
                      onClick={() => {
                        if (slotApts.length === 0) handleOpenAddModal(dateStr, hour);
                      }}
                      style={{
                        flex: 1,
                        borderRight: dayIdx < 6 ? '1px solid var(--border-color)' : 'none',
                        padding: '4px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        cursor: slotApts.length === 0 ? 'pointer' : 'default',
                        backgroundColor: 'transparent',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        if (slotApts.length === 0) e.currentTarget.style.backgroundColor = 'var(--bg-app)';
                      }}
                      onMouseLeave={(e) => {
                        if (slotApts.length === 0) e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      {slotApts.map((apt) => {
                        const docColor = getDoctorColor(apt.doctor);
                        return (
                          <div
                            key={apt.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedApt(apt);
                              setIsViewModalOpen(true);
                            }}
                            style={{
                              backgroundColor: 'var(--bg-app)',
                              borderLeft: `4px solid ${docColor}`,
                              borderRadius: '4px',
                              padding: '0.45rem 0.6rem',
                              cursor: 'pointer',
                              boxShadow: 'var(--shadow-sm)',
                              borderTop: '1px solid var(--border-color)',
                              borderRight: '1px solid var(--border-color)',
                              borderBottom: '1px solid var(--border-color)',
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ color: 'var(--text-primary)', fontSize: '0.82rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {apt.patient}
                              </span>
                              <span style={{
                                fontSize: '0.65rem',
                                fontWeight: 700,
                                padding: '0.1rem 0.35rem',
                                borderRadius: '4px',
                                backgroundColor: apt.status === 'Confirmado' ? 'rgba(16, 185, 129, 0.15)' : apt.status === 'Aguardando' ? 'rgba(245, 158, 11, 0.15)' : apt.status === 'Em Sala' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(148, 163, 184, 0.15)',
                                color: apt.status === 'Confirmado' ? '#10B981' : apt.status === 'Aguardando' ? '#F59E0B' : apt.status === 'Em Sala' ? '#3B82F6' : 'var(--text-muted)'
                              }}>
                                {apt.status}
                              </span>
                            </div>
                            <span style={{ color: docColor, fontSize: '0.74rem', fontWeight: 600, display: 'block', marginTop: '0.15rem' }}>
                              {apt.doctor} • {apt.type}
                            </span>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                              {apt.insurance}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Modal Novo Agendamento */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Novo Agendamento">
        <form onSubmit={handleCreateAppointment} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
              Médico Responsável
            </label>
            <select
              value={formData.doctor}
              onChange={(e) => setFormData({ ...formData, doctor: e.target.value })}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-app)',
                color: 'var(--text-primary)',
                fontSize: '0.95rem'
              }}
            >
              {DOCTORS.map(d => (
                <option key={d.name} value={d.name}>{d.name} — {d.specialty}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
              Paciente
            </label>
            <select
              value={formData.patient}
              onChange={(e) => {
                const pat = patientsList.find(p => p.name === e.target.value);
                setFormData({
                  ...formData,
                  patient: e.target.value,
                  patientId: pat?.id || '1',
                });
              }}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-app)',
                color: 'var(--text-primary)',
                fontSize: '0.95rem'
              }}
            >
              {patientsList.map(p => (
                <option key={p.id} value={p.name}>{p.name} {p.cpf ? `(CPF: ${p.cpf})` : ''}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
                Data
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-app)',
                  color: 'var(--text-primary)',
                  fontSize: '0.95rem'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
                Horário
              </label>
              <select
                value={formData.hour}
                onChange={(e) => setFormData({ ...formData, hour: Number(e.target.value) })}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-app)',
                  color: 'var(--text-primary)',
                  fontSize: '0.95rem'
                }}
              >
                {hours.map(h => (
                  <option key={h} value={h}>{h.toString().padStart(2, '0')}:00</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
                Tipo de Atendimento
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-app)',
                  color: 'var(--text-primary)',
                  fontSize: '0.95rem'
                }}
              >
                <option value="Consulta">Consulta</option>
                <option value="Retorno Cardiológico">Retorno Cardiológico</option>
                <option value="Avaliação ECG com IA">Avaliação ECG com IA</option>
                <option value="Exame de Rotina">Exame de Rotina</option>
                <option value="Check-up Preventivo">Check-up Preventivo</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
                Convênio / Plano
              </label>
              <select
                value={formData.insurance}
                onChange={(e) => setFormData({ ...formData, insurance: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-app)',
                  color: 'var(--text-primary)',
                  fontSize: '0.95rem'
                }}
              >
                <option value="Particular">Particular (R$ 280)</option>
                <option value="Unimed">Unimed (R$ 220)</option>
                <option value="Bradesco">Bradesco (R$ 250)</option>
                <option value="SulAmérica">SulAmérica (R$ 250)</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              style={{
                padding: '0.75rem 1.25rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'transparent',
                color: 'var(--text-secondary)',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: 'var(--color-primary)',
                color: '#fff',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Confirmar Agendamento
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Detalhes do Agendamento */}
      <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Detalhes da Consulta">
        {selectedApt && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <div style={{ padding: '1rem', backgroundColor: 'var(--bg-app)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <User size={18} color="var(--color-accent)" />
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>{selectedApt.patient}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.4rem' }}>
                <Stethoscope size={16} />
                <span>{selectedApt.doctor}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.4rem' }}>
                <Clock size={16} />
                <span>{selectedApt.date} às {selectedApt.time} ({selectedApt.type})</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                <Shield size={16} />
                <span>Convênio: <strong>{selectedApt.insurance}</strong> (R$ {selectedApt.price})</span>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
                Atualizar Status
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {['Confirmado', 'Aguardando', 'Em Sala', 'Finalizado'].map(st => (
                  <button
                    key={st}
                    onClick={() => handleUpdateStatus(selectedApt.id, st)}
                    style={{
                      padding: '0.4rem 0.8rem',
                      borderRadius: '6px',
                      border: '1px solid var(--border-color)',
                      backgroundColor: selectedApt.status === st ? 'var(--color-primary)' : 'var(--bg-app)',
                      color: selectedApt.status === st ? '#fff' : 'var(--text-primary)',
                      fontWeight: 600,
                      fontSize: '0.8rem',
                      cursor: 'pointer'
                    }}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
              <button
                type="button"
                onClick={() => handleDeleteAppointment(selectedApt.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.6rem 1rem',
                  borderRadius: '6px',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  color: '#EF4444',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                <Trash2 size={16} /> Cancelar Agendamento
              </button>

              <button
                type="button"
                onClick={() => setIsViewModalOpen(false)}
                style={{
                  padding: '0.6rem 1.25rem',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-app)',
                  color: 'var(--text-primary)',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Fechar
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
