'use client';

import React from 'react';

const INSURANCE_BILLING = [
  {
    name: 'SulAmérica',
    color: '#3B82F6',
    items: [
      { type: 'Consultas', qty: 8, value: 2000 },
      { type: 'Exames', qty: 4, value: 1200 },
      { type: 'Retornos', qty: 3, value: 600 },
    ],
  },
  {
    name: 'Bradesco',
    color: '#EF4444',
    items: [
      { type: 'Consultas', qty: 5, value: 1250 },
      { type: 'Exames', qty: 2, value: 600 },
      { type: 'Retornos', qty: 2, value: 400 },
    ],
  },
  {
    name: 'Unimed',
    color: '#10B981',
    items: [
      { type: 'Consultas', qty: 6, value: 1500 },
      { type: 'Exames', qty: 3, value: 900 },
      { type: 'Retornos', qty: 1, value: 200 },
    ],
  },
  {
    name: 'Particular',
    color: '#F59E0B',
    items: [
      { type: 'Consultas', qty: 10, value: 3500 },
      { type: 'Exames', qty: 4, value: 1200 },
    ],
  },
];

export default function BillingPage() {
  const totalGeral = INSURANCE_BILLING.reduce(
    (sum, ins) => sum + ins.items.reduce((s, it) => s + it.value, 0),
    0,
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header>
        <h1 className="text-gradient" style={{ fontSize: '2rem', fontWeight: 800 }}>Faturamento</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Detalhamento de faturamento por convênio.</p>
      </header>

      {/* Insurance cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {INSURANCE_BILLING.map(insurance => {
          const insTotal = insurance.items.reduce((s, it) => s + it.value, 0);
          return (
            <section key={insurance.name} className="glass-panel" style={{ overflow: 'hidden' }}>
              {/* Insurance header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1.2rem 1.5rem',
                borderBottom: '1px solid var(--border-color)',
                backgroundColor: `${insurance.color}08`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: insurance.color,
                    flexShrink: 0,
                  }} />
                  <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {insurance.name}
                  </span>
                </div>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: insurance.color }}>
                  R$ {insTotal.toLocaleString('pt-BR')}
                </span>
              </div>

              {/* Breakdown */}
              {insurance.items.map((item, i) => (
                <div
                  key={item.type}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.8rem 1.5rem',
                    borderBottom: i < insurance.items.length - 1 ? '1px solid var(--border-color)' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
                      {item.type}
                    </span>
                    <span style={{
                      padding: '0.1rem 0.4rem',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      backgroundColor: 'var(--bg-app)',
                      color: 'var(--text-muted)',
                    }}>
                      {item.qty}x
                    </span>
                  </div>
                  <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    R$ {item.value.toLocaleString('pt-BR')}
                  </span>
                </div>
              ))}
            </section>
          );
        })}

        {/* Total Geral */}
        <div style={{
          padding: '1.5rem',
          borderRadius: '16px',
          backgroundColor: 'var(--badge-blue-bg)',
          border: '1px solid var(--color-accent)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Total Geral
          </span>
          <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-accent)' }}>
            R$ {totalGeral.toLocaleString('pt-BR')}
          </span>
        </div>
      </div>
    </div>
  );
}
