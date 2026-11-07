import type { CEFRLevelId } from '../types';

/**
 * Sanitiza entradas de texto de usuario para prevenir inyecciones HTML/XSS locales
 */
export function sanitizeInput(raw: string, maxLength = 250): string {
  if (!raw) return '';
  return raw
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim()
    .slice(0, maxLength);
}

/**
 * Normaliza respuestas en inglés para comparación justa (ignora puntuación irrelevante y mayúsculas,
 * y expande contracciones comunes equivalentes)
 */
export function normalizeEnglishAnswer(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[.,!?;:"'’`]/g, '')
    .replace(/\bi am\b/g, 'im')
    .replace(/\bdo not\b/g, 'dont')
    .replace(/\bdoes not\b/g, 'doesnt')
    .replace(/\bdid not\b/g, 'didnt')
    .replace(/\bis not\b/g, 'isnt')
    .replace(/\bare not\b/g, 'arent')
    .replace(/\bwas not\b/g, 'wasnt')
    .replace(/\bwere not\b/g, 'werent')
    .replace(/\bhave not\b/g, 'havent')
    .replace(/\bhas not\b/g, 'hasnt')
    .replace(/\bwill not\b/g, 'wont')
    .replace(/\bcannot\b/g, 'cant')
    .replace(/\bcan not\b/g, 'cant')
    .replace(/\s+/g, ' ');
}

/**
 * Calcula similitud entre dos cadenas (0 a 100) usando distancia de Levenshtein
 */
export function calculateStringSimilarity(a: string, b: string): number {
  const s1 = normalizeEnglishAnswer(a);
  const s2 = normalizeEnglishAnswer(b);
  if (s1 === s2) return 100;
  if (!s1.length || !s2.length) return 0;

  const matrix: number[][] = [];
  for (let i = 0; i <= s2.length; i++) matrix[i] = [i];
  for (let j = 0; j <= s1.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= s2.length; i++) {
    for (let j = 1; j <= s1.length; j++) {
      if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  const maxLen = Math.max(s1.length, s2.length);
  const distance = matrix[s2.length][s1.length];
  return Math.max(0, Math.round(((maxLen - distance) / maxLen) * 100));
}

/**
 * Calcula estrellas (1 a 3) según porcentaje de acierto
 */
export function calculateStars(scorePercent: number): 0 | 1 | 2 | 3 {
  if (scorePercent >= 90) return 3;
  if (scorePercent >= 75) return 2;
  if (scorePercent >= 60) return 1;
  return 0;
}

/**
 * Obtiene la fecha local en formato YYYY-MM-DD
 */
export function getTodayISO(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calcula el estado de la racha comparando la última fecha de actividad con hoy
 */
export function calculateUpdatedStreak(lastDate: string, currentStreak: number): number {
  const today = getTodayISO();
  if (!lastDate) return 1;
  if (lastDate === today) return Math.max(1, currentStreak);

  const last = new Date(`${lastDate}T00:00:00`);
  const now = new Date(`${today}T00:00:00`);
  const diffDays = Math.round((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 1) {
    return currentStreak + 1;
  }
  return 1;
}

/**
 * Metadatos visuales de cada nivel MCER (A1 - C2)
 */
export const CEFR_LEVEL_META: Record<
  CEFRLevelId,
  {
    nameEs: string;
    nameEn: string;
    badgeBg: string;
    badgeText: string;
    gradient: string;
    minXp: number;
  }
> = {
  A1: {
    nameEs: 'Principiante',
    nameEn: 'Beginner',
    badgeBg: 'bg-emerald-500/15 border border-emerald-500/30',
    badgeText: 'text-emerald-600 dark:text-emerald-400',
    gradient: 'from-emerald-500 to-teal-600',
    minXp: 0,
  },
  A2: {
    nameEs: 'Elemental',
    nameEn: 'Elementary',
    badgeBg: 'bg-sky-500/15 border border-sky-500/30',
    badgeText: 'text-sky-600 dark:text-sky-400',
    gradient: 'from-sky-500 to-blue-600',
    minXp: 400,
  },
  B1: {
    nameEs: 'Intermedio',
    nameEn: 'Intermediate',
    badgeBg: 'bg-indigo-500/15 border border-indigo-500/30',
    badgeText: 'text-indigo-600 dark:text-indigo-400',
    gradient: 'from-indigo-500 to-violet-600',
    minXp: 1000,
  },
  B2: {
    nameEs: 'Intermedio Superior',
    nameEn: 'Upper Intermediate',
    badgeBg: 'bg-purple-500/15 border border-purple-500/30',
    badgeText: 'text-purple-600 dark:text-purple-400',
    gradient: 'from-purple-500 to-fuchsia-600',
    minXp: 2000,
  },
  C1: {
    nameEs: 'Avanzado',
    nameEn: 'Advanced',
    badgeBg: 'bg-amber-500/15 border border-amber-500/30',
    badgeText: 'text-amber-600 dark:text-amber-400',
    gradient: 'from-amber-500 to-orange-600',
    minXp: 3500,
  },
  C2: {
    nameEs: 'Dominio / Maestría',
    nameEn: 'Mastery',
    badgeBg: 'bg-rose-500/15 border border-rose-500/30',
    badgeText: 'text-rose-600 dark:text-rose-400',
    gradient: 'from-rose-500 to-red-600',
    minXp: 5500,
  },
};
