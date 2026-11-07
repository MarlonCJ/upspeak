export const DB_NAME = 'UpSpeakDatabase';
export const DB_SCHEMA_VERSION = 1;
export const CONTENT_CATALOG_VERSION = '1.0.0-mcer-2026';

export const TABLE_SCHEMAS = {
  profiles: 'id, name, currentLevel, xp, streakDays, createdAt',
  lessonProgress: 'id, profileId, lessonId, levelId, unitId, status, [profileId+lessonId]',
  vocabularyProgress: 'id, profileId, wordId, category, isFavorite, masteryLevel, nextReviewDate, [profileId+wordId]',
  exerciseHistory: '++id, profileId, lessonId, moduleType, completedAt',
  achievements: 'id, profileId, achievementId, unlocked, [profileId+achievementId]',
  dailyMissions: 'id, profileId, date, [profileId+date]',
  contentMetadata: 'key, version, updatedAt',
};
