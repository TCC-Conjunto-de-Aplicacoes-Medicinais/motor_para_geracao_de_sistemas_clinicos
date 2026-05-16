'use client';

import React from 'react';
import { DollarSign, User, ShieldCheck } from 'lucide-react';

const DOCTOR_BILLING = [
  { name: 'Dr. Silva', total: 12500, repasse: 2500, net: 10000, consultations: 45 },
  { name: 'Dra. Lima', total: 10800, repasse: 2160, net: 8640, consultations: 38 },
  { name: 'Dr. Santos', total: 9200, repasse: 1840, net: 7360, consultations: 32 },
];

const INSURANCE_SUMMARY = [
  { name: 'SulAmérica', total: 8500, color: '#3B82F6' },
  { name: 'Bradesco', total: 7200, color: '#EF4444' },
  { name: 'Unimed', total: 9800, color: '#10B981' },
  { name: 'Particular', total: 7000, color: '#F59E0B' },
];

export default function ManagementBillingPage() {
  const totalRevenue = DOCTOR_BILLING.reduce((acc, d) => acc + d.total, 0);
  const totalRepasse = DOCTOR_BILLING.reduce((acc, d) => acc + d.repasse, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header>
        <h1 className="text-gradient" style={{ fontSize: '2rem', fontWeight: 800 }}>Relatórios de Faturamento</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Análise detalhada de receitas por médico e convênio.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem' }}>
        {/* Billing by Doctor */}
        <section className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
            <User size={20} color="var(--color-primary)" />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Faturamento por Médico</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {DOCTOR_BILLING.map(doc => (
              <div key={doc.name} style={{ 
                padding: '1.2rem', 
                borderRadius: '12px', 
                backgroundColor: 'var(--bg-app)', 
                border: '1px solid var(--border-color)' 
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>{doc.name}</span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{doc.consultations} consultas</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Total Bruto</span>
                    <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>R$ {doc.total.toLocaleString('pt-BR')}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#F59E0B', display: 'block' }}>Repasse (20%)</span>
                    <span style={{ fontSize: '1rem', fontWeight: 600, color: '#F59E0B' }}>R$ {doc.repasse.toLocaleString('pt-BR')}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-accent)', display: 'block' }}>Receita Clínica</span>
                    <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-accent)' }}>R$ {doc.net.toLocaleString('pt-BR')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Billing by Insurance */}
        <section className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
            <ShieldCheck size={20} color="var(--color-accent)" />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Por Convênio</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            {INSURANCE_SUMMARY.map(ins => (
              <div key={ins.name} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: ins.color, flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: '0.95rem', color: 'var(--text-secondary)' }}>{ins.name}</span>
                <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  R$ {ins.total.toLocaleString('pt-BR')}
                </span>
              </div>
            ))}
            
            <div style={{ 
              marginTop: '1.5rem', 
              paddingTop: '1.5rem', 
              borderTop: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Total Bruto</span>
              <span style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                R$ {totalRevenue.toLocaleString('pt-BR')}
              </span>
            </div>
          </div>
        </section>
      </div>

      {/* Summary Footer */}
      <div style={{ 
        display: 'flex', 
        gap: '1.5rem', 
        padding: '2rem', 
        borderRadius: '16px', 
        backgroundColor: 'var(--badge-blue-bg)',
        border: '1px solid var(--color-accent)'
      }}>
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', display: 'block' }}>Total de Repasses Médicos</span>
          <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#F59E0B' }}>R$ {totalRepasse.toLocaleString('pt-BR')}</span>
        </div>
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', display: 'block' }}>Saldo Líquido Operacional</span>
          <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-accent)' }}>R$ {(totalRevenue - totalRepasse).toLocaleString('pt-BR')}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <button style={{ padding: '0.8rem 1.5rem', backgroundColor: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
            Exportar PDF
          </button>
        </div>
      </div>
    </div>
  );
}
