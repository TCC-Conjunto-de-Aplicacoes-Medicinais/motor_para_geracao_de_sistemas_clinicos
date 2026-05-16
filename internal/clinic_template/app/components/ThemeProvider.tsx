'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  clinicName: string;
  systemCost: number;
  backendUrl: string;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  toggleTheme: () => {},
  clinicName: 'Minha Clínica',
  systemCost: 0,
  backendUrl: ''
});

export const useTheme = () => useContext(ThemeContext);

const PALETTES: Record<string, { primary: string; accent: string }> = {
  blue: { primary: '#1E3A8A', accent: '#3B82F6' },
  green: { primary: '#064E3B', accent: '#10B981' },
  emerald: { primary: '#064E3B', accent: '#10B981' },
  purple: { primary: '#4C1D95', accent: '#8B5CF6' },
  rose: { primary: '#881337', accent: '#F43F5E' },
};

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [clinicName, setClinicName] = useState('Clínica');
  const [backendUrl, setBackendUrl] = useState('');
  const [systemCost, setSystemCost] = useState(0);

  useEffect(() => {
    fetch('/clinic.config.json')
      .then((res) => res.json())
      .then((config) => {
        const paletteName = config?.identity?.palette || 'blue';
        const colors = PALETTES[paletteName] || PALETTES['blue'];
        if(config?.identity?.clinicName) setClinicName(config.identity.clinicName);
        if(config?.technical?.estimatedPrice?.monthly) setSystemCost(config.technical.estimatedPrice.monthly);
        if(config?.backendUrl) setBackendUrl(config.backendUrl);


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
    <ThemeContext.Provider value={{ theme, toggleTheme, clinicName, systemCost, backendUrl }}>
      {children}
    </ThemeContext.Provider>
  );
}
