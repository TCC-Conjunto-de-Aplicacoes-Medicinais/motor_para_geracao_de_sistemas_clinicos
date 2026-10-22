'use client';

import React, { useState } from 'react';

interface PatientAvatarProps {
  name: string;
  size?: number;
  gender?: string;
  style?: React.CSSProperties;
}

// Sem fotos de exemplo: o avatar mostra a inicial do paciente.
function getAvatarUrl(_name: string, _gender?: string): string {
  return '';
}

export default function PatientAvatar({ name, size = 44, gender, style }: PatientAvatarProps) {
  const [imgError, setImgError] = useState(false);
  const avatarUrl = getAvatarUrl(name, gender);
  const initial = (name || 'P').charAt(0).toUpperCase();

  const isFemale = gender === 'F' || (name || '').toLowerCase().includes('maria') || (name || '').toLowerCase().includes('ana');
  const gradient = isFemale
    ? 'linear-gradient(135deg, #EC4899, #8B5CF6)'
    : 'linear-gradient(135deg, #2563EB, #0D9488)';

  if (imgError || !avatarUrl) {
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
