/**
 * UpSpeak - Tipos e Interfaces Centrales del Dominio
 * Learn English, Level Up!
 */

export type CEFRLevelId = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export type AgeGroup = 'kids' | 'teens' | 'young_adults' | 'adults';

export type VocabularyCategoryId =
  | 'alphabet'
  | 'numbers'
  | 'colors'
  | 'animals'
  | 'family'
  | 'food'
  | 'professions'
  | 'places'
  | 'objects'
  | 'body_parts'
  | 'transport'
  | 'clothing'
  | 'weather'
  | 'technology'
  | 'business'
  | 'professional';

export type GrammarCategoryId =
  | 'pronouns'
  | 'articles'
  | 'nouns'
  | 'adjectives'
  | 'adverbs'
  | 'prepositions'
  | 'conjunctions'
  | 'structures';

export type VerbTypeId =
  | 'basic'
  | 'regular'
  | 'irregular'
  | 'auxiliary'
  | 'modal'
  | 'phrasal';

export type VerbTenseId =
  | 'present_simple'
  | 'present_continuous'
  | 'present_perfect'
  | 'present_perfect_continuous'
  | 'past_simple'
  | 'past_continuous'
  | 'past_perfect'
  | 'past_perfect_continuous'
  | 'future_simple'
  | 'future_continuous'
  | 'future_perfect'
  | 'future_perfect_continuous';

export type SkillType =
  | 'listening'
  | 'speaking'
  | 'reading'
  | 'writing'
  | 'conversation';

export type ExerciseType =
  | 'multiple_choice'
  | 'fill_in_blank'
  | 'word_matching'
  | 'sentence_ordering'
  | 'image_identification'
  | 'listen_and_respond'
  | 'translation'
  | 'writing_prompt'
  | 'error_identification'
  | 'dialogue_builder';

export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  dailyGoalMinutes: 10 | 15 | 20 | 30;
  soundEffects: boolean;
  voiceSpeed: number; // 0.75 a 1.25
  voiceAccent: 'en-US' | 'en-GB';
}

export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  ageGroup: AgeGroup;
  currentLevel: CEFRLevelId;
  xp: number;
  coins: number;
  stars: number;
  streakDays: number;
  lastActivityDate: string; // YYYY-MM-DD
  unlockedAvatars: string[];
  unlockedThemes: string[];
  createdAt: string;
  settings: UserSettings;
}

export interface VocabularyItem {
  id: string;
  english: string;
  spanish: string;
  pronunciation: string; // IPA
  category: VocabularyCategoryId;
  level: CEFRLevelId;
  imageEmoji: string;
  imageSvg?: string;
  audioText: string;
  exampleEn: string;
  exampleEs: string;
  notes?: string;
}

export interface GrammarRule {
  id: string;
  category: GrammarCategoryId;
  level: CEFRLevelId;
  title: string;
  summary: string;
  explanation: string;
  formula?: string;
  examples: Array<{
    english: string;
    spanish: string;
    highlight?: string;
  }>;
  commonMistakes: Array<{
    incorrect: string;
    correct: string;
    reason: string;
  }>;
}

export interface VerbEntry {
  id: string;
  infinitive: string;
  thirdPerson: string;
  pastSimple: string;
  pastParticiple: string;
  gerund: string;
  spanish: string;
  pronunciation: string;
  type: VerbTypeId;
  level: CEFRLevelId;
  exampleEn: string;
  exampleEs: string;
}

export interface VerbTenseEntry {
  id: VerbTenseId;
  nameEn: string;
  nameEs: string;
  level: CEFRLevelId;
  category: 'present' | 'past' | 'future';
  usage: string[];
  affirmativeFormula: string;
  negativeFormula: string;
  interrogativeFormula: string;
  signalWords: string[];
  examples: Array<{
    type: 'affirmative' | 'negative' | 'interrogative';
    english: string;
    spanish: string;
  }>;
}

export interface ExercisePair {
  id: string;
  left: string;
  right: string;
}

export interface DialogueTurn {
  speaker: string;
  avatar: string;
  textEn: string;
  textEs: string;
  isUserTurn?: boolean;
  options?: string[];
  correctOption?: string;
}

export interface ExerciseItem {
  id: string;
  type: ExerciseType;
  level: CEFRLevelId;
  module: 'vocabulary' | 'grammar' | 'verbs' | 'tenses' | SkillType | 'evaluation';
  lessonId?: string;
  promptEs: string;
  promptEn?: string;
  audioText?: string;
  imageEmoji?: string;
  options?: string[];
  correctAnswer: string;
  acceptedAnswers?: string[];
  wordsPool?: string[];
  pairs?: ExercisePair[];
  dialogueTurns?: DialogueTurn[];
  explanationEs: string;
  points: number;
  hint?: string;
}

export interface LessonItem {
  id: string;
  unitId: string;
  level: CEFRLevelId;
  order: number;
  title: string;
  subtitle: string;
  moduleType: 'vocabulary' | 'grammar' | 'verbs' | 'tenses' | SkillType | 'evaluation';
  objectives: string[];
  estimatedMinutes: number;
  xpReward: number;
  coinReward: number;
  theorySummary: string;
  keyPoints: Array<{
    term: string;
    translation: string;
    detail: string;
  }>;
  exerciseIds: string[];
}

export interface UnitItem {
  id: string;
  level: CEFRLevelId;
  order: number;
  title: string;
  description: string;
  icon: string;
  objectives: string[];
  lessons: LessonItem[];
}

export interface CEFRLevelData {
  id: CEFRLevelId;
  nameEs: string;
  nameEn: string;
  description: string;
  color: string;
  badgeIcon: string;
  requiredXp: number;
  objectives: string[];
  units: UnitItem[];
}

export interface SkillActivity {
  id: string;
  skill: SkillType;
  level: CEFRLevelId;
  title: string;
  description: string;
  contentEn: string;
  contentEs: string;
  vocabularyHints: Array<{ word: string; meaning: string }>;
  exercises: ExerciseItem[];
}

export interface LessonProgressRecord {
  id?: string; // `${profileId}_${lessonId}`
  profileId: string;
  lessonId: string;
  levelId: CEFRLevelId;
  unitId: string;
  status: 'locked' | 'available' | 'completed';
  bestScore: number; // 0-100
  stars: 0 | 1 | 2 | 3;
  attempts: number;
  completedAt: string;
}

export interface VocabularySRSRecord {
  id?: string; // `${profileId}_${wordId}`
  profileId: string;
  wordId: string;
  category: VocabularyCategoryId;
  isFavorite: boolean;
  masteryLevel: 0 | 1 | 2 | 3 | 4 | 5;
  nextReviewDate: string; // ISO string
  interval: number; // días
  easeFactor: number; // factor SM-2 (ej. 2.5)
  repetitions: number;
  lastReviewedAt: string;
}

export interface ExerciseHistoryRecord {
  id?: number;
  profileId: string;
  lessonId: string;
  moduleType: string;
  score: number;
  xpEarned: number;
  coinsEarned: number;
  accuracy: number;
  durationSeconds: number;
  completedAt: string;
}

export interface AchievementDefinition {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'streak' | 'xp' | 'vocabulary' | 'lessons' | 'mastery';
  targetValue: number;
  xpReward: number;
  coinReward: number;
}

export interface AchievementProgressRecord {
  id?: string; // `${profileId}_${achievementId}`
  profileId: string;
  achievementId: string;
  progress: number;
  unlocked: boolean;
  unlockedAt?: string;
}

export interface DailyMissionItem {
  id: string;
  title: string;
  target: number;
  current: number;
  xpReward: number;
  coinReward: number;
  completed: boolean;
  type: 'xp' | 'lessons' | 'words' | 'perfect_score';
}

export interface DailyMissionRecord {
  id?: string; // `${profileId}_${date}`
  profileId: string;
  date: string; // YYYY-MM-DD
  missions: DailyMissionItem[];
}

export interface ContentMetadataRecord {
  key: string;
  version: string;
  checksum: string;
  updatedAt: string;
}

export interface BackupPayload {
  app: 'UpSpeak';
  schemaVersion: number;
  contentVersion: string;
  exportedAt: string;
  data: {
    profiles: UserProfile[];
    lessonProgress: LessonProgressRecord[];
    vocabularyProgress: VocabularySRSRecord[];
    exerciseHistory: ExerciseHistoryRecord[];
    achievements: AchievementProgressRecord[];
    dailyMissions: DailyMissionRecord[];
  };
}
