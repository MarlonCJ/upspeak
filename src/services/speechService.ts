/**
 * UpSpeak Speech & Audio Service
 * Síntesis de voz (TTS), reconocimiento de pronunciación (STT) y efectos de sonido Web Audio API 100% offline.
 */

export interface SpeakOptions {
  rate?: number;
  lang?: 'en-US' | 'en-GB';
  pitch?: number;
  onStart?: () => void;
  onEnd?: () => void;
}

export function speakEnglish(text: string, options: SpeakOptions = {}): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    options.onEnd?.();
    return;
  }

  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const targetLang = options.lang || 'en-US';
    utterance.lang = targetLang;
    utterance.rate = options.rate ?? 0.95;
    utterance.pitch = options.pitch ?? 1.0;

    const voices = window.speechSynthesis.getVoices();
    const preferredVoice =
      voices.find((v) => v.lang === targetLang && v.localService) ||
      voices.find((v) => v.lang.startsWith('en'));

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => options.onStart?.();
    utterance.onend = () => options.onEnd?.();
    utterance.onerror = () => options.onEnd?.();

    window.speechSynthesis.speak(utterance);
  } catch {
    options.onEnd?.();
  }
}

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(
    (window as unknown as Record<string, unknown>).SpeechRecognition ||
      (window as unknown as Record<string, unknown>).webkitSpeechRecognition
  );
}

export function listenEnglishPronunciation(
  onResult: (transcript: string, confidence: number) => void,
  onError: (message: string) => void,
  lang: 'en-US' | 'en-GB' = 'en-US'
): () => void {
  if (typeof window === 'undefined') {
    onError('Reconocimiento de voz no disponible en este entorno.');
    return () => {};
  }

  const SpeechRecognitionCtor =
    (window as unknown as Record<string, any>).SpeechRecognition ||
    (window as unknown as Record<string, any>).webkitSpeechRecognition;

  if (!SpeechRecognitionCtor) {
    onError('Tu navegador no soporta reconocimiento directo de micrófono. Puedes usar el modo de autoevaluación guiada.');
    return () => {};
  }

  const recognition = new SpeechRecognitionCtor();
  recognition.lang = lang;
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onresult = (event: any) => {
    const result = event.results?.[0]?.[0];
    if (result) {
      onResult(result.transcript || '', Math.round((result.confidence || 0.85) * 100));
    }
  };

  recognition.onerror = () => {
    onError('No se detectó audio claro o el permiso de micrófono fue denegado.');
  };

  try {
    recognition.start();
  } catch {
    onError('No se pudo iniciar la captura de voz.');
  }

  return () => {
    try {
      recognition.stop();
    } catch {
      // ignore
    }
  };
}

/**
 * Efectos de sonido sintetizados mediante Web Audio API (sin archivos pesados ni red)
 */
export function playSoundEffect(type: 'correct' | 'wrong' | 'levelup' | 'click'): void {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    if (type === 'correct') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.09); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.18); // G5
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (type === 'wrong') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.setValueAtTime(220, now + 0.12);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === 'levelup') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(554.37, now + 0.1);
      osc.frequency.setValueAtTime(659.25, now + 0.2);
      osc.frequency.setValueAtTime(880, now + 0.3);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      osc.start(now);
      osc.stop(now + 0.55);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    }
  } catch {
    // Web Audio not allowed or muted
  }
}
