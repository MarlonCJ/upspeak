import type { VocabularySRSRecord, VocabularyCategoryId } from '../../types';

/**
 * Implementación del Algoritmo de Repetición Espaciada SM-2 adaptado para UpSpeak
 * quality: 0 (olvido total) a 5 (respuesta perfecta e inmediata)
 */
export function calculateNextSRSReview(
  current: VocabularySRSRecord | undefined,
  profileId: string,
  wordId: string,
  category: VocabularyCategoryId,
  quality: 0 | 1 | 2 | 3 | 4 | 5
): VocabularySRSRecord {
  const now = new Date();
  let repetitions = current?.repetitions ?? 0;
  let interval = current?.interval ?? 0;
  let easeFactor = current?.easeFactor ?? 2.5;
  const isFavorite = current?.isFavorite ?? false;

  if (quality >= 3) {
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 3;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetitions += 1;
  } else {
    repetitions = 0;
    interval = 1;
  }

  easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (easeFactor < 1.3) easeFactor = 1.3;

  const nextDate = new Date(now.getTime() + interval * 24 * 60 * 60 * 1000);
  const masteryLevel = Math.min(5, Math.max(1, repetitions)) as 0 | 1 | 2 | 3 | 4 | 5;

  return {
    id: `${profileId}_${wordId}`,
    profileId,
    wordId,
    category,
    isFavorite,
    masteryLevel: quality < 3 ? 1 : masteryLevel,
    nextReviewDate: nextDate.toISOString(),
    interval,
    easeFactor: Number(easeFactor.toFixed(2)),
    repetitions,
    lastReviewedAt: now.toISOString(),
  };
}

/**
 * Determina si una palabra necesita repaso hoy o antes
 */
export function isDueForReview(record: VocabularySRSRecord, referenceDate = new Date()): boolean {
  if (!record.nextReviewDate) return true;
  return new Date(record.nextReviewDate).getTime() <= referenceDate.getTime();
}
