import { db } from '../database/db';
import { CONTENT_CATALOG_VERSION, DB_SCHEMA_VERSION } from '../database/schema';
import { sanitizeInput } from '../utils';
import type { BackupPayload } from '../types';

export interface BackupValidationResult {
  valid: boolean;
  error?: string;
  payload?: BackupPayload;
  summary?: {
    profilesCount: number;
    lessonsCount: number;
    vocabCount: number;
    exportedAt: string;
    schemaVersion: number;
  };
}

export async function createBackupJSON(): Promise<string> {
  const [
    profiles,
    lessonProgress,
    vocabularyProgress,
    exerciseHistory,
    achievements,
    dailyMissions,
  ] = await Promise.all([
    db.profiles.toArray(),
    db.lessonProgress.toArray(),
    db.vocabularyProgress.toArray(),
    db.exerciseHistory.toArray(),
    db.achievements.toArray(),
    db.dailyMissions.toArray(),
  ]);

  const payload: BackupPayload = {
    app: 'UpSpeak',
    schemaVersion: DB_SCHEMA_VERSION,
    contentVersion: CONTENT_CATALOG_VERSION,
    exportedAt: new Date().toISOString(),
    data: {
      profiles,
      lessonProgress,
      vocabularyProgress,
      exerciseHistory,
      achievements,
      dailyMissions,
    },
  };

  return JSON.stringify(payload, null, 2);
}

export function validateBackupJSON(rawText: string): BackupValidationResult {
  if (!rawText || typeof rawText !== 'string') {
    return { valid: false, error: 'El archivo de respaldo está vacío o no es texto válido.' };
  }

  try {
    const parsed = JSON.parse(rawText) as Partial<BackupPayload>;

    if (parsed.app !== 'UpSpeak') {
      return { valid: false, error: 'El archivo no pertenece a un respaldo oficial de UpSpeak.' };
    }

    if (typeof parsed.schemaVersion !== 'number' || parsed.schemaVersion > DB_SCHEMA_VERSION) {
      return {
        valid: false,
        error: `Versión de esquema incompatible (${parsed.schemaVersion}). Versión máxima soportada: ${DB_SCHEMA_VERSION}.`,
      };
    }

    if (!parsed.data || !Array.isArray(parsed.data.profiles) || parsed.data.profiles.length === 0) {
      return {
        valid: false,
        error: 'El respaldo no contiene perfiles de estudiante válidos.',
      };
    }

    for (const p of parsed.data.profiles) {
      if (!p.id || !p.name || typeof p.xp !== 'number') {
        return { valid: false, error: 'Estructura de perfil corrupta dentro del archivo JSON.' };
      }
      p.name = sanitizeInput(p.name, 40);
    }

    const fullPayload = parsed as BackupPayload;

    return {
      valid: true,
      payload: fullPayload,
      summary: {
        profilesCount: fullPayload.data.profiles.length,
        lessonsCount: fullPayload.data.lessonProgress?.length ?? 0,
        vocabCount: fullPayload.data.vocabularyProgress?.length ?? 0,
        exportedAt: fullPayload.exportedAt || new Date().toISOString(),
        schemaVersion: fullPayload.schemaVersion,
      },
    };
  } catch {
    return { valid: false, error: 'Formato JSON inválido. Verifica que el archivo no haya sido modificado.' };
  }
}

export async function restoreFromBackupPayload(payload: BackupPayload): Promise<void> {
  await db.transaction(
    'rw',
    [
      db.profiles,
      db.lessonProgress,
      db.vocabularyProgress,
      db.exerciseHistory,
      db.achievements,
      db.dailyMissions,
    ],
    async () => {
      await db.profiles.clear();
      await db.lessonProgress.clear();
      await db.vocabularyProgress.clear();
      await db.exerciseHistory.clear();
      await db.achievements.clear();
      await db.dailyMissions.clear();

      if (payload.data.profiles?.length) {
        await db.profiles.bulkPut(payload.data.profiles);
      }
      if (payload.data.lessonProgress?.length) {
        await db.lessonProgress.bulkPut(payload.data.lessonProgress);
      }
      if (payload.data.vocabularyProgress?.length) {
        await db.vocabularyProgress.bulkPut(payload.data.vocabularyProgress);
      }
      if (payload.data.exerciseHistory?.length) {
        await db.exerciseHistory.bulkPut(payload.data.exerciseHistory);
      }
      if (payload.data.achievements?.length) {
        await db.achievements.bulkPut(payload.data.achievements);
      }
      if (payload.data.dailyMissions?.length) {
        await db.dailyMissions.bulkPut(payload.data.dailyMissions);
      }
    }
  );
}
