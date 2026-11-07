# Arquitectura del Sistema — UpSpeak ("Learn English, Level Up!")

## 1. Análisis del Repositorio Actual
- **Estado Inicial**: Repositorio Git inicializado en `c:\Users\Marlon\Documents\Desarrollo\upspeak` con únicamente `README.md` (`# upspeak - app para aprendizaje de idioma ingles`).
- **Entorno Detectado**: Windows, Node.js `v24.21.0`, npm `11.19.0`.
- **Tipo de Despliegue**: Generación Estática Pura (`output: 'static'`) en Astro, 100% Client-Side / Local-First sin dependencia de backend ni bases de datos remotas.

---

## 2. Stack Tecnológico Definido
| Capa | Tecnología | Rol en UpSpeak |
| :--- | :--- | :--- |
| **Framework Core** | Astro 5 + TypeScript (Strict) | Enrutamiento estático, Layouts, Astro Islands, SEO, estructura HTML sin JS innecesario |
| **UI Interactiva (Islands)** | React 19 + `@astrojs/react` | Motor de ejercicios, juegos, dashboard dinámico, audio/pronunciación, paneles de estado |
| **Estilos y Diseño** | Tailwind CSS + CSS Variables | Sistema de diseño dual (Claro/Oscuro), tokens visuales, animaciones nativas |
| **Iconografía** | `lucide-react` | Iconos consistentes, accesibles y ligeros |
| **Persistencia Local** | IndexedDB vía `Dexie.js` | Base de datos local transaccional para perfiles, progreso, SRS (repetición espaciada), logros |
| **Estado en Cliente** | `Zustand` | Sincronización reactiva entre Islas React (perfil activo, XP/monedas, sesión de estudio, tema) |
| **Animaciones** | `framer-motion` + CSS Animations | Transiciones de ejercicios, feedback inmediato, recompensas gamificadas |
| **Audio y Voz** | Web Speech API (`SpeechSynthesis` & `SpeechRecognition`) + Audio local | Pronunciación nativa en inglés y evaluación fonética interactiva offline-compatible |
| **PWA & Offline** | `@vite-pwa/astro` / Service Worker + Web App Manifest | Caché diferenciada de assets estáticos, JSONs académicos y soporte offline completo |
| **Testing** | `Vitest` + Testing Library | Pruebas unitarias y de integración para base de datos, motor de ejercicios, SRS y respaldos |

---

## 3. Arquitectura de Islas (Astro Islands) y Estrategia de Hidratación
Para garantizar el máximo rendimiento móvil y de escritorio:
1. **Componentes Astro Estáticos (0 KB JS)**:
   - `MainLayout.astro`, `AppShell.astro`, `Header.astro`, `Sidebar.astro`, `Footer.astro`.
   - Páginas informativas, índices de niveles MCER (A1–C2), explicaciones teóricas estáticas y envoltorios de módulos.
2. **Islas React con `client:load`** (Críticas al cargar la vista):
   - Hidratación del perfil activo y barra superior de estado (`UserStatusBar`: XP, Monedas, Racha, Selector de Perfil).
   - `DashboardView` y `ExerciseEngine` cuando el usuario entra directamente a practicar o evaluar.
3. **Islas React con `client:visible`** (Diferidas al hacer scroll):
   - Gráficos de estadísticas detalladas, tarjetas de logros/insignias secundarias, reproductores de ejemplos en listados largos.
4. **Islas React con `client:idle`** (No urgentes):
   - Gestor de respaldos JSON, modales de configuración, sincronizador de semillas (Seed Loader) en segundo plano.

---

## 4. Estructura Modular de Directorios

```text
upspeak/
├── public/
│   ├── icons/                  # Iconos PWA (192x192, 512x512, maskable, favicon)
│   ├── images/                 # Ilustraciones, personajes animados y vocabulario visual
│   ├── audio/                  # Efectos de sonido y clips de listening locales
│   ├── fonts/                  # Tipografías locales (Plus Jakarta Sans / Inter / Nunito)
│   ├── manifest.webmanifest    # Manifiesto PWA instalable
│   └── sw.js                   # Service Worker con estrategias de caché diferenciadas
├── src/
│   ├── assets/                 # SVGs optimizados, mascotas de UpSpeak e ilustraciones
│   ├── components/
│   │   ├── common/             # Botones, Modales, Tarjetas, Barras de Progreso, Badges
│   │   ├── navigation/         # Navbar, Sidebar, MobileBottomNav, Breadcrumbs
│   │   ├── dashboard/          # Saludo, Resumen de Racha, Misiones Diarias, Acceso Rápido
│   │   ├── learning/           # Selector de Nivel MCER (A1-C2), Mapa de Unidades/Lecciones
│   │   ├── vocabulary/         # Flashcards interactivas, Diccionario Personal, AudioPlayer
│   │   ├── grammar/            # Tablas interactivas de reglas, Verbos y 12 Tiempos Verbales
│   │   ├── exercises/          # Motor de 10 tipos de ejercicios reutilizable
│   │   └── gamification/       # Notificaciones de XP, Tienda/Recompensas, Mascota animada
│   ├── layouts/
│   │   ├── BaseLayout.astro    # Head, SEO, PWA tags, Inicializador de Tema Claro/Oscuro
│   │   └── AppLayout.astro     # Layout de aplicación con navegación adaptativa
│   ├── pages/
│   │   ├── index.astro         # Dashboard Principal / Bienvenida
│   │   ├── levels/             # Rutas de niveles MCER A1 a C2 y sus lecciones
│   │   ├── vocabulary/         # Módulo de Vocabulario (16 categorías) y Diccionario
│   │   ├── grammar/            # Módulo de Gramática, Verbos y 12 Tiempos Verbales
│   │   ├── skills/             # Listening, Speaking, Reading, Writing, Conversation
│   │   ├── practice/           # Motor de Ejercicios, Juegos y Repaso Inteligente (SRS)
│   │   ├── achievements/       # Logros, Insignias, Misiones y Estadísticas
│   │   ├── profile/            # Gestión de Perfiles Locales y Respaldos JSON
│   │   └── offline.astro       # Página de recuperación sin conexión
│   ├── features/
│   │   ├── authentication/     # Selector y creador de perfiles locales sin servidor
│   │   ├── learning/           # Lógica de desbloqueo y progresión MCER A1-C2
│   │   ├── vocabulary/         # Búsqueda, filtros, favoritos y dominio de palabras
│   │   ├── grammar/            # Consultas estructuradas de gramática y conjugaciones
│   │   ├── exercises/          # Validadores, cálculo de puntaje y generador de sesiones
│   │   ├── progress/           # Algoritmo SM-2 de repetición espaciada y analíticas
│   │   └── achievements/       # Reglas de desbloqueo de medallas, rachas y misiones
│   ├── content/
│   │   ├── levels/             # Currículo estructurado A1, A2, B1, B2, C1, C2 (JSON/TS)
│   │   ├── vocabulary/         # 16 categorías completas con traducción, IPA, ejemplo, imagen
│   │   ├── grammar/            # 8 bloques gramaticales + 12 tiempos verbales detallados
│   │   ├── verbs/              # Básicos, regulares, irregulares, auxiliares, modales, phrasal
│   │   └── exercises/          # Banco de ejercicios tipados para los 10 formatos y 5 skills
│   ├── database/
│   │   ├── db.ts               # Instancia de Dexie.js (UpSpeakDatabase)
│   │   ├── schema.ts           # Definición de tablas e índices de IndexedDB
│   │   ├── migrations/         # Control de versiones y poblado inicial idempotente (Seeder)
│   │   └── repositories/       # Repositorios desacoplados (ProfileRepo, ProgressRepo, SRSRepo)
│   ├── hooks/                  # Hooks de React (useActiveProfile, useSpeech, useSpacedRepetition)
│   ├── services/               # TTS/STT Service, BackupService (Export/Import JSON), SeederService
│   ├── stores/                 # Zustand stores (useUserStore, useSessionStore, useUIStore)
│   ├── types/                  # Interfaces estrictas TypeScript de todo el dominio
│   ├── utils/                  # Sanitización, validadores, formateadores, algoritmos de XP
│   └── styles/
│       └── global.css          # Variables de tema, utilidades Tailwind y microanimaciones
└── tests/                      # Suite de pruebas unitarias y de integración (Vitest)
```

---

## 5. Diseño de Base de Datos Local (Dexie.js / IndexedDB)
Base de datos `UpSpeakDB` con control de versión y migración automática:
1. `profiles`: `id, name, avatar, ageGroup, currentLevel, xp, coins, stars, streakDays, lastActivityDate, createdAt, settings`
2. `lessonProgress`: `[profileId+lessonId], profileId, levelId, unitId, status, bestScore, stars, attempts, completedAt`
3. `vocabularyProgress`: `[profileId+wordId], profileId, wordId, category, isFavorite, masteryLevel, nextReviewDate, interval, easeFactor, repetitions` (Algoritmo SM-2 de repetición espaciada)
4. `exerciseHistory`: `++id, profileId, lessonId, moduleType, score, xpEarned, accuracy, completedAt`
5. `achievements`: `[profileId+achievementId], profileId, achievementId, unlockedAt, progress`
6. `dailyMissions`: `[profileId+date], profileId, date, missions`
7. `contentMetadata`: `key, version, updatedAt` (Evita duplicados en la carga inicial y controla migraciones del catálogo académico)
