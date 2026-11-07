import type { GrammarCategoryId, GrammarRule, CEFRLevelId } from '../../types';

export interface GrammarCategoryMeta {
  id: GrammarCategoryId;
  nameEs: string;
  nameEn: string;
  icon: string;
  level: CEFRLevelId;
  description: string;
}

export const GRAMMAR_CATEGORIES: GrammarCategoryMeta[] = [
  { id: 'pronouns', nameEs: 'Pronombres', nameEn: 'Pronouns', icon: '👤', level: 'A1', description: 'Personales, objeto, posesivos, reflexivos y relativos.' },
  { id: 'articles', nameEs: 'Artículos y Determinantes', nameEn: 'Articles (A, An, The)', icon: '📌', level: 'A1', description: 'Uso correcto de artículos definidos, indefinidos y artículo cero.' },
  { id: 'nouns', nameEs: 'Sustantivos', nameEn: 'Nouns (Countable & Uncountable)', icon: '📦', level: 'A1', description: 'Plurales regulares/irregulares, contables e incontables.' },
  { id: 'adjectives', nameEs: 'Adjetivos y Comparativos', nameEn: 'Adjectives & Degrees', icon: '✨', level: 'A2', description: 'Orden de los adjetivos, comparativos y superlativos.' },
  { id: 'adverbs', nameEs: 'Adverbios', nameEn: 'Adverbs of Frequency & Manner', icon: '⚡', level: 'A2', description: 'Adverbios de frecuencia, modo, grado y su posición en la oración.' },
  { id: 'prepositions', nameEs: 'Preposiciones', nameEn: 'Prepositions (In, On, At)', icon: '🧭', level: 'B1', description: 'Preposiciones de tiempo, lugar, movimiento y dependientes.' },
  { id: 'conjunctions', nameEs: 'Conjunciones y Conectores', nameEn: 'Conjunctions & Linkers', icon: '🔗', level: 'B2', description: 'Coordinantes, subordinantes y conectores de discurso avanzado.' },
  { id: 'structures', nameEs: 'Estructuras Gramaticales', nameEn: 'Conditionals, Passive & Inversion', icon: '🏛️', level: 'C1', description: 'Condicionales (0-3 y mixtos), voz pasiva, estilo indirecto e inversión.' },
];

export const GRAMMAR_RULES: GrammarRule[] = [
  {
    id: 'gram_pronouns_1',
    category: 'pronouns',
    level: 'A1',
    title: 'Pronombres Sujeto vs. Objeto y Posesivos',
    summary: 'En inglés el sujeto nunca se omite. Los pronombres sujeto van antes del verbo y los de objeto después del verbo o preposición.',
    explanation:
      'A diferencia del español (donde podemos decir "Trabajo aquí"), en inglés es obligatorio indicar el sujeto ("I work here"). Además, distinguimos entre adjetivos posesivos (my, your, his, her + sustantivo) y pronombres posesivos (mine, yours, his, hers sin sustantivo).',
    formula: 'Subject Pronoun (I/You/He/She/It/We/They) + Verb + Object Pronoun (me/you/him/her/it/us/them)',
    examples: [
      { english: 'She called him yesterday afternoon.', spanish: 'Ella lo llamó ayer por la tarde.', highlight: 'She / him' },
      { english: 'This laptop is my computer -> This laptop is mine.', spanish: 'Este portátil es mi computador -> Este portátil es mío.', highlight: 'my / mine' },
      { english: 'They invited us to their presentation.', spanish: 'Ellos nos invitaron a su presentación.', highlight: 'They / us / their' },
    ],
    commonMistakes: [
      { incorrect: 'Is raining today.', correct: 'It is raining today.', reason: 'En inglés siempre se necesita el sujeto neutro "It" para clima, hora y distancia.' },
      { incorrect: 'Me and Carlos study English.', correct: 'Carlos and I study English.', reason: 'En posición de sujeto se utiliza el pronombre personal "I", no el objeto "me".' },
    ],
  },
  {
    id: 'gram_articles_1',
    category: 'articles',
    level: 'A1',
    title: 'Artículos Indefinidos (A / An), Definido (The) y Artículo Cero',
    summary: 'La elección entre "a" y "an" depende del SONIDO inicial de la siguiente palabra, no solo de cómo se escribe.',
    explanation:
      'Usa "a" antes de sonidos consonánticos (a book, a university /juː/) y "an" antes de sonidos vocálicos (an apple, an hour /aʊər/). Usa "the" para algo específico ya conocido, y omite el artículo (Zero Article) al hablar de cosas en sentido general en plural o incontables.',
    formula: 'a + consonant sound | an + vowel sound | the + specific noun | Ø + general plural/uncountable',
    examples: [
      { english: 'She studies at a university in London for an hour every day.', spanish: 'Ella estudia en una universidad en Londres durante una hora cada día.', highlight: 'a university / an hour' },
      { english: 'Music brings people together. (General)', spanish: 'La música une a las personas. (Sentido general sin "the")', highlight: 'Music' },
      { english: 'The music at last night’s concert was amazing. (Specific)', spanish: 'La música del concierto de anoche estuvo increíble. (Específico)', highlight: 'The music' },
    ],
    commonMistakes: [
      { incorrect: 'He is an university student.', correct: 'He is a university student.', reason: '"University" inicia con sonido semiconsonántico /juː/, por lo que lleva "a".' },
      { incorrect: 'The life is beautiful.', correct: 'Life is beautiful.', reason: 'Los sustantivos abstractos en sentido general no llevan "the" en inglés.' },
    ],
  },
  {
    id: 'gram_nouns_1',
    category: 'nouns',
    level: 'A1',
    title: 'Sustantivos Contables, Incontables y Plurales Irregulares',
    summary: 'Sustantivos como information, advice, luggage, furniture y money son INCONTABLES en inglés y nunca llevan plural.',
    explanation:
      'Los sustantivos contables tienen singular y plural (one book, two books; one child, two children). Los incontables siempre usan verbo en singular y cuantificadores como "much", "some", "a lot of" o "a piece of".',
    formula: 'Countable: many / a few + plural noun | Uncountable: much / a little / a piece of + singular noun',
    examples: [
      { english: 'Can you give me a piece of advice?', spanish: '¿Puedes darme un consejo?', highlight: 'a piece of advice' },
      { english: 'There are three children and two women in the classroom.', spanish: 'Hay tres niños y dos mujeres en el aula.', highlight: 'children / women' },
      { english: 'We don’t have much information about the schedule yet.', spanish: 'Todavía no tenemos mucha información sobre el horario.', highlight: 'much information' },
    ],
    commonMistakes: [
      { incorrect: 'I need some informations and advices.', correct: 'I need some information and advice.', reason: '"Information" y "advice" son incontables; nunca llevan "-s" final.' },
      { incorrect: 'The people is very friendly here.', correct: 'People are very friendly here.', reason: '"People" (personas) es un sustantivo plural y requiere "are".' },
    ],
  },
  {
    id: 'gram_adjectives_1',
    category: 'adjectives',
    level: 'A2',
    title: 'Posición de Adjetivos, Comparativos y Superlativos',
    summary: 'En inglés los adjetivos son invariables (sin género ni plural) y se colocan ANTES del sustantivo.',
    explanation:
      'Para comparar dos elementos: adjetivos cortos agregan "-er than" (faster than) y adjetivos largos usan "more ... than" (more interesting than). Para el superlativo usamos "the -est" o "the most ...".',
    formula: 'Opinion + Size + Age + Color + Origin + Material + Noun | Short Adj + -er than | more + Long Adj + than',
    examples: [
      { english: 'She bought a beautiful small Italian leather bag.', spanish: 'Ella compró un hermoso bolso pequeño de cuero italiano.', highlight: 'beautiful small Italian leather' },
      { english: 'This exercise is easier than the previous one.', spanish: 'Este ejercicio es más fácil que el anterior.', highlight: 'easier than' },
      { english: 'Practice is the most effective way to master a language.', spanish: 'La práctica es la forma más efectiva de dominar un idioma.', highlight: 'the most effective' },
    ],
    commonMistakes: [
      { incorrect: 'They have two cars reds.', correct: 'They have two red cars.', reason: 'Los adjetivos van antes del sustantivo y nunca llevan "-s" en plural.' },
      { incorrect: 'This route is more fast than the highway.', correct: 'This route is faster than the highway.', reason: '"Fast" es de una sola sílaba, por lo que forma el comparativo con "-er".' },
    ],
  },
  {
    id: 'gram_adverbs_1',
    category: 'adverbs',
    level: 'A2',
    title: 'Adverbios de Frecuencia y de Modo',
    summary: 'Los adverbios de frecuencia van ANTES del verbo principal, pero DESPUÉS del verbo To Be.',
    explanation:
      'Los adverbios de frecuencia (always, usually, often, sometimes, rarely, never) indican cada cuánto ocurre una acción. Los adverbios de modo suelen formarse añadiendo "-ly" al adjetivo (quick -> quickly, careful -> carefully), con excepciones como good -> well y fast -> fast.',
    formula: 'Subject + Adverb of Frequency + Main Verb | Subject + am/is/are + Adverb of Frequency',
    examples: [
      { english: 'I always review my vocabulary cards in the morning.', spanish: 'Siempre repaso mis tarjetas de vocabulario por la mañana.', highlight: 'always review' },
      { english: 'She is never late for her English conversation club.', spanish: 'Ella nunca llega tarde a su club de conversación en inglés.', highlight: 'is never' },
      { english: 'He speaks English fluently and clearly.', spanish: 'Él habla inglés con fluidez y claridad.', highlight: 'fluently and clearly' },
    ],
    commonMistakes: [
      { incorrect: 'She speaks very good English.', correct: 'She speaks English very well.', reason: 'Para modificar al verbo "speak" se requiere el adverbio "well", y el objeto va junto al verbo.' },
    ],
  },
  {
    id: 'gram_prepositions_1',
    category: 'prepositions',
    level: 'B1',
    title: 'Triángulo de Oro: IN, ON, AT para Tiempo y Lugar',
    summary: 'De lo más general a lo más específico: IN (meses, años, países, ciudades) -> ON (días, fechas, calles, superficies) -> AT (horas exactas, puntos específicos).',
    explanation:
      'En tiempo: IN the morning / IN July / IN 2026; ON Monday / ON May 5th; AT 8:30 AM / AT night. En lugar: IN Colombia / IN a room; ON the table / ON Oxford Street; AT the bus stop / AT home.',
    formula: 'IN (General/Container) > ON (Days/Surfaces) > AT (Exact Time/Exact Point)',
    examples: [
      { english: 'Our seminar starts at 9:00 AM on Tuesday in October.', spanish: 'Nuestro seminario comienza a las 9:00 AM el martes en octubre.', highlight: 'at 9:00 AM / on Tuesday / in October' },
      { english: 'I left my notebook on the desk at the office in Madrid.', spanish: 'Dejé mi cuaderno sobre el escritorio en la oficina en Madrid.', highlight: 'on the desk / at the office / in Madrid' },
    ],
    commonMistakes: [
      { incorrect: 'See you in Monday at the morning.', correct: 'See you on Monday in the morning.', reason: 'Los días de la semana siempre usan "on" y las partes del día usan "in" (excepto "at night").' },
    ],
  },
  {
    id: 'gram_conjunctions_1',
    category: 'conjunctions',
    level: 'B2',
    title: 'Conjunciones y Conectores de Contraste, Causa y Resultado',
    summary: 'Distingue entre conectores seguidos de cláusula (Although, Because) y conectores seguidos de sustantivo o gerundio (Despite, Due to).',
    explanation:
      '"Although / Even though" van seguidos de Sujeto + Verbo. En cambio, "Despite / In spite of" van seguidos de un sustantivo, pronombre o verbo en "-ing" (o "the fact that").',
    formula: 'Although + Subject + Verb | Despite / In spite of + Noun / Verb-ing',
    examples: [
      { english: 'Although it was raining heavily, they completed the marathon.', spanish: 'Aunque estaba lloviendo fuerte, ellos completaron el maratón.', highlight: 'Although it was' },
      { english: 'Despite the heavy rain, they completed the marathon.', spanish: 'A pesar de la fuerte lluvia, ellos completaron el maratón.', highlight: 'Despite the heavy rain' },
      { english: 'The flight was canceled due to severe weather conditions.', spanish: 'El vuelo fue cancelado debido a condiciones climáticas severas.', highlight: 'due to' },
    ],
    commonMistakes: [
      { incorrect: 'Despite of the difficulty, she passed.', correct: 'Despite the difficulty, she passed. (or: In spite of the difficulty)', reason: '"Despite" nunca lleva la preposición "of".' },
    ],
  },
  {
    id: 'gram_structures_1',
    category: 'structures',
    level: 'C1',
    title: 'Condicionales (0, 1, 2, 3), Voz Pasiva e Inversión Enfática',
    summary: 'Domina las hipótesis reales e irreales, la voz pasiva formal y la inversión estilística de nivel C1-C2.',
    explanation:
      'Zero Conditional: verdades universales (If + Present, Present). First: futuro probable (If + Present, will + Verb). Second: hipótesis presente (If + Past Simple, would + Verb). Third: pasado irreal (If + Past Perfect, would have + Participle). En C1/C2, la inversión negativa al inicio ("Never have I seen...", "Not only did she...") aporta énfasis formal.',
    formula: '3rd Conditional: If + had + V3, would have + V3 | Inversion: Negative Adverb + Auxiliary + Subject + Verb',
    examples: [
      { english: 'If I had known about the workshop earlier, I would have registered.', spanish: 'Si hubiera sabido antes sobre el taller, me habría inscrito.', highlight: 'had known / would have registered' },
      { english: 'The new curriculum was designed by linguistic experts.', spanish: 'El nuevo currículo fue diseñado por expertos en lingüística.', highlight: 'was designed by' },
      { english: 'Not only did she master English, but she also published a book in it.', spanish: 'No solo dominó el inglés, sino que también publicó un libro en ese idioma.', highlight: 'Not only did she master' },
    ],
    commonMistakes: [
      { incorrect: 'If I would have time, I would travel more.', correct: 'If I had time, I would travel more.', reason: 'La cláusula con "If" no lleva "would" en los condicionales estándar.' },
    ],
  },
];
