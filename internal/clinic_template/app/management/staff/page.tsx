'use client';

import React, { useState, useEffect } from 'react';
import { UserPlus, UserMinus, MoreHorizontal, CheckCircle, XCircle, Stethoscope, User } from 'lucide-react';
import Modal from '../../components/Modal';

interface StaffMember {
  id: string;
  name: string;
  role: string;
  email?: string;
  crm?: string;
  status: 'ativo' | 'inativo';
  days: number;
  absences: number;
  presence: number;
}

const DEFAULT_STAFF: StaffMember[] = []; // equipe sem exemplos; cadastro ainda é local (sem rota no backend)

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>(DEFAULT_STAFF);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    role: 'Médico',
    email: '',
    crm: '',
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem('clinic_staff_list');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setStaff(parsed);
        }
      }
    } catch {}
  }, []);

  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    const newMember: StaffMember = {
      id: String(Date.now()),
      name: formData.name,
      role: formData.role,
      email: formData.email,
      crm: formData.crm,
      status: 'ativo',
      days: 22,
      absences: 0,
      presence: 100,
    };

    const updated = [newMember, ...staff];
    setStaff(updated);
    localStorage.setItem('clinic_staff_list', JSON.stringify(updated));
    setFormData({ name: '', role: 'Médico', email: '', crm: '' });
    setIsModalOpen(false);
  };

  const toggleStatus = (id: string) => {
    const updated = staff.map(s => {
      if (s.id !== id) return s;
      const nextStatus: 'ativo' | 'inativo' = s.status === 'ativo' ? 'inativo' : 'ativo';
      return { ...s, status: nextStatus };
    });
    setStaff(updated);
    localStorage.setItem('clinic_staff_list', JSON.stringify(updated));
  };

  const activeCount = staff.filter(s => s.status === 'ativo').length;
  const doctorCount = staff.filter(s => s.role.includes('Médic') && s.status === 'ativo').length;
  const assistantCount = staff.filter(s => s.role === 'Assistente' && s.status === 'ativo').length;
  const inactiveCount = staff.filter(s => s.status === 'inativo').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="text-gradient" style={{ fontSize: '2rem', fontWeight: 800 }}>Equipe & Presença</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Gerencie os profissionais e monitore o controle de presença mensal.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            padding: '0.6rem 1.2rem', 
            backgroundColor: 'var(--color-primary)', 
            color: '#fff', 
            border: 'none', 
            borderRadius: '8px', 
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <UserPlus size={18} /> Cadastrar Funcionário
        </button>
      </header>

      {/* Summary Cards */}
      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
        {[
          { label: 'Ativos', value: activeCount, color: 'var(--color-accent)' },
          { label: 'Médicos', value: doctorCount, color: 'var(--color-primary)' },
          { label: 'Assistentes', value: assistantCount, color: '#3B82F6' },
          { label: 'Inativos', value: inactiveCount, color: '#EF4444' },
        ].map(stat => (
          <div key={stat.label} className="glass-panel" style={{ flex: 1, minWidth: '140px', padding: '1.5rem', textAlign: 'center' }}>
            <span style={{ fontSize: '2rem', fontWeight: 800, color: stat.color, lineHeight: 1 }}>{stat.value}</span>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.3rem' }}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Staff Table */}
      <section className="glass-panel" style={{ overflow: 'hidden' }}>
        <div style={{ minWidth: '800px' }}>
          {/* Table Header */}
          <div style={{ 
            display: 'flex', 
            padding: '1rem 1.5rem', 
            borderBottom: '1px solid var(--border-color)', 
            backgroundColor: 'var(--bg-glass)',
            color: 'var(--text-muted)',
            fontSize: '0.75rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            <div style={{ flex: 2 }}>Profissional</div>
            <div style={{ flex: 1, textAlign: 'center' }}>Cargo</div>
            <div style={{ flex: 1, textAlign: 'center' }}>Dias Trab.</div>
            <div style={{ flex: 1, textAlign: 'center' }}>Faltas</div>
            <div style={{ flex: 1.5, textAlign: 'center' }}>Presença</div>
            <div style={{ flex: 1, textAlign: 'center' }}>Ações</div>
          </div>

          {/* Table Body */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {staff.map((member, i) => {
              const presenceColor = member.presence >= 95 ? 'var(--color-accent)' : member.presence >= 85 ? '#F59E0B' : '#EF4444';
              const isDoctor = member.role.includes('Médic');

              return (
                <div key={member.id || member.name} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  padding: '1.1rem 1.5rem', 
                  borderBottom: i < staff.length - 1 ? '1px solid var(--border-color)' : 'none',
                  opacity: member.status === 'inativo' ? 0.55 : 1,
                  transition: 'background-color 0.2s ease'
                }}>
                  {/* Name + Status */}
                  <div style={{ flex: 2, display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ 
                      width: '42px', 
                      height: '42px', 
                      borderRadius: '50%', 
                      backgroundColor: isDoctor ? 'var(--badge-blue-bg)' : 'rgba(16, 185, 129, 0.1)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      fontWeight: 700,
                      color: isDoctor ? 'var(--color-accent)' : '#10B981',
                      border: '1px solid var(--border-color)',
                      flexShrink: 0
                    }}>
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block' }}>
                        {member.name}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {member.crm ? `CRM: ${member.crm}` : member.email || 'Cadastrado'}
                      </span>
                    </div>
                  </div>

                  {/* Role */}
                  <div style={{ flex: 1, textAlign: 'center' }}>
                    <span style={{
                      padding: '0.2rem 0.6rem',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      backgroundColor: isDoctor ? 'var(--badge-blue-bg)' : 'rgba(16, 185, 129, 0.1)',
                      color: isDoctor ? 'var(--color-accent)' : '#10B981'
                    }}>
                      {member.role}
                    </span>
                  </div>

                  {/* Days */}
                  <div style={{ flex: 1, textAlign: 'center', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    {member.days} d
                  </div>

                  {/* Absences */}
                  <div style={{ flex: 1, textAlign: 'center', fontWeight: 600, color: member.absences > 0 ? '#EF4444' : 'var(--text-muted)' }}>
                    {member.absences}
                  </div>

                  {/* Presence Bar */}
                  <div style={{ flex: 1.5, padding: '0 1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.3rem' }}>
                      <span style={{ color: presenceColor }}>{member.presence}%</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--bg-app)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${member.presence}%`, height: '100%', backgroundColor: presenceColor, borderRadius: '3px' }} />
                    </div>
                  </div>

                  {/* Status Toggle Button */}
                  <div style={{ flex: 1, textAlign: 'center' }}>
                    <button
                      onClick={() => toggleStatus(member.id)}
                      style={{
                        padding: '0.35rem 0.75rem',
                        borderRadius: '6px',
                        border: '1px solid var(--border-color)',
                        backgroundColor: member.status === 'ativo' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color: member.status === 'ativo' ? '#10B981' : '#EF4444',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                      title="Clique para alternar status ativo/inativo"
                    >
                      {member.status === 'ativo' ? 'Ativo' : 'Inativo'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Modal Cadastrar Funcionário */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Cadastrar Profissional">
        <form onSubmit={handleCreateStaff} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
              Nome Completo
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Dra. Mariana Vasconcelos"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
                Cargo
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
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
                <option value="Médico">Médico</option>
                <option value="Médica">Médica</option>
                <option value="Assistente">Assistente</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
                CRM (Se Médico)
              </label>
              <input
                type="text"
                placeholder="Ex: 123456/SP"
                value={formData.crm}
                onChange={(e) => setFormData({ ...formData, crm: e.target.value })}
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
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
              E-mail de Acesso
            </label>
            <input
              type="email"
              placeholder="Ex: doutora@clinica.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
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
              Cadastrar
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
