import Dexie, { type Table } from 'dexie';
import type {
  UserProfile,
  LessonProgressRecord,
  VocabularySRSRecord,
  ExerciseHistoryRecord,
  AchievementProgressRecord,
  DailyMissionRecord,
  ContentMetadataRecord,
} from '../types';
import { DB_NAME, DB_SCHEMA_VERSION, TABLE_SCHEMAS } from './schema';

export class UpSpeakDatabase extends Dexie {
  profiles!: Table<UserProfile, string>;
  lessonProgress!: Table<LessonProgressRecord, string>;
  vocabularyProgress!: Table<VocabularySRSRecord, string>;
  exerciseHistory!: Table<ExerciseHistoryRecord, number>;
  achievements!: Table<AchievementProgressRecord, string>;
  dailyMissions!: Table<DailyMissionRecord, string>;
  contentMetadata!: Table<ContentMetadataRecord, string>;

  constructor() {
    super(DB_NAME);
    this.version(DB_SCHEMA_VERSION).stores(TABLE_SCHEMAS);
  }
}

export const db = new UpSpeakDatabase();
