import React from 'react';

export type SpeakyMood = 'happy' | 'celebrate' | 'thinking' | 'encouraging' | 'speaking';

interface MascotSpeakyProps {
  mood?: SpeakyMood;
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  englishTip?: string;
}

export const MascotSpeaky: React.FC<MascotSpeakyProps> = ({
  mood = 'happy',
  size = 'md',
  message,
  englishTip,
}) => {
  const dimensions = {
    sm: 'w-14 h-14',
    md: 'w-20 h-20',
    lg: 'w-28 h-28',
  }[size];

  return (
    <div className="flex items-center gap-4">
      <div
        className={`relative ${dimensions} shrink-0 select-none animate-float-slow`}
        role="img"
        aria-label="Speaky, mascota guía de UpSpeak"
      >
        {/* Glow background */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-indigo-500/30 via-emerald-400/20 to-amber-400/30 blur-md" />

        <svg
          viewBox="0 0 120 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative w-full h-full drop-shadow-md"
        >
          {/* Headset Arc */}
          <path
            d="M24 62C24 38 40 22 60 22C80 22 96 38 96 62"
            stroke="#4F46E5"
            strokeWidth="6"
            strokeLinecap="round"
          />
          {/* Body / Owl-Astro Head */}
          <rect
            x="24"
            y="30"
            width="72"
            height="68"
            rx="34"
            fill="url(#speakyGrad)"
            stroke="#312E81"
            strokeWidth="3"
          />
          {/* Belly Patch */}
          <ellipse cx="60" cy="76" rx="22" ry="15" fill="#EEF2FF" />
          {/* Left & Right Ear Pads */}
          <rect x="15" y="50" width="12" height="24" rx="6" fill="#10B981" />
          <rect x="93" y="50" width="12" height="24" rx="6" fill="#10B981" />
          {/* Visor / Eyes Plate */}
          <rect x="33" y="42" width="54" height="26" rx="13" fill="#1E1B4B" />

          {/* Eyes by Mood */}
          {mood === 'celebrate' ? (
            <>
              <path
                d="M42 56C44 51 50 51 52 56"
                stroke="#34D399"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
              <path
                d="M68 56C70 51 76 51 78 56"
                stroke="#34D399"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
            </>
          ) : mood === 'thinking' ? (
            <>
              <circle cx="47" cy="54" r="5" fill="#38BDF8" />
              <rect x="67" y="52" width="11" height="4" rx="2" fill="#38BDF8" />
            </>
          ) : (
            <>
              <circle cx="47" cy="55" r="5.5" fill="#34D399" />
              <circle cx="49" cy="53" r="2" fill="#FFFFFF" />
              <circle cx="73" cy="55" r="5.5" fill="#34D399" />
              <circle cx="75" cy="53" r="2" fill="#FFFFFF" />
            </>
          )}

          {/* Beak / Smile */}
          <path d="M55 64L65 64L60 71Z" fill="#F59E0B" />

          {/* Microphone Boom */}
          <path
            d="M95 68C95 78 82 82 70 82"
            stroke="#10B981"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <circle cx="69" cy="82" r="4" fill="#34D399" />

          {/* Crown / Level Star */}
          <path
            d="M60 12L63 19L70 20L65 25L66 32L60 28L54 32L55 25L50 20L57 19L60 12Z"
            fill="#FBBF24"
          />

          <defs>
            <linearGradient id="speakyGrad" x1="24" y1="30" x2="96" y2="98" gradientUnits="userSpaceOnUse">
              <stop stopColor="#6366F1" />
              <stop offset="1" stopColor="#4338CA" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {(message || englishTip) && (
        <div className="relative bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-900/70 rounded-2xl p-3.5 shadow-sm max-w-md">
          {message && (
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-snug">
              {message}
            </p>
          )}
          {englishTip && (
            <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400 mt-1 italic">
              “{englishTip}”
            </p>
          )}
        </div>
      )}
    </div>
  );
};
