'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '../components/ThemeProvider';
import { TrendingUp, TrendingDown, DollarSign, PieChart } from 'lucide-react';

export default function ManagementDashboard() {
  const { systemCost, config } = useTheme();
  const router = useRouter();

  const mgmtFeatures = config?.modules?.management?.features;
  const showDashboards = mgmtFeatures ? mgmtFeatures.dashboards === true : true;
  const showBilling = mgmtFeatures ? (mgmtFeatures.billingControl === true || mgmtFeatures.billingByDoctor === true) : true;
  const showStaff = mgmtFeatures ? mgmtFeatures.staffRegistration !== false : true;

  useEffect(() => {
    if (!showDashboards && !showBilling && showStaff) {
      router.push('/management/staff');
    }
  }, [showDashboards, showBilling, showStaff, router]);

  // Mock financial data
  const revenue = 32500;
  const doctorCosts = revenue * 0.20; // 20% commission
  const netProfit = revenue - doctorCosts - systemCost;

  const stats = [
    { label: 'Receita Bruta', value: revenue, icon: TrendingUp, color: 'var(--color-accent)' },
    { label: 'Repasse Médicos (20%)', value: doctorCosts, icon: TrendingDown, color: '#F59E0B' },
    { label: 'Custo do Sistema', value: systemCost, icon: DollarSign, color: '#EF4444' },
    { label: 'Lucro Líquido', value: netProfit, icon: PieChart, color: 'var(--color-primary)' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header>
        <h1 className="text-gradient" style={{ fontSize: '2rem', fontWeight: 800 }}>Dashboard Gerencial</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Visão geral da saúde financeira e performance da clínica.</p>
      </header>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
        {stats.map(stat => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="glass-panel" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--bg-app)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid var(--border-color)'
                }}>
                  <Icon size={20} color={stat.color} />
                </div>
                <span style={{ 
                  fontSize: '0.75rem', 
                  fontWeight: 600, 
                  color: stat.label === 'Receita Bruta' ? 'var(--badge-green-text)' : 'var(--text-muted)',
                  backgroundColor: stat.label === 'Receita Bruta' ? 'var(--badge-green-bg)' : 'transparent',
                  padding: '0.2rem 0.5rem',
                  borderRadius: '12px'
                }}>
                  {stat.label === 'Receita Bruta' ? '+12%' : ''}
                </span>
              </div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>{stat.label}</span>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                R$ {stat.value.toLocaleString('pt-BR')}
              </h2>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        {/* Revenue Distribution Chart (Simulated with CSS) */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>Distribuição de Receita</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              { label: 'Particular', value: 45, color: 'var(--color-primary)' },
              { label: 'Unimed', value: 25, color: 'var(--color-accent)' },
              { label: 'Bradesco', value: 20, color: '#3B82F6' },
              { label: 'SulAmérica', value: 10, color: '#EF4444' },
            ].map(item => (
              <div key={item.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.value}%</span>
                </div>
                <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--bg-app)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${item.value}%`, height: '100%', backgroundColor: item.color, borderRadius: '4px' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Cost Alert */}
        <div className="glass-panel" style={{ 
          padding: '2rem', 
          backgroundColor: 'rgba(245, 158, 11, 0.05)', 
          border: '1px solid rgba(245, 158, 11, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <DollarSign size={24} color="#F59E0B" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#F59E0B' }}>Custo do Sistema</h3>
          </div>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Este valor é calculado dinamicamente com base no dimensionamento da sua clínica (médicos, assistentes e volume de pacientes).
          </p>
          <div style={{ marginTop: '1rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Mensalidade Estimada</span>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              R$ {systemCost.toLocaleString('pt-BR')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
