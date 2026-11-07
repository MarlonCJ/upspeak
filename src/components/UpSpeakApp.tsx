import React, { useEffect, useState, useMemo } from 'react';
import {
  BookOpen,
  GraduationCap,
  Trophy,
  Flame,
  Coins,
  Star,
  Volume2,
  Mic,
  CheckCircle2,
  XCircle,
  Sparkles,
  User,
  Download,
  Upload,
  Moon,
  Sun,
  Search,
  Heart,
  Play,
  RotateCcw,
  Layers,
  Award,
} from 'lucide-react';
import { ensureDatabaseSeeded } from '../database/migrations/seeder';
import { ProfileRepository, LearningRepository } from '../database/repositories';
import { VOCABULARY_CATEGORIES, VOCABULARY_ITEMS } from '../content/vocabulary/catalog';
import { GRAMMAR_CATEGORIES, GRAMMAR_RULES } from '../content/grammar/catalog';
import { VERB_TYPE_LABELS, VERBS_CATALOG, VERB_TENSES_CATALOG } from '../content/verbs/catalog';
import { EXERCISES_CATALOG, SKILLS_ACTIVITIES } from '../content/exercises/catalog';
import { CEFR_LEVELS_CATALOG, ALL_LESSONS, ACHIEVEMENTS_CATALOG } from '../content/levels/catalog';
import { createBackupJSON, validateBackupJSON, restoreFromBackupPayload } from '../services/backupService';
import { speakEnglish, listenEnglishPronunciation, playSoundEffect } from '../services/speechService';
import { normalizeEnglishAnswer, CEFR_LEVEL_META } from '../utils';
import { MascotSpeaky } from './gamification/MascotSpeaky';
import { AudioButton } from './common/AudioButton';
import type {
  UserProfile,
  LessonProgressRecord,
  VocabularySRSRecord,
  AchievementProgressRecord,
  DailyMissionItem,
  CEFRLevelId,
  VocabularyCategoryId,
  ExerciseItem,
  LessonItem,
} from '../types';

type TabId = 'dashboard' | 'levels' | 'vocabulary' | 'grammar' | 'practice' | 'profile';

export const UpSpeakApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [lessonMap, setLessonMap] = useState<Record<string, LessonProgressRecord>>({});
  const [vocabMap, setVocabMap] = useState<Record<string, VocabularySRSRecord>>({});
  const [achievements, setAchievements] = useState<AchievementProgressRecord[]>([]);
  const [missions, setMissions] = useState<DailyMissionItem[]>([]);
  const [darkMode, setDarkMode] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Filtros de módulos
  const [selectedLevel, setSelectedLevel] = useState<CEFRLevelId>('A1');
  const [selectedVocabCat, setSelectedVocabCat] = useState<VocabularyCategoryId | 'all' | 'favorites'>('all');
  const [vocabSearch, setVocabSearch] = useState('');
  const [grammarSubTab, setGrammarSubTab] = useState<'rules' | 'verbs' | 'tenses' | 'skills'>('rules');

  // Estado del Motor de Ejercicios / Lección activa
  const [activeLesson, setActiveLesson] = useState<LessonItem | null>(null);
  const [exerciseQueue, setExerciseQueue] = useState<ExerciseItem[]>([]);
  const [currentExIdx, setCurrentExIdx] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [orderedWords, setOrderedWords] = useState<string[]>([]);
  const [matchedPairs, setMatchedPairs] = useState<Record<string, string>>({});
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ correct: boolean; message: string } | null>(null);
  const [sessionScore, setSessionScore] = useState(0);
  const [sessionDone, setSessionDone] = useState(false);
  const [speechStatus, setSpeechStatus] = useState<string | null>(null);

  // Estado de Perfiles y Respaldos
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileAvatar, setNewProfileAvatar] = useState('🦉');
  const [backupMessage, setBackupMessage] = useState<string | null>(null);

  const loadData = async (targetProfileId?: string) => {
    const seeded = await ensureDatabaseSeeded();
    const allProfiles = await ProfileRepository.getAll();
    const current =
      (targetProfileId ? allProfiles.find((p) => p.id === targetProfileId) : undefined) ||
      allProfiles[0] ||
      seeded;

    const [lMap, vMap, achList, dailyRec] = await Promise.all([
      LearningRepository.getLessonProgressMap(current.id),
      LearningRepository.getVocabularyMap(current.id),
      LearningRepository.getAchievements(current.id),
      LearningRepository.getTodayMissions(current.id),
    ]);

    setProfiles(allProfiles);
    setProfile(current);
    setSelectedLevel(current.currentLevel);
    setLessonMap(lMap);
    setVocabMap(vMap);
    setAchievements(achList);
    setMissions(dailyRec.missions);
  };

  useEffect(() => {
    loadData();
    setDarkMode(document.documentElement.classList.contains('dark'));
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const toggleTheme = () => {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('upspeak_theme', next ? 'dark' : 'light');
  };

  // Iniciar una lección o sesión de práctica
  const startLesson = (lesson: LessonItem) => {
    const exList = EXERCISES_CATALOG.filter((e) => lesson.exerciseIds.includes(e.id));
    setActiveLesson(lesson);
    setExerciseQueue(exList.length > 0 ? exList : EXERCISES_CATALOG.slice(0, 3));
    setCurrentExIdx(0);
    resetExerciseInputs();
    setSessionScore(0);
    setSessionDone(false);
    setActiveTab('practice');
  };

  const startFreePractice = (filterLevel?: CEFRLevelId) => {
    const pool = filterLevel
      ? EXERCISES_CATALOG.filter((e) => e.level === filterLevel)
      : EXERCISES_CATALOG;
    setActiveLesson(null);
    setExerciseQueue(pool.length > 0 ? pool : EXERCISES_CATALOG);
    setCurrentExIdx(0);
    resetExerciseInputs();
    setSessionScore(0);
    setSessionDone(false);
    setActiveTab('practice');
  };

  const resetExerciseInputs = () => {
    setUserAnswer('');
    setOrderedWords([]);
    setMatchedPairs({});
    setSelectedLeft(null);
    setFeedback(null);
    setSpeechStatus(null);
  };

  const currentExercise = exerciseQueue[currentExIdx];

  const validateCurrentExercise = () => {
    if (!currentExercise || feedback) return;
    let isCorrect = false;

    if (currentExercise.type === 'word_matching' && currentExercise.pairs) {
      isCorrect = currentExercise.pairs.every((p) => matchedPairs[p.left] === p.right);
    } else if (currentExercise.type === 'sentence_ordering') {
      const built = orderedWords.join(' ');
      isCorrect =
        normalizeEnglishAnswer(built) === normalizeEnglishAnswer(currentExercise.correctAnswer);
    } else if (currentExercise.type === 'dialogue_builder' && currentExercise.dialogueTurns) {
      const userTurn = currentExercise.dialogueTurns.find((t) => t.isUserTurn);
      isCorrect = userAnswer === (userTurn?.correctOption || currentExercise.correctAnswer);
    } else {
      const candidates = [
        currentExercise.correctAnswer,
        ...(currentExercise.acceptedAnswers || []),
      ];
      isCorrect = candidates.some(
        (ans) => normalizeEnglishAnswer(ans) === normalizeEnglishAnswer(userAnswer)
      );
    }

    if (isCorrect) {
      playSoundEffect('correct');
      setSessionScore((s) => s + 1);
      setFeedback({
        correct: true,
        message: `¡Correcto! (+${currentExercise.points} XP) — ${currentExercise.explanationEs}`,
      });
    } else {
      playSoundEffect('wrong');
      setFeedback({
        correct: false,
        message: `Respuesta esperada: "${currentExercise.correctAnswer}". ${currentExercise.explanationEs}`,
      });
    }
  };

  const nextExerciseStep = async () => {
    if (currentExIdx + 1 < exerciseQueue.length) {
      setCurrentExIdx((i) => i + 1);
      resetExerciseInputs();
    } else {
      // Finalizar sesión y guardar en IndexedDB
      playSoundEffect('levelup');
      setSessionDone(true);
      if (profile) {
        const total = Math.max(1, exerciseQueue.length);
        const pct = Math.round((sessionScore / total) * 100);
        const xpEarned = activeLesson ? activeLesson.xpReward : sessionScore * 15 + 10;
        const coinsEarned = activeLesson ? activeLesson.coinReward : sessionScore * 5 + 5;

        const { unlockedAchievements } = await LearningRepository.completeLesson({
          profileId: profile.id,
          lessonId: activeLesson?.id || `practice_${Date.now()}`,
          moduleType: activeLesson?.moduleType || 'practice',
          scorePercent: pct,
          xpEarned,
          coinsEarned,
          durationSeconds: 120,
        });

        await loadData(profile.id);
        if (unlockedAchievements.length > 0) {
          showToast(`🏆 ¡Logro desbloqueado: ${unlockedAchievements.join(', ')}!`);
        } else {
          showToast(`🎉 ¡Sesión completada! Ganaste +${xpEarned} XP y +${coinsEarned} monedas.`);
        }
      }
    }
  };

  // Vocabulario filtrado y SRS
  const filteredVocabulary = useMemo(() => {
    return VOCABULARY_ITEMS.filter((item) => {
      if (selectedVocabCat === 'favorites' && !vocabMap[item.id]?.isFavorite) return false;
      if (selectedVocabCat !== 'all' && selectedVocabCat !== 'favorites' && item.category !== selectedVocabCat) {
        return false;
      }
      if (vocabSearch.trim()) {
        const q = vocabSearch.toLowerCase();
        return (
          item.english.toLowerCase().includes(q) ||
          item.spanish.toLowerCase().includes(q) ||
          item.exampleEn.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [selectedVocabCat, vocabSearch, vocabMap]);

  const handleVocabAction = async (word: (typeof VOCABULARY_ITEMS)[0], quality: 2 | 5, toggleFav = false) => {
    if (!profile) return;
    const currentFav = vocabMap[word.id]?.isFavorite ?? false;
    await LearningRepository.recordVocabularyReview({
      profileId: profile.id,
      wordId: word.id,
      category: word.category,
      quality,
      toggleFavorite: toggleFav ? !currentFav : currentFav,
    });
    await ProfileRepository.updateProfile(profile.id, {
      xp: profile.xp + 5,
      coins: profile.coins + 2,
    });
    await loadData(profile.id);
    if (!toggleFav) {
      playSoundEffect('correct');
      showToast(`✨ "${word.english}" programada en tu Repaso Inteligente (+5 XP)`);
    }
  };

  const handleExportBackup = async () => {
    const json = await createBackupJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `upspeak-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setBackupMessage('✅ Respaldo JSON exportado correctamente.');
  };

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const validation = validateBackupJSON(text);
    if (!validation.valid || !validation.payload) {
      setBackupMessage(`❌ Error: ${validation.error}`);
      return;
    }
    const confirmed = window.confirm(
      `¿Restaurar respaldo con ${validation.summary?.profilesCount} perfil(es) y ${validation.summary?.lessonsCount} registros de progreso? Esto reemplazará los datos actuales.`
    );
    if (!confirmed) return;
    await restoreFromBackupPayload(validation.payload);
    await loadData();
    setBackupMessage('✅ Datos restaurados exitosamente desde el respaldo JSON.');
  };

  const recommendedLesson = useMemo(() => {
    return (
      ALL_LESSONS.find((l) => lessonMap[l.id]?.status === 'available') ||
      ALL_LESSONS[0]
    );
  }, [lessonMap]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* BARRA SUPERIOR DE NAVEGACIÓN Y GAMIFICACIÓN */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          {/* Logo e Identidad */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center gap-2.5 text-left group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-emerald-500 flex items-center justify-center text-white font-black text-xl shadow-sm group-hover:scale-105 transition">
                U
              </div>
              <div>
                <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 to-emerald-500 bg-clip-text text-transparent">
                  UpSpeak
                </span>
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  Learn English, Level Up!
                </p>
              </div>
            </button>
          </div>

          {/* Navegación Central */}
          <nav className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl overflow-x-auto">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: Sparkles },
              { id: 'levels', label: 'Niveles A1-C2', icon: GraduationCap },
              { id: 'vocabulary', label: 'Vocabulario', icon: BookOpen },
              { id: 'grammar', label: 'Gramática y Verbos', icon: Layers },
              { id: 'practice', label: 'Práctica', icon: Play },
              { id: 'profile', label: 'Perfil y Respaldo', icon: User },
            ].map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    if (item.id === 'practice' && exerciseQueue.length === 0) {
                      startFreePractice();
                    } else {
                      setActiveTab(item.id as TabId);
                    }
                  }}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-bold transition whitespace-nowrap ${
                    active
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:text-indigo-600'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Indicadores de Gamificación y Tema */}
          <div className="flex items-center gap-2 sm:gap-3">
            {profile && (
              <>
                <div
                  title="Racha de días seguidos"
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 text-xs font-extrabold"
                >
                  <Flame className="w-4 h-4 fill-current" />
                  <span>{profile.streakDays}d</span>
                </div>
                <div
                  title="Puntos de Experiencia (XP)"
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-extrabold"
                >
                  <Trophy className="w-4 h-4" />
                  <span>{profile.xp} XP</span>
                </div>
                <div
                  title="Monedas acumuladas"
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-extrabold"
                >
                  <Coins className="w-4 h-4" />
                  <span>{profile.coins}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('profile')}
                  className="flex items-center gap-1.5 pl-2 pr-3 py-1 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-500 text-xs font-bold"
                >
                  <span className="text-lg">{profile.avatar}</span>
                  <span className="hidden md:inline">{profile.name}</span>
                  <span className="px-1.5 py-0.5 rounded bg-indigo-600 text-white text-[10px]">
                    {profile.currentLevel}
                  </span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Cambiar modo claro u oscuro"
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* TOAST DE RECOMPENSAS */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 bg-indigo-600 text-white px-4 py-3 rounded-2xl shadow-xl font-bold text-sm flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4" />
          <span>{toast}</span>
        </div>
      )}

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 space-y-6">
        {/* 1. DASHBOARD */}
        {activeTab === 'dashboard' && profile && (
          <div className="space-y-6">
            {/* Hero con saludo personalizado y mascota Speaky */}
            <div className="card-upspeak p-6 bg-gradient-to-r from-indigo-600/10 via-emerald-500/5 to-transparent flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 text-xs font-extrabold">
                  <span>Nivel MCER Actual: {profile.currentLevel}</span>
                  <span>•</span>
                  <span>{CEFR_LEVEL_META[profile.currentLevel].nameEs}</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                  ¡Hola, {profile.name}! {profile.avatar}
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-300 max-w-xl">
                  Continúa tu ruta desde <strong>A1 hasta C2</strong>. Tu progreso se guarda automáticamente en este dispositivo mediante IndexedDB.
                </p>
                <div className="pt-2 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => startLesson(recommendedLesson)}
                    className="btn-primary text-sm"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Continuar Lección: {recommendedLesson.title}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => startFreePractice()}
                    className="btn-secondary text-sm"
                  >
                    <span>Práctica Rápida Mixta</span>
                  </button>
                </div>
              </div>

              <MascotSpeaky
                mood="happy"
                size="md"
                message="¡Cada día que practicas desbloqueas nuevas oportunidades!"
                englishTip="Consistency is the key to fluency."
              />
            </div>

            {/* Tarjetas de Estadísticas Rápidas */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="card-upspeak p-4 flex items-center gap-3.5">
                <div className="p-3 rounded-2xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
                  <Trophy className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-semibold">Experiencia Total</p>
                  <p className="text-xl font-black">{profile.xp} XP</p>
                </div>
              </div>

              <div className="card-upspeak p-4 flex items-center gap-3.5">
                <div className="p-3 rounded-2xl bg-orange-500/15 text-orange-600 dark:text-orange-400">
                  <Flame className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-semibold">Racha Activa</p>
                  <p className="text-xl font-black">{profile.streakDays} días</p>
                </div>
              </div>

              <div className="card-upspeak p-4 flex items-center gap-3.5">
                <div className="p-3 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-semibold">Palabras Practicadas</p>
                  <p className="text-xl font-black">
                    {Object.keys(vocabMap).length} / {VOCABULARY_ITEMS.length}
                  </p>
                </div>
              </div>

              <div className="card-upspeak p-4 flex items-center gap-3.5">
                <div className="p-3 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
                  <Star className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-semibold">Estrellas y Monedas</p>
                  <p className="text-xl font-black">
                    {profile.stars} ⭐ • {profile.coins} 🪙
                  </p>
                </div>
              </div>
            </div>

            {/* Misiones Diarias y Acceso a Módulos */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Misiones Diarias */}
              <div className="card-upspeak p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-extrabold flex items-center gap-2">
                    <Award className="w-5 h-5 text-indigo-500" />
                    <span>Misiones Diarias</span>
                  </h2>
                  <span className="text-xs font-bold text-slate-500">Meta: {profile.settings.dailyGoalMinutes} min</span>
                </div>
                <div className="space-y-3">
                  {missions.map((m) => {
                    const pct = Math.min(100, Math.round((m.current / m.target) * 100));
                    return (
                      <div
                        key={m.id}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 space-y-2"
                      >
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className={m.completed ? 'line-through text-emerald-600' : ''}>
                            {m.title}
                          </span>
                          <span className="text-indigo-600 dark:text-indigo-400">
                            +{m.xpReward} XP
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Acceso Rápido a Módulos Educativos */}
              <div className="lg:col-span-2 card-upspeak p-5 space-y-4">
                <h2 className="text-lg font-extrabold">Módulos de Aprendizaje UpSpeak</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab('levels')}
                    className="card-interactive p-4 text-left flex items-start gap-3"
                  >
                    <span className="text-2xl">🎓</span>
                    <div>
                      <h3 className="font-extrabold text-sm">Ruta Académica MCER (A1–C2)</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Unidades progresivas, lecciones teóricas y evaluaciones.
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('vocabulary')}
                    className="card-interactive p-4 text-left flex items-start gap-3"
                  >
                    <span className="text-2xl">📚</span>
                    <div>
                      <h3 className="font-extrabold text-sm">16 Categorías de Vocabulario + SRS</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Audio nativo, fonética IPA, favoritos y repetición espaciada.
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setGrammarSubTab('tenses');
                      setActiveTab('grammar');
                    }}
                    className="card-interactive p-4 text-left flex items-start gap-3"
                  >
                    <span className="text-2xl">⏳</span>
                    <div>
                      <h3 className="font-extrabold text-sm">Gramática, Verbos y 12 Tiempos</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Fórmulas afirmativas, negativas, preguntas y errores comunes.
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setGrammarSubTab('skills');
                      setActiveTab('grammar');
                    }}
                    className="card-interactive p-4 text-left flex items-start gap-3"
                  >
                    <span className="text-2xl">🎙️</span>
                    <div>
                      <h3 className="font-extrabold text-sm">Listening, Speaking, Reading & Writing</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Comprensión auditiva, pronunciación por voz y conversaciones.
                      </p>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Logros e Insignias */}
            <div className="card-upspeak p-5 space-y-4">
              <h2 className="text-lg font-extrabold">Logros e Insignias</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {ACHIEVEMENTS_CATALOG.map((ach) => {
                  const rec = achievements.find((a) => a.achievementId === ach.id);
                  const unlocked = rec?.unlocked ?? false;
                  return (
                    <div
                      key={ach.id}
                      className={`p-3.5 rounded-2xl border text-center space-y-1 transition ${
                        unlocked
                          ? 'bg-amber-500/10 border-amber-500/40'
                          : 'bg-slate-100/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-75'
                      }`}
                    >
                      <div className="text-3xl">{ach.icon}</div>
                      <h3 className="font-extrabold text-xs">{ach.title}</h3>
                      <p className="text-[11px] text-slate-500">{ach.description}</p>
                      <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
                        {unlocked ? '¡Desbloqueado!' : `Progreso: ${rec?.progress ?? 0}/${ach.targetValue}`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 2. ESTRUCTURA ACADÉMICA MCER A1 - C2 */}
        {activeTab === 'levels' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black">Currículo Académico MCER (A1 a C2)</h1>
                <p className="text-sm text-slate-500">
                  Selecciona un nivel para estudiar su teoría, puntos clave y completar sus lecciones interactivas.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {CEFR_LEVELS_CATALOG.map((lvl) => (
                  <button
                    key={lvl.id}
                    type="button"
                    onClick={() => setSelectedLevel(lvl.id)}
                    className={`px-3.5 py-2 rounded-xl font-extrabold text-xs transition ${
                      selectedLevel === lvl.id
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500'
                    }`}
                  >
                    {lvl.badgeIcon} {lvl.id} — {lvl.nameEs.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            {CEFR_LEVELS_CATALOG.filter((l) => l.id === selectedLevel).map((levelData) => (
              <div key={levelData.id} className="space-y-5">
                <div className="card-upspeak p-5 border-l-4 border-l-indigo-600 space-y-2">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-black">
                      {levelData.badgeIcon} {levelData.nameEs} ({levelData.nameEn})
                    </h2>
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      XP sugerido: {levelData.requiredXp} XP
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300">{levelData.description}</p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {levelData.objectives.map((obj, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 font-medium"
                      >
                        ✓ {obj}
                      </span>
                    ))}
                  </div>
                </div>

                {levelData.units.map((unit) => (
                  <div key={unit.id} className="space-y-4">
                    <h3 className="text-lg font-extrabold flex items-center gap-2">
                      <span>{unit.icon}</span>
                      <span>{unit.title}</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {unit.lessons.map((lesson) => {
                        const prog = lessonMap[lesson.id];
                        const isCompleted = prog?.status === 'completed';
                        return (
                          <div key={lesson.id} className="card-upspeak p-5 flex flex-col justify-between gap-4">
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 uppercase">
                                  {lesson.moduleType} • {lesson.estimatedMinutes} min
                                </span>
                                <span className="text-xs font-bold text-amber-500">
                                  {isCompleted ? `✅ Completada (${prog.bestScore}%)` : `+${lesson.xpReward} XP`}
                                </span>
                              </div>
                              <h4 className="text-lg font-extrabold">{lesson.title}</h4>
                              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                                {lesson.theorySummary}
                              </p>
                              <div className="space-y-1.5 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl">
                                {lesson.keyPoints.map((kp, i) => (
                                  <div key={i} className="flex items-center justify-between text-xs gap-2">
                                    <div>
                                      <strong className="text-indigo-600 dark:text-indigo-400">{kp.term}</strong>:{' '}
                                      <span>{kp.translation}</span>
                                    </div>
                                    <AudioButton text={kp.term} size="sm" />
                                  </div>
                                ))}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => startLesson(lesson)}
                              className="btn-primary w-full text-sm"
                            >
                              <Play className="w-4 h-4 fill-current" />
                              <span>{isCompleted ? 'Repasar Lección y Ejercicios' : 'Iniciar Lección Interactiva'}</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* 3. VOCABULARIO (16 CATEGORÍAS) + DICCIONARIO Y REPASO ESPACIADO (SRS) */}
        {activeTab === 'vocabulary' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black">Vocabulario y Diccionario Personal SRS</h1>
                <p className="text-sm text-slate-500">
                  Explora las 16 categorías con pronunciación nativa, fonética IPA y repetición espaciada.
                </p>
              </div>
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="search"
                  value={vocabSearch}
                  onChange={(e) => setVocabSearch(e.target.value)}
                  placeholder="Buscar palabra en inglés o español..."
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Selector de las 16 Categorías */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              <button
                type="button"
                onClick={() => setSelectedVocabCat('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 ${
                  selectedVocabCat === 'all'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800'
                }`}
              >
                🌐 Todas ({VOCABULARY_ITEMS.length})
              </button>
              <button
                type="button"
                onClick={() => setSelectedVocabCat('favorites')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 ${
                  selectedVocabCat === 'favorites'
                    ? 'bg-rose-600 text-white'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800'
                }`}
              >
                ❤️ Favoritas
              </button>
              {VOCABULARY_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedVocabCat(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 ${
                    selectedVocabCat === cat.id
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800'
                  }`}
                >
                  {cat.icon} {cat.nameEs}
                </button>
              ))}
            </div>

            {/* Tarjetas de Vocabulario */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredVocabulary.map((word) => {
                const srs = vocabMap[word.id];
                const isFav = srs?.isFavorite ?? false;
                return (
                  <div key={word.id} className="card-upspeak p-4 flex flex-col justify-between gap-3">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <span className="text-3xl">{word.imageEmoji}</span>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h3 className="font-black text-base">{word.english}</h3>
                              <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
                                {word.level}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 font-mono">{word.pronunciation}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <AudioButton text={word.audioText} size="sm" />
                          <button
                            type="button"
                            onClick={() => handleVocabAction(word, 5, true)}
                            aria-label="Marcar como favorita"
                            className={`p-1.5 rounded-xl border ${
                              isFav
                                ? 'bg-rose-500/15 border-rose-500/30 text-rose-500'
                                : 'border-slate-200 dark:border-slate-800 text-slate-400'
                            }`}
                          >
                            <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
                          </button>
                        </div>
                      </div>

                      <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        {word.spanish}
                      </p>

                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs space-y-1">
                        <p className="font-semibold text-slate-800 dark:text-slate-200">
                          “{word.exampleEn}”
                        </p>
                        <p className="text-slate-500">{word.exampleEs}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                      <span className="text-slate-400 font-semibold">
                        Dominio SRS: {srs ? `${srs.masteryLevel}/5 ⭐` : 'Nueva'}
                      </span>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleVocabAction(word, 2)}
                          className="px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold hover:bg-amber-500/25"
                        >
                          Repasar pronto
                        </button>
                        <button
                          type="button"
                          onClick={() => handleVocabAction(word, 5)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold hover:bg-emerald-500/25"
                        >
                          ¡Dominada!
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 4. GRAMÁTICA, VERBOS, 12 TIEMPOS VERBALES Y 5 HABILIDADES (SKILLS) */}
        {activeTab === 'grammar' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl font-black">Gramática, Verbos, 12 Tiempos y Habilidades</h1>
                <p className="text-sm text-slate-500">
                  Consulta interactiva con pronunciación, fórmulas y práctica de voz (Speaking & Listening).
                </p>
              </div>
              <div className="flex gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                {[
                  { id: 'rules', label: '8 Áreas Gramaticales' },
                  { id: 'verbs', label: 'Verbos y Phrasal Verbs' },
                  { id: 'tenses', label: '12 Tiempos Verbales' },
                  { id: 'skills', label: 'Listening & Speaking' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setGrammarSubTab(t.id as typeof grammarSubTab)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      grammarSubTab === t.id
                        ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {grammarSubTab === 'rules' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {GRAMMAR_RULES.map((rule) => {
                  const cat = GRAMMAR_CATEGORIES.find((c) => c.id === rule.category);
                  return (
                    <div key={rule.id} className="card-upspeak p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
                          {cat?.icon} {cat?.nameEs} • Nivel {rule.level}
                        </span>
                      </div>
                      <h3 className="text-lg font-extrabold">{rule.title}</h3>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {rule.explanation}
                      </p>
                      {rule.formula && (
                        <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-mono text-xs font-bold">
                          📐 {rule.formula}
                        </div>
                      )}
                      <div className="space-y-1.5">
                        {rule.examples.map((ex, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-xs"
                          >
                            <div>
                              <p className="font-bold">{ex.english}</p>
                              <p className="text-slate-500">{ex.spanish}</p>
                            </div>
                            <AudioButton text={ex.english} size="sm" />
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {grammarSubTab === 'verbs' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {VERBS_CATALOG.map((v) => (
                  <div key={v.id} className="card-upspeak p-4 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${VERB_TYPE_LABELS[v.type].badge}`}>
                        {VERB_TYPE_LABELS[v.type].nameEs}
                      </span>
                      <AudioButton text={`${v.infinitive}, ${v.pastSimple}, ${v.pastParticiple}`} size="sm" />
                    </div>
                    <h3 className="text-lg font-black">
                      {v.infinitive} <span className="text-sm font-normal text-slate-500">— {v.spanish}</span>
                    </h3>
                    <div className="grid grid-cols-3 gap-1.5 text-center text-xs bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Present</span>
                        <strong>{v.infinitive}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Past</span>
                        <strong>{v.pastSimple}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Participle</span>
                        <strong>{v.pastParticiple}</strong>
                      </div>
                    </div>
                    <p className="text-xs italic text-slate-600 dark:text-slate-300">“{v.exampleEn}”</p>
                  </div>
                ))}
              </div>
            )}

            {grammarSubTab === 'tenses' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {VERB_TENSES_CATALOG.map((tense) => (
                  <div key={tense.id} className="card-upspeak p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-black">{tense.nameEn}</h3>
                        <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                          {tense.nameEs} • Nivel {tense.level}
                        </p>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-bold uppercase">
                        {tense.category}
                      </span>
                    </div>
                    <div className="text-xs space-y-1 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl font-mono">
                      <p><strong>+</strong> {tense.affirmativeFormula}</p>
                      <p><strong>-</strong> {tense.negativeFormula}</p>
                      <p><strong>?</strong> {tense.interrogativeFormula}</p>
                    </div>
                    <div className="space-y-1.5">
                      {tense.examples.map((ex, i) => (
                        <div key={i} className="flex items-center justify-between text-xs gap-2">
                          <div>
                            <p className="font-bold">{ex.english}</p>
                            <p className="text-slate-500">{ex.spanish}</p>
                          </div>
                          <AudioButton text={ex.english} size="sm" />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {grammarSubTab === 'skills' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {SKILLS_ACTIVITIES.map((sk) => (
                  <div key={sk.id} className="card-upspeak p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-full text-xs font-extrabold uppercase bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                        {sk.skill} • Nivel {sk.level}
                      </span>
                      <AudioButton text={sk.contentEn} label="Escuchar" size="sm" />
                    </div>
                    <h3 className="text-lg font-extrabold">{sk.title}</h3>
                    <p className="text-xs text-slate-500">{sk.description}</p>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 space-y-1.5 text-xs">
                      <p className="font-bold text-slate-800 dark:text-slate-100">{sk.contentEn}</p>
                      <p className="text-slate-500">{sk.contentEs}</p>
                    </div>

                    {sk.skill === 'speaking' && (
                      <div className="pt-1 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSpeechStatus('🎙️ Escuchando tu pronunciación en inglés...');
                            listenEnglishPronunciation(
                              (transcript, conf) => {
                                setSpeechStatus(
                                  `✅ Detectado: "${transcript}" (Precisión fonética: ${conf}%)`
                                );
                              },
                              (err) => setSpeechStatus(`ℹ️ ${err}`)
                            );
                          }}
                          className="btn-emerald text-xs py-2 px-3"
                        >
                          <Mic className="w-4 h-4" />
                          <span>Practicar Pronunciación con Micrófono</span>
                        </button>
                        {speechStatus && (
                          <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                            {speechStatus}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 5. MOTOR DE EJERCICIOS REUTILIZABLE */}
        {activeTab === 'practice' && (
          <div className="max-w-3xl mx-auto space-y-6">
            {sessionDone ? (
              <div className="card-upspeak p-8 text-center space-y-5">
                <div className="text-5xl">🏆</div>
                <h2 className="text-2xl font-black">¡Sesión de Aprendizaje Completada!</h2>
                <p className="text-slate-600 dark:text-slate-300">
                  Acertaste <strong>{sessionScore}</strong> de <strong>{exerciseQueue.length}</strong> ejercicios.
                </p>
                <div className="flex justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => startFreePractice()}
                    className="btn-primary text-sm"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Nueva Sesión de Práctica</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('dashboard')}
                    className="btn-secondary text-sm"
                  >
                    <span>Volver al Dashboard</span>
                  </button>
                </div>
              </div>
            ) : currentExercise ? (
              <div className="card-upspeak p-6 space-y-5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                  <span>
                    {activeLesson ? activeLesson.title : 'Práctica Interactiva'} • Nivel {currentExercise.level}
                  </span>
                  <span>
                    Ejercicio {currentExIdx + 1} de {exerciseQueue.length}
                  </span>
                </div>

                {/* Barra de progreso */}
                <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all"
                    style={{ width: `${((currentExIdx + 1) / exerciseQueue.length) * 100}%` }}
                  />
                </div>

                <div className="space-y-2">
                  <span className="text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
                    {currentExercise.type.replace(/_/g, ' ')}
                  </span>
                  <h2 className="text-lg sm:text-xl font-black">{currentExercise.promptEs}</h2>
                  {currentExercise.promptEn && (
                    <p className="text-base font-bold text-indigo-600 dark:text-indigo-300">
                      “{currentExercise.promptEn}”
                    </p>
                  )}
                  {currentExercise.imageEmoji && (
                    <div className="text-6xl py-2 text-center">{currentExercise.imageEmoji}</div>
                  )}
                  {currentExercise.audioText && (
                    <AudioButton
                      text={currentExercise.audioText}
                      label="Escuchar Audio en Inglés"
                      size="md"
                    />
                  )}
                </div>

                {/* Renderizado dinámico según los 10 tipos de ejercicios */}
                {currentExercise.options && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {currentExercise.options.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        disabled={Boolean(feedback)}
                        onClick={() => setUserAnswer(opt)}
                        className={`p-3.5 rounded-xl border-2 text-left font-bold text-sm transition ${
                          userAnswer === opt
                            ? 'border-indigo-600 bg-indigo-500/10 text-indigo-600 dark:text-indigo-300'
                            : 'border-slate-200 dark:border-slate-800 hover:border-indigo-400'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}

                {currentExercise.type === 'sentence_ordering' && currentExercise.wordsPool && (
                  <div className="space-y-3">
                    <div className="min-h-14 p-3 rounded-xl bg-slate-100 dark:bg-slate-800 flex flex-wrap gap-2 items-center">
                      {orderedWords.length === 0 ? (
                        <span className="text-xs text-slate-400">
                          Haz clic en las palabras de abajo para ordenar la oración...
                        </span>
                      ) : (
                        orderedWords.map((w, i) => (
                          <button
                            key={`${w}_${i}`}
                            type="button"
                            onClick={() =>
                              setOrderedWords(orderedWords.filter((_, idx) => idx !== i))
                            }
                            className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold"
                          >
                            {w}
                          </button>
                        ))
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {currentExercise.wordsPool.map((w, i) => (
                        <button
                          key={i}
                          type="button"
                          disabled={orderedWords.includes(w)}
                          onClick={() => setOrderedWords([...orderedWords, w])}
                          className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-bold disabled:opacity-40"
                        >
                          {w}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {currentExercise.type === 'word_matching' && currentExercise.pairs && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      {currentExercise.pairs.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setSelectedLeft(p.left)}
                          className={`w-full p-2.5 rounded-xl border text-xs font-bold ${
                            selectedLeft === p.left
                              ? 'border-indigo-600 bg-indigo-500/15'
                              : matchedPairs[p.left]
                              ? 'border-emerald-500 bg-emerald-500/10'
                              : 'border-slate-200 dark:border-slate-800'
                          }`}
                        >
                          {p.left} {matchedPairs[p.left] ? `→ ${matchedPairs[p.left]}` : ''}
                        </button>
                      ))}
                    </div>
                    <div className="space-y-2">
                      {currentExercise.pairs.map((p) => (
                        <button
                          key={p.right}
                          type="button"
                          onClick={() => {
                            if (selectedLeft) {
                              setMatchedPairs({ ...matchedPairs, [selectedLeft]: p.right });
                              setSelectedLeft(null);
                            }
                          }}
                          className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold hover:border-indigo-500"
                        >
                          {p.right}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {currentExercise.type === 'dialogue_builder' && currentExercise.dialogueTurns && (
                  <div className="space-y-3">
                    {currentExercise.dialogueTurns.map((turn, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 space-y-2">
                        <p className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400">
                          {turn.avatar} {turn.speaker}
                        </p>
                        {!turn.isUserTurn ? (
                          <>
                            <p className="text-sm font-bold">{turn.textEn}</p>
                            <p className="text-xs text-slate-500">{turn.textEs}</p>
                          </>
                        ) : (
                          <div className="space-y-2">
                            {turn.options?.map((opt) => (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => setUserAnswer(opt)}
                                className={`w-full p-2.5 rounded-lg border text-left text-xs font-bold ${
                                  userAnswer === opt
                                    ? 'border-indigo-600 bg-indigo-500/15'
                                    : 'border-slate-200 dark:border-slate-700'
                                }`}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {(currentExercise.type === 'translation' ||
                  currentExercise.type === 'writing_prompt') && (
                  <input
                    type="text"
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    placeholder="Escribe tu respuesta en inglés aquí..."
                    className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                )}

                {/* Retroalimentación Pedagógica */}
                {feedback && (
                  <div
                    className={`p-4 rounded-xl flex items-start gap-3 text-sm ${
                      feedback.correct
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                        : 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30'
                    }`}
                  >
                    {feedback.correct ? (
                      <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    )}
                    <p className="font-semibold">{feedback.message}</p>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  {!feedback ? (
                    <button
                      type="button"
                      onClick={validateCurrentExercise}
                      className="btn-primary text-sm"
                    >
                      <span>Comprobar Respuesta</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={nextExerciseStep}
                      className="btn-emerald text-sm"
                    >
                      <span>Siguiente →</span>
                    </button>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* 6. PERFILES LOCALES Y RESPALDOS JSON */}
        {activeTab === 'profile' && profile && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Perfiles Locales */}
            <div className="card-upspeak p-6 space-y-4">
              <h2 className="text-xl font-black">Perfiles Locales (Sin Servidor)</h2>
              <p className="text-xs text-slate-500">
                Cambia de estudiante o crea un perfil adicional en este dispositivo.
              </p>
              <div className="space-y-2">
                {profiles.map((p) => (
                  <div
                    key={p.id}
                    className={`p-3 rounded-xl border flex items-center justify-between ${
                      p.id === profile.id
                        ? 'border-indigo-600 bg-indigo-500/10'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{p.avatar}</span>
                      <div>
                        <p className="font-bold text-sm">{p.name}</p>
                        <p className="text-xs text-slate-500">
                          Nivel {p.currentLevel} • {p.xp} XP
                        </p>
                      </div>
                    </div>
                    {p.id !== profile.id && (
                      <button
                        type="button"
                        onClick={() => loadData(p.id)}
                        className="btn-secondary text-xs py-1.5 px-3"
                      >
                        Activar
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
                <h3 className="text-sm font-extrabold">Crear Nuevo Perfil</h3>
                <div className="flex gap-2">
                  <select
                    value={newProfileAvatar}
                    onChange={(e) => setNewProfileAvatar(e.target.value)}
                    className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-lg"
                  >
                    {['🦉', '🚀', '🦁', '🎓', '🧑‍💻', '🌟'].map((av) => (
                      <option key={av} value={av}>
                        {av}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={newProfileName}
                    onChange={(e) => setNewProfileName(e.target.value)}
                    placeholder="Nombre del estudiante..."
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      if (!newProfileName.trim()) return;
                      const created = await ProfileRepository.createProfile({
                        name: newProfileName,
                        avatar: newProfileAvatar,
                        ageGroup: 'young_adults',
                        initialLevel: 'A1',
                      });
                      setNewProfileName('');
                      await loadData(created.id);
                      showToast(`Perfil "${created.name}" creado y activado.`);
                    }}
                    className="btn-primary text-xs py-2 px-4"
                  >
                    Crear
                  </button>
                </div>
              </div>
            </div>

            {/* Respaldos JSON y Almacenamiento Local */}
            <div className="card-upspeak p-6 space-y-4">
              <h2 className="text-xl font-black">Respaldos JSON y Privacidad Local</h2>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                UpSpeak almacena tus datos localmente en IndexedDB (Dexie.js) sin enviar información personal a servidores externos. Exporta un archivo JSON para conservar o trasladar tu progreso.
              </p>

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleExportBackup}
                  className="btn-primary text-xs"
                >
                  <Download className="w-4 h-4" />
                  <span>Exportar Respaldo (.JSON)</span>
                </button>

                <label className="btn-secondary text-xs cursor-pointer">
                  <Upload className="w-4 h-4" />
                  <span>Importar / Restaurar JSON</span>
                  <input
                    type="file"
                    accept="application/json"
                    onChange={handleImportBackup}
                    className="hidden"
                  />
                </label>
              </div>

              {backupMessage && (
                <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 pt-2">
                  {backupMessage}
                </p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
