import { db } from '../db';
import { ALL_LESSONS, ACHIEVEMENTS_CATALOG } from '../../content/levels/catalog';
import { calculateStars, calculateUpdatedStreak, getTodayISO, sanitizeInput } from '../../utils';
import { calculateNextSRSReview, isDueForReview } from '../../features/progress/srs';
import { buildDefaultDailyMissions, initializeProfileProgress } from '../migrations/seeder';
import type {
  UserProfile,
  AgeGroup,
  CEFRLevelId,
  LessonProgressRecord,
  VocabularySRSRecord,
  VocabularyCategoryId,
  AchievementProgressRecord,
  DailyMissionRecord,
} from '../../types';

export const ProfileRepository = {
  async getAll(): Promise<UserProfile[]> {
    return db.profiles.toArray();
  },

  async getById(id: string): Promise<UserProfile | undefined> {
    return db.profiles.get(id);
  },

  async createProfile(params: {
    name: string;
    avatar: string;
    ageGroup: AgeGroup;
    initialLevel: CEFRLevelId;
    dailyGoalMinutes?: 10 | 15 | 20 | 30;
  }): Promise<UserProfile> {
    const cleanName = sanitizeInput(params.name, 40) || 'Estudiante';
    const newProfile: UserProfile = {
      id: `profile_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: cleanName,
      avatar: params.avatar || '🦉',
      ageGroup: params.ageGroup,
      currentLevel: params.initialLevel,
      xp: 0,
      coins: 50,
      stars: 0,
      streakDays: 1,
      lastActivityDate: getTodayISO(),
      unlockedAvatars: ['🦉', '🚀', '🌟', '🎓', params.avatar],
      unlockedThemes: ['light', 'dark'],
      createdAt: new Date().toISOString(),
      settings: {
        theme: 'system',
        dailyGoalMinutes: params.dailyGoalMinutes ?? 15,
        soundEffects: true,
        voiceSpeed: 0.95,
        voiceAccent: 'en-US',
      },
    };

    await db.profiles.put(newProfile);
    await initializeProfileProgress(newProfile.id);
    return newProfile;
  },

  async updateProfile(id: string, patch: Partial<UserProfile>): Promise<UserProfile | undefined> {
    const existing = await db.profiles.get(id);
    if (!existing) return undefined;
    const updated: UserProfile = {
      ...existing,
      ...patch,
      name: patch.name ? sanitizeInput(patch.name, 40) : existing.name,
    };
    await db.profiles.put(updated);
    return updated;
  },

  async deleteProfile(id: string): Promise<boolean> {
    const count = await db.profiles.count();
    if (count <= 1) return false; // Siempre mantener al menos un perfil local
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
        await db.profiles.delete(id);
        await db.lessonProgress.where('profileId').equals(id).delete();
        await db.vocabularyProgress.where('profileId').equals(id).delete();
        await db.exerciseHistory.where('profileId').equals(id).delete();
        await db.achievements.where('profileId').equals(id).delete();
        await db.dailyMissions.where('profileId').equals(id).delete();
      }
    );
    return true;
  },
};

export const LearningRepository = {
  async getLessonProgressMap(profileId: string): Promise<Record<string, LessonProgressRecord>> {
    const list = await db.lessonProgress.where('profileId').equals(profileId).toArray();
    const map: Record<string, LessonProgressRecord> = {};
    for (const item of list) {
      map[item.lessonId] = item;
    }
    return map;
  },

  async completeLesson(params: {
    profileId: string;
    lessonId: string;
    moduleType: string;
    scorePercent: number;
    xpEarned: number;
    coinsEarned: number;
    durationSeconds: number;
  }): Promise<{
    updatedProfile: UserProfile;
    unlockedAchievements: string[];
  }> {
    const profile = await db.profiles.get(params.profileId);
    if (!profile) throw new Error('Perfil no encontrado');

    const starsEarned = calculateStars(params.scorePercent);
    const today = getTodayISO();
    const newStreak = calculateUpdatedStreak(profile.lastActivityDate, profile.streakDays);

    // 1. Actualizar progreso de la lección si existe en el catálogo
    const lessonDef = ALL_LESSONS.find((l) => l.id === params.lessonId);
    let starDelta = 0;

    if (lessonDef) {
      const recId = `${params.profileId}_${params.lessonId}`;
      const existingRec = await db.lessonProgress.get(recId);
      const prevStars = existingRec?.stars ?? 0;
      const bestStars = Math.max(prevStars, starsEarned) as 0 | 1 | 2 | 3;
      starDelta = Math.max(0, bestStars - prevStars);

      await db.lessonProgress.put({
        id: recId,
        profileId: params.profileId,
        lessonId: params.lessonId,
        levelId: lessonDef.level,
        unitId: lessonDef.unitId,
        status: params.scorePercent >= 60 ? 'completed' : 'available',
        bestScore: Math.max(existingRec?.bestScore ?? 0, params.scorePercent),
        stars: bestStars,
        attempts: (existingRec?.attempts ?? 0) + 1,
        completedAt: new Date().toISOString(),
      });

      // Desbloquear la siguiente lección en el orden si obtuvo al menos 60%
      if (params.scorePercent >= 60) {
        const idx = ALL_LESSONS.findIndex((l) => l.id === params.lessonId);
        if (idx >= 0 && idx + 1 < ALL_LESSONS.length) {
          const nextLesson = ALL_LESSONS[idx + 1];
          const nextId = `${params.profileId}_${nextLesson.id}`;
          const nextRec = await db.lessonProgress.get(nextId);
          if (!nextRec || nextRec.status === 'locked') {
            await db.lessonProgress.put({
              id: nextId,
              profileId: params.profileId,
              lessonId: nextLesson.id,
              levelId: nextLesson.level,
              unitId: nextLesson.unitId,
              status: 'available',
              bestScore: nextRec?.bestScore ?? 0,
              stars: nextRec?.stars ?? 0,
              attempts: nextRec?.attempts ?? 0,
              completedAt: '',
            });
          }
        }
      }
    }

    // 2. Registrar en el historial de ejercicios
    await db.exerciseHistory.add({
      profileId: params.profileId,
      lessonId: params.lessonId,
      moduleType: params.moduleType,
      score: params.scorePercent,
      xpEarned: params.xpEarned,
      coinsEarned: params.coinsEarned,
      accuracy: params.scorePercent,
      durationSeconds: params.durationSeconds,
      completedAt: new Date().toISOString(),
    });

    // 3. Actualizar misiones diarias
    const missionId = `${params.profileId}_${today}`;
    let dailyRec = await db.dailyMissions.get(missionId);
    if (!dailyRec) {
      dailyRec = {
        id: missionId,
        profileId: params.profileId,
        date: today,
        missions: buildDefaultDailyMissions(),
      };
    }

    let missionBonusXp = 0;
    let missionBonusCoins = 0;

    dailyRec.missions = dailyRec.missions.map((m) => {
      if (m.completed) return m;
      let nextCurrent = m.current;
      if (m.type === 'xp') nextCurrent += params.xpEarned;
      if (m.type === 'lessons' && params.scorePercent >= 60) nextCurrent += 1;

      const nowCompleted = nextCurrent >= m.target;
      if (nowCompleted && !m.completed) {
        missionBonusXp += m.xpReward;
        missionBonusCoins += m.coinReward;
      }
      return {
        ...m,
        current: Math.min(m.target, nextCurrent),
        completed: nowCompleted,
      };
    });
    await db.dailyMissions.put(dailyRec);

    // 4. Evaluar logros desbloqueados
    const completedLessonsCount = await db.lessonProgress
      .where('profileId')
      .equals(params.profileId)
      .filter((r) => r.status === 'completed')
      .count();

    const vocabLearnedCount = await db.vocabularyProgress
      .where('profileId')
      .equals(params.profileId)
      .count();

    const totalXpAfter = profile.xp + params.xpEarned + missionBonusXp;
    const unlockedAchievements: string[] = [];

    for (const achDef of ACHIEVEMENTS_CATALOG) {
      const achRecId = `${params.profileId}_${achDef.id}`;
      const existingAch = await db.achievements.get(achRecId);
      let currentVal = 0;
      if (achDef.category === 'lessons') currentVal = completedLessonsCount;
      if (achDef.category === 'streak') currentVal = newStreak;
      if (achDef.category === 'xp') currentVal = totalXpAfter;
      if (achDef.category === 'vocabulary') currentVal = vocabLearnedCount;

      const shouldUnlock = currentVal >= achDef.targetValue;
      if (shouldUnlock && !existingAch?.unlocked) {
        unlockedAchievements.push(achDef.title);
        missionBonusXp += achDef.xpReward;
        missionBonusCoins += achDef.coinReward;
      }

      await db.achievements.put({
        id: achRecId,
        profileId: params.profileId,
        achievementId: achDef.id,
        progress: Math.min(achDef.targetValue, currentVal),
        unlocked: Boolean(existingAch?.unlocked || shouldUnlock),
        unlockedAt:
          existingAch?.unlockedAt || (shouldUnlock ? new Date().toISOString() : undefined),
      });
    }

    // 5. Determinar nivel MCER según XP acumulado
    const finalXp = profile.xp + params.xpEarned + missionBonusXp;
    let nextLevel: CEFRLevelId = profile.currentLevel;
    if (finalXp >= 5500) nextLevel = 'C2';
    else if (finalXp >= 3500 && nextLevel !== 'C2') nextLevel = 'C1';
    else if (finalXp >= 2000 && !['C1', 'C2'].includes(nextLevel)) nextLevel = 'B2';
    else if (finalXp >= 1000 && !['B2', 'C1', 'C2'].includes(nextLevel)) nextLevel = 'B1';
    else if (finalXp >= 400 && nextLevel === 'A1') nextLevel = 'A2';

    const updatedProfile: UserProfile = {
      ...profile,
      xp: finalXp,
      coins: profile.coins + params.coinsEarned + missionBonusCoins,
      stars: profile.stars + starDelta,
      streakDays: newStreak,
      lastActivityDate: today,
      currentLevel: nextLevel,
    };

    await db.profiles.put(updatedProfile);
    return { updatedProfile, unlockedAchievements };
  },

  async recordVocabularyReview(params: {
    profileId: string;
    wordId: string;
    category: VocabularyCategoryId;
    quality: 0 | 1 | 2 | 3 | 4 | 5;
    toggleFavorite?: boolean;
  }): Promise<VocabularySRSRecord> {
    const recId = `${params.profileId}_${params.wordId}`;
    const existing = await db.vocabularyProgress.get(recId);
    const updated = calculateNextSRSReview(
      existing,
      params.profileId,
      params.wordId,
      params.category,
      params.quality
    );

    if (params.toggleFavorite !== undefined) {
      updated.isFavorite = params.toggleFavorite;
    }

    await db.vocabularyProgress.put(updated);

    // Actualizar misión diaria de palabras
    const today = getTodayISO();
    const missionId = `${params.profileId}_${today}`;
    const dailyRec = await db.dailyMissions.get(missionId);
    if (dailyRec) {
      dailyRec.missions = dailyRec.missions.map((m) => {
        if (m.type === 'words' && !m.completed) {
          const next = m.current + 1;
          return {
            ...m,
            current: Math.min(m.target, next),
            completed: next >= m.target,
          };
        }
        return m;
      });
      await db.dailyMissions.put(dailyRec);
    }

    return updated;
  },

  async getVocabularyMap(profileId: string): Promise<Record<string, VocabularySRSRecord>> {
    const records = await db.vocabularyProgress.where('profileId').equals(profileId).toArray();
    const map: Record<string, VocabularySRSRecord> = {};
    for (const r of records) {
      map[r.wordId] = r;
    }
    return map;
  },

  async getDueVocabularyRecords(profileId: string): Promise<VocabularySRSRecord[]> {
    const records = await db.vocabularyProgress.where('profileId').equals(profileId).toArray();
    return records.filter((r) => isDueForReview(r));
  },

  async getAchievements(profileId: string): Promise<AchievementProgressRecord[]> {
    return db.achievements.where('profileId').equals(profileId).toArray();
  },

  async getTodayMissions(profileId: string): Promise<DailyMissionRecord> {
    const today = getTodayISO();
    const id = `${profileId}_${today}`;
    const existing = await db.dailyMissions.get(id);
    if (existing) return existing;
    const fresh: DailyMissionRecord = {
      id,
      profileId,
      date: today,
      missions: buildDefaultDailyMissions(),
    };
    await db.dailyMissions.put(fresh);
    return fresh;
  },
};
