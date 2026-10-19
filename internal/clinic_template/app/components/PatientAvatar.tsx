'use client';

import React, { useState } from 'react';

interface PatientAvatarProps {
  name: string;
  size?: number;
  gender?: string;
  style?: React.CSSProperties;
}

const DEFAULT_AVATARS: Record<string, string> = {
  'maria santos': 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=256',
  'carlos eduardo': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=256',
  'carlos eduardo oliveira': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=256',
  'ana beatriz': 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=256',
  'ana beatriz lima': 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=256',
  'roberto ferreira': 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=256',
  'roberto ferreira costa': 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=256',
};

function getAvatarUrl(name: string, gender?: string): string {
  const normalized = (name || '').toLowerCase().trim();
  for (const [key, url] of Object.entries(DEFAULT_AVATARS)) {
    if (normalized.includes(key)) return url;
  }
  // Fallback para novo paciente
  if (gender === 'F' || normalized.endsWith('a') || normalized.includes('ana') || normalized.includes('maria')) {
    return `https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=256`;
  }
  return `https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=256`;
}

export default function PatientAvatar({ name, size = 44, gender, style }: PatientAvatarProps) {
  const [imgError, setImgError] = useState(false);
  const avatarUrl = getAvatarUrl(name, gender);
  const initial = (name || 'P').charAt(0).toUpperCase();

  const isFemale = gender === 'F' || (name || '').toLowerCase().includes('maria') || (name || '').toLowerCase().includes('ana');
  const gradient = isFemale
    ? 'linear-gradient(135deg, #EC4899, #8B5CF6)'
    : 'linear-gradient(135deg, #2563EB, #0D9488)';

  if (imgError) {
    return (
      <div
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: '50%',
          background: gradient,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          fontWeight: 800,
          fontSize: `${Math.round(size * 0.42)}px`,
          flexShrink: 0,
          boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
          ...style,
        }}
        title={name}
      >
        {initial}
      </div>
    );
  }

  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        overflow: 'hidden',
        flexShrink: 0,
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        border: '2px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
        position: 'relative',
        ...style,
      }}
      title={name}
    >
      <img
        src={avatarUrl}
        alt={name}
        onError={() => setImgError(true)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
        }}
      />
    </div>
  );
}
