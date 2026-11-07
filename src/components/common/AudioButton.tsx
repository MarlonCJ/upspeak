import React, { useState } from 'react';
import { Volume2 } from 'lucide-react';
import { speakEnglish } from '../../services/speechService';

interface AudioButtonProps {
  text: string;
  rate?: number;
  accent?: 'en-US' | 'en-GB';
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const AudioButton: React.FC<AudioButtonProps> = ({
  text,
  rate = 0.95,
  accent = 'en-US',
  label,
  size = 'md',
  className = '',
}) => {
  const [speaking, setSpeaking] = useState(false);

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSpeaking(true);
    speakEnglish(text, {
      rate,
      lang: accent,
      onStart: () => setSpeaking(true),
      onEnd: () => setSpeaking(false),
    });
  };

  const sizeClasses = {
    sm: 'p-1.5 text-xs',
    md: 'p-2.5 text-sm',
    lg: 'px-4 py-2.5 text-base',
  }[size];

  return (
    <button
      type="button"
      onClick={handlePlay}
      aria-label={`Escuchar pronunciación de: ${text}`}
      title={`Escuchar "${text}"`}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-150 ${
        speaking
          ? 'bg-indigo-600 text-white ring-4 ring-indigo-500/30 scale-105'
          : 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 border border-indigo-200/70 dark:border-indigo-800/70'
      } ${sizeClasses} ${className}`}
    >
      <Volume2 className={`w-4 h-4 ${speaking ? 'animate-bounce' : ''}`} />
      {label && <span>{label}</span>}
    </button>
  );
};
