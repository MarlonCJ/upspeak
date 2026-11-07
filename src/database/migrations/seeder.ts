import { db } from '../db';
import { CONTENT_CATALOG_VERSION } from '../schema';
import { ALL_LESSONS, ACHIEVEMENTS_CATALOG } from '../../content/levels/catalog';
import { getTodayISO } from '../../utils';
import type { UserProfile, DailyMissionItem } from '../../types';

export function buildDefaultDailyMissions(): DailyMissionItem[] {
  return [
    {
      id: 'mission_xp_50',
      title: 'Gana 50 XP en lecciones o prácticas hoy',
      target: 50,
      current: 0,
      xpReward: 25,
      coinReward: 10,
      completed: false,
      type: 'xp',
    },
    {
      id: 'mission_lesson_1',
      title: 'Completa 1 lección académica del mapa MCER',
      target: 1,
      current: 0,
      xpReward: 30,
      coinReward: 15,
      completed: false,
      type: 'lessons',
    },
    {
      id: 'mission_words_3',
      title: 'Practica o marca 3 palabras en el Vocabulario',
      target: 3,
      current: 0,
      xpReward: 20,
      coinReward: 10,
      completed: false,
      type: 'words',
    },
  ];
}

export async function initializeProfileProgress(profileId: string): Promise<void> {
  const existingLessons = await db.lessonProgress.where('profileId').equals(profileId).count();

  if (existingLessons === 0) {
    const lessonRecords = ALL_LESSONS.map((lesson, index) => ({
      id: `${profileId}_${lesson.id}`,
      profileId,
      lessonId: lesson.id,
      levelId: lesson.level,
      unitId: lesson.unitId,
      // La primera lección de cada nivel y la primera global están disponibles para explorar progresivamente
      status: index === 0 || lesson.order === 1 ? ('available' as const) : ('locked' as const),
      bestScore: 0,
      stars: 0 as const,
      attempts: 0,
      completedAt: '',
    }));
    await db.lessonProgress.bulkPut(lessonRecords);
  }

  const existingAchievements = await db.achievements.where('profileId').equals(profileId).count();
  if (existingAchievements === 0) {
    const achievementRecords = ACHIEVEMENTS_CATALOG.map((ach) => ({
      id: `${profileId}_${ach.id}`,
      profileId,
      achievementId: ach.id,
      progress: 0,
      unlocked: false,
    }));
    await db.achievements.bulkPut(achievementRecords);
  }

  const today = getTodayISO();
  const missionId = `${profileId}_${today}`;
  const todayMission = await db.dailyMissions.get(missionId);
  if (!todayMission) {
    await db.dailyMissions.put({
      id: missionId,
      profileId,
      date: today,
      missions: buildDefaultDailyMissions(),
    });
  }
}

/**
 * Carga inicial idempotente con control de versiones y prevención de duplicados
 */
export async function ensureDatabaseSeeded(): Promise<UserProfile> {
  const profilesCount = await db.profiles.count();
  let activeProfile: UserProfile | undefined;

  if (profilesCount === 0) {
    const defaultProfile: UserProfile = {
      id: 'profile_default_1',
      name: 'Estudiante UpSpeak',
      avatar: '🦉',
      ageGroup: 'young_adults',
      currentLevel: 'A1',
      xp: 0,
      coins: 50,
      stars: 0,
      streakDays: 1,
      lastActivityDate: getTodayISO(),
      unlockedAvatars: ['🦉', '🚀', '🌟', '🎓'],
      unlockedThemes: ['light', 'dark'],
      createdAt: new Date().toISOString(),
      settings: {
        theme: 'system',
        dailyGoalMinutes: 15,
        soundEffects: true,
        voiceSpeed: 0.95,
        voiceAccent: 'en-US',
      },
    };
    await db.profiles.put(defaultProfile);
    activeProfile = defaultProfile;
  } else {
    const all = await db.profiles.toArray();
    activeProfile = all[0];
  }

  // Asegurar integridad de progreso de lecciones y misiones del perfil activo
  await initializeProfileProgress(activeProfile.id);

  // Control de versión de contenido académico para migraciones seguras sin duplicar registros
  const meta = await db.contentMetadata.get('academic_catalog');
  if (!meta || meta.version !== CONTENT_CATALOG_VERSION) {
    const allProfiles = await db.profiles.toArray();
    for (const p of allProfiles) {
      for (const lesson of ALL_LESSONS) {
        const recordId = `${p.id}_${lesson.id}`;
        const exists = await db.lessonProgress.get(recordId);
        if (!exists) {
          await db.lessonProgress.put({
            id: recordId,
            profileId: p.id,
            lessonId: lesson.id,
            levelId: lesson.level,
            unitId: lesson.unitId,
            status: lesson.order === 1 ? 'available' : 'locked',
            bestScore: 0,
            stars: 0,
            attempts: 0,
            completedAt: '',
          });
        }
      }
    }

    await db.contentMetadata.put({
      key: 'academic_catalog',
      version: CONTENT_CATALOG_VERSION,
      checksum: `lessons_${ALL_LESSONS.length}_ach_${ACHIEVEMENTS_CATALOG.length}`,
      updatedAt: new Date().toISOString(),
    });
  }

  return activeProfile;
}
