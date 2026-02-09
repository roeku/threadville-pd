import { useEffect, useRef, useState, useCallback } from 'react';

export type SFXType = 
  | 'computer-click' | 'computer-open' | 'computer-close'
  | 'phone-pickup' | 'phone-tap' | 'phone-send'
  | 'evidence-pickup' | 'evidence-place' | 'paper-rustle'
  | 'drawer-open' | 'printer-print'
  | 'board-pin' | 'folder-open' | 'folder-close';

interface AudioSettings {
  musicVolume: number;
  ambianceVolume: number;
  sfxVolume: number;
  musicEnabled: boolean;
  ambianceEnabled: boolean;
  sfxEnabled: boolean;
}

const MUSIC_TRACKS = [
  '/threadville-audio-5.ogg',
  '/threadville-audio-6.ogg',
  '/threadville-audio-7.ogg',
  '/threadville-audio-8.ogg',
];
const AMBIANCE_TRACK = '/0.ogg';
const STORAGE_KEY = 'cold-case-audio-settings';
const DEFAULT_SETTINGS: AudioSettings = {
  musicVolume: 0.3,
  ambianceVolume: 0.15,
  sfxVolume: 0.5,
  musicEnabled: true,
  ambianceEnabled: true,
  sfxEnabled: true,
};

// --- HELPER: Create a White Noise Buffer ---
// We create this once and reuse it. Real paper sounds are just filtered noise.
const createNoiseBuffer = (context: AudioContext): AudioBuffer => {
  const bufferSize = context.sampleRate * 2; // 2 seconds of noise
  const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
};

// --- CORE: Improved SFX Generator ---
const playProceduralSFX = (
  context: AudioContext, 
  type: SFXType, 
  noiseBuffer: AudioBuffer | null,
  destination: AudioNode
): void => {
  const now = context.currentTime;
  
  // -- Helper for Noise (Paper/Organic sounds) --
  const playNoise = (
    duration: number, 
    filterFreq: number, 
    filterType: BiquadFilterType = 'lowpass',
    volume: number = 1
  ) => {
    if (!noiseBuffer) return;
    const source = context.createBufferSource();
    source.buffer = noiseBuffer;
    
    const filter = context.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.value = filterFreq;

    const gain = context.createGain();
    
    // Connect: Source -> Filter -> Gain -> Destination
    source.connect(filter);
    filter.connect(gain);
    gain.connect(destination);

    // Envelope (Attack/Decay)
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume, now + (duration * 0.1)); // Fast attack
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration); // Smooth decay

    source.start(now);
    source.stop(now + duration);
  };

  // -- Helper for Oscillators (Electronic/Beep sounds) --
  const playTone = (
    freq: number, 
    type: OscillatorType, 
    duration: number, 
    volume: number = 1
  ) => {
    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    
    osc.connect(gain);
    gain.connect(destination);

    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

    osc.start(now);
    osc.stop(now + duration);
  };

  switch (type) {
    // --- PAPER & ORGANIC SOUNDS (Improved) ---
    case 'paper-rustle':
    case 'evidence-pickup':
      // High frequency noise with a quick envelope = crisp paper sound
      playNoise(0.15, 1200, 'highpass', 0.2); 
      playNoise(0.2, 800, 'lowpass', 0.1); // Layered for depth
      break;

    case 'evidence-place':
      // Lower frequency "thud" + paper slide
      playNoise(0.2, 400, 'lowpass', 0.6); 
      break;

    case 'folder-open':
      // Longer "slide" sound
      playNoise(0.3, 600, 'lowpass', 0.4);
      break;

    case 'folder-close':
      // Sharp thud
      playNoise(0.15, 300, 'lowpass', 0.5);
      break;

    case 'drawer-open':
      // Rolling rumble
      playNoise(0.4, 200, 'lowpass', 0.5);
      break;

    case 'board-pin':
      // A noise burst + a high click
      playNoise(0.05, 1000, 'lowpass', 0.5); 
      playTone(600, 'triangle', 0.05, 0.2);
      break;

    // --- ELECTRONIC SOUNDS ---
    case 'computer-click':
    case 'phone-tap':
      playTone(1200, 'sine', 0.05, 0.1); // Higher, tighter click
      break;
      
    case 'computer-open':
      playTone(600, 'sine', 0.2, 0.1);
      playTone(1200, 'sine', 0.1, 0.05); // Chime effect
      break;
      
    case 'computer-close':
      playTone(400, 'sine', 0.15, 0.1);
      break;
      
    case 'phone-pickup':
      playTone(440, 'sine', 0.1, 0.1);
      playTone(880, 'sine', 0.1, 0.05);
      break;
      
    case 'phone-send':
      playTone(1500, 'sine', 0.1, 0.05);
      break;
      
    case 'printer-print':
      // Rhythmic pulses for printer
      const now = context.currentTime;
      const osc = context.createOscillator();
      const gain = context.createGain();
      osc.type = 'sawtooth';
      osc.frequency.value = 100;
      gain.gain.setValueAtTime(0.1, now);
      // create a "chug-chug" effect
      gain.gain.setTargetAtTime(0.05, now, 0.1);
      
      osc.connect(gain);
      gain.connect(destination);
      osc.start(now);
      osc.stop(now + 0.5);
      break;
  }
};

export const useAudio = () => {
  const musicRef = useRef<HTMLAudioElement | null>(null);
  const ambianceRef = useRef<HTMLAudioElement | null>(null);
  
  // We need a persistent reference to the Noise Buffer
  const noiseBufferRef = useRef<AudioBuffer | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [settings, setSettings] = useState<AudioSettings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });
  const [isInitialized, setIsInitialized] = useState(false);
  const fadeIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Save settings
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  // Update Volumes dynamically
  useEffect(() => {
    if (musicRef.current) musicRef.current.volume = settings.musicEnabled ? settings.musicVolume : 0;
    if (ambianceRef.current) ambianceRef.current.volume = settings.ambianceEnabled ? settings.ambianceVolume : 0;
  }, [settings]);

  const initialize = useCallback(() => {
    if (isInitialized) return;

    // 1. Setup Audio Context & Noise Buffer
    const AudioCtor = window.AudioContext || (window as any).webkitAudioContext;
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioCtor();
      // Generate the noise buffer immediately upon init
      noiseBufferRef.current = createNoiseBuffer(audioContextRef.current);
    }

    // 2. Setup Music
    if (!musicRef.current) {
      musicRef.current = new Audio(MUSIC_TRACKS[0]);
      musicRef.current.loop = false;
      musicRef.current.volume = settings.musicEnabled ? settings.musicVolume : 0;
      musicRef.current.addEventListener('ended', () => {
        setCurrentTrackIndex(prev => (prev + 1) % MUSIC_TRACKS.length);
      });
    }

    // 3. Setup Ambiance
    if (!ambianceRef.current) {
      ambianceRef.current = new Audio(AMBIANCE_TRACK);
      ambianceRef.current.loop = true;
      ambianceRef.current.volume = settings.ambianceEnabled ? settings.ambianceVolume : 0;
    }

    // Resume context if needed (browsers block auto-play)
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }

    setIsInitialized(true);
  }, [isInitialized, settings]);

  // Track Rotation Logic
  useEffect(() => {
    if (!musicRef.current || !isInitialized) return;

    const playNext = async () => {
      musicRef.current!.src = MUSIC_TRACKS[currentTrackIndex];
      if (settings.musicEnabled) {
        try {
          await musicRef.current!.play();
        } catch (e) { console.debug('Playback prevented', e); }
      }
    };
    playNext();
  }, [currentTrackIndex, isInitialized]);

  // Play/Pause toggles
  useEffect(() => {
    if (!isInitialized) return;
    if (musicRef.current) settings.musicEnabled ? musicRef.current.play().catch(()=>{}) : musicRef.current.pause();
    if (ambianceRef.current) settings.ambianceEnabled ? ambianceRef.current.play().catch(()=>{}) : ambianceRef.current.pause();
  }, [settings.musicEnabled, settings.ambianceEnabled, isInitialized]);

  // --- PLAY SFX ---
  const playSFX = useCallback((type: SFXType) => {
    if (!settings.sfxEnabled || !audioContextRef.current) return;
    const ctx = audioContextRef.current;

    if (ctx.state === 'suspended') ctx.resume();

    // Create a Master Gain for SFX Volume Control
    const masterSFXGain = ctx.createGain();
    masterSFXGain.gain.value = settings.sfxVolume;
    masterSFXGain.connect(ctx.destination);

    // Pass the noise buffer and master gain to the generator
    playProceduralSFX(ctx, type, noiseBufferRef.current, masterSFXGain);
  }, [settings.sfxEnabled, settings.sfxVolume]);

  const updateSettings = useCallback((partial: Partial<AudioSettings>) => {
    setSettings(prev => ({ ...prev, ...partial }));
  }, []);

  return { settings, updateSettings, playSFX, initialize, isInitialized };
};