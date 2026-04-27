import React from 'react';

// Weather condition icons with glassmorphism styling
export function WeatherIcon({ condition, size = 'md', className = '' }) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-20 h-20',
    xl: 'w-32 h-32',
  };

  const getIconColor = () => {
    if (condition?.includes('Rain') || condition?.includes('Showers')) return 'text-sky-600';
    if (condition?.includes('Clear')) return 'text-amber-500';
    if (condition?.includes('Cloudy')) return 'text-slate-500';
    return 'text-slate-500';
  };

  const getGlowColor = () => {
    if (condition?.includes('Rain') || condition?.includes('Showers')) return 'shadow-sky-500/50';
    if (condition?.includes('Clear')) return 'shadow-amber-500/50';
    if (condition?.includes('Cloudy')) return 'shadow-slate-500/40';
    return 'shadow-slate-500/40';
  };

  const renderIcon = () => {
    const colorClass = getIconColor();
    const glowClass = getGlowColor();

    if (condition?.includes('Rain')) {
      return (
        <svg className={`${sizeClasses[size]} ${colorClass} ${glowClass}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 16.2A4.5 4.5 0 0017.5 8h-1.4c-.8 0-1.5.4-2 1l-2.1 2.1a2.1 2.1 0 00-3 0l-.7-.7c-.6.6-1 .6-1 .6s-.5.5-.7.7l-2.1 2.1c-.5.6-1 1.3-1 2.2V19a3 3 0 003 3h13a3 3 0 003-3v-2.8z" />
          {condition.includes('Heavy') && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 19v-2m2 2v-2m2 2v-2" />}
        </svg>
      );
    }

    if (condition?.includes('Showers')) {
      return (
        <svg className={`${sizeClasses[size]} ${colorClass} ${glowClass}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 16.2A4.5 4.5 0 0017.5 8h-1.4c-.8 0-1.5.4-2 1l-2.1 2.1a2.1 2.1 0 00-3 0l-.7-.7c-.6.6-1 .6-1 .6s-.5.5-.7.7l-2.1 2.1c-.5.6-1 1.3-1 2.2V19a3 3 0 003 3h13a3 3 0 003-3v-2.8z" />
        </svg>
      );
    }

    if (condition?.includes('Cloudy')) {
      return (
        <svg className={`${sizeClasses[size]} ${colorClass} ${glowClass}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
        </svg>
      );
    }

    if (condition?.includes('Clear')) {
      return (
        <svg className={`${sizeClasses[size]} ${colorClass} ${glowClass}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      );
    }

    if (condition?.includes('Fog')) {
      return (
        <svg className={`${sizeClasses[size]} ${colorClass} ${glowClass}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10h14M5 14h14M5 18h14" />
        </svg>
      );
    }

    if (condition?.includes('Thunderstorm') || condition?.includes('Thunder')) {
      return (
        <svg className={`${sizeClasses[size]} ${colorClass} ${glowClass}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      );
    }

    return (
      <svg className={`${sizeClasses[size]} ${colorClass} ${glowClass}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
      </svg>
    );
  };

  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent rounded-full blur-xl opacity-50"></div>
      <div className="relative animate-float">{renderIcon()}</div>
    </div>
  );
}