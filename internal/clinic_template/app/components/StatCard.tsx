'use client';

import React from 'react';

interface StatCardProps {
  label: string;
  value: string;
  color?: string;
}

export default function StatCard({ label, value, color = 'var(--color-primary)' }: StatCardProps) {
  return (
    <div className="glass-panel" style={{
      padding: '1.5rem',
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      cursor: 'default'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-4px)';
      e.currentTarget.style.boxShadow = 'var(--shadow-md)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = 'var(--shadow-glass)';
    }}>
      <span style={{ 
        fontSize: '2.5rem', 
        fontWeight: 800, 
        color: color,
        lineHeight: 1
      }}>
        {value}
      </span>
      <span style={{ 
        fontSize: '0.9rem', 
        color: 'var(--text-secondary)',
        fontWeight: 500
      }}>
        {label}
      </span>
    </div>
  );
}
