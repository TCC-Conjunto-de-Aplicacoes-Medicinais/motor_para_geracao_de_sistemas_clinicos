'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  clinicName: string;
  systemCost: number;
  backendUrl: string;
  config: any;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  toggleTheme: () => {},
  clinicName: 'Minha Clínica',
  systemCost: 0,
  backendUrl: '',
  config: null
});

export const useTheme = () => useContext(ThemeContext);

const PALETTES: Record<string, { primary: string; accent: string }> = {
  blue: { primary: '#1E3A8A', accent: '#3B82F6' },
  green: { primary: '#064E3B', accent: '#10B981' },
  emerald: { primary: '#064E3B', accent: '#10B981' },
  purple: { primary: '#4C1D95', accent: '#8B5CF6' },
  rose: { primary: '#881337', accent: '#F43F5E' },
  red: { primary: '#C62828', accent: '#F44336' },
};

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [clinicName, setClinicName] = useState('Clínica');
  const [backendUrl, setBackendUrl] = useState('');
  const [systemCost, setSystemCost] = useState(0);
  const [config, setConfig] = useState<any>(null);

  useEffect(() => {
    fetch('/clinic.config.json')
      .then((res) => res.json())
      .then((cfg) => {
        setConfig(cfg);
        const paletteName = cfg?.identity?.palette || 'blue';
        const colors = PALETTES[paletteName] || PALETTES['blue'];
        if(cfg?.identity?.clinicName) setClinicName(cfg.identity.clinicName);
        if(cfg?.technical?.estimatedPrice?.monthly) setSystemCost(cfg.technical.estimatedPrice.monthly);
        if(cfg?.backendUrl) setBackendUrl(cfg.backendUrl);

        document.documentElement.style.setProperty('--color-primary', colors.primary);
        document.documentElement.style.setProperty('--color-accent', colors.accent);
        
        setMounted(true);
      })
      .catch((err) => {
        console.error('Erro ao ler clinic.config.json:', err);
        setMounted(true);
      });
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    if (newTheme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  };

  if (!mounted) {
    return <div style={{ visibility: 'hidden' }}>{children}</div>;
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, clinicName, systemCost, backendUrl, config }}>
      {children}
    </ThemeContext.Provider>
  );
}
