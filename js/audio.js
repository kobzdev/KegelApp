// Audio & Haptic Feedback Manager for Kegel Wellness App
// Uses Web Audio API to create gentle, calming acoustic chimes & tones without external dependencies

class SoundHapticManager {
  constructor() {
    this.audioCtx = null;
    this.soundEnabled = true;
    this.voiceEnabled = false;
    this.hapticEnabled = true;
    this.soundVolume = 0.5;
    this.soundTheme = 'crystal'; // 'crystal' | 'woodblock' | 'bell' | 'soft'
    this.synth = window.speechSynthesis || null;
    this.initUserGesture = false;
  }

  // Initialize AudioContext on first user interaction to comply with browser autoplay policies
  initAudio() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    this.initUserGesture = true;
  }

  setPreferences({ soundEnabled, voiceEnabled, hapticEnabled, soundVolume, soundTheme }) {
    if (soundEnabled !== undefined) this.soundEnabled = soundEnabled;
    if (voiceEnabled !== undefined) this.voiceEnabled = voiceEnabled;
    if (hapticEnabled !== undefined) this.hapticEnabled = hapticEnabled;
    if (soundVolume !== undefined) this.soundVolume = soundVolume;
    if (soundTheme !== undefined) this.soundTheme = soundTheme;
  }

  // Play a gentle frequency tone with ADSR envelope
  playTone(freq, duration = 0.6, type = 'sine', decay = 0.5) {
    if (!this.soundEnabled) return;
    this.initAudio();
    if (!this.audioCtx) return;

    try {
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);

      // ADSR Envelope
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(this.soundVolume * 0.4, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration * decay);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + duration);
    } catch (e) {
      console.warn('Audio tone error:', e);
    }
  }

  // Play pleasant multi-harmonic meditation bell
  playBell(rootFreq = 440, duration = 1.2) {
    if (!this.soundEnabled) return;
    this.initAudio();
    if (!this.audioCtx) return;

    try {
      const now = this.audioCtx.currentTime;
      const harmonics = [1, 2.02, 3.01, 4.2];
      const gains = [0.4, 0.2, 0.1, 0.05];

      harmonics.forEach((h, i) => {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(rootFreq * h, now);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.exponentialRampToValueAtTime(this.soundVolume * gains[i], now + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration * (1 - i * 0.15));

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start(now);
        osc.stop(now + duration);
      });
    } catch (e) {
      console.warn('Bell error:', e);
    }
  }

  // Play Woodblock / Click tone
  playWoodblock(freq = 600) {
    if (!this.soundEnabled) return;
    this.initAudio();
    if (!this.audioCtx) return;

    try {
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.5, now + 0.06);

      gain.gain.setValueAtTime(this.soundVolume * 0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.08);
    } catch (e) {
      console.warn('Woodblock error:', e);
    }
  }

  // Phase sound triggers
  onPhaseStart(phase) {
    // 1. Audio cue based on theme & phase
    switch (phase.toLowerCase()) {
      case 'contract':
        this.triggerVibrate([50, 40, 70]); // Rising pulse
        if (this.soundTheme === 'woodblock') {
          this.playWoodblock(700);
        } else if (this.soundTheme === 'bell') {
          this.playBell(523.25, 1.2); // C5
        } else {
          // Crystal theme default
          this.playTone(523.25, 0.5, 'sine'); // C5
          setTimeout(() => this.playTone(659.25, 0.6, 'sine'), 100); // E5
        }
        this.speak('Gently contract');
        break;

      case 'hold':
        this.triggerVibrate([40]);
        if (this.soundTheme === 'woodblock') {
          this.playWoodblock(600);
        } else if (this.soundTheme === 'bell') {
          this.playBell(587.33, 1.0); // D5
        } else {
          this.playTone(587.33, 0.4, 'sine');
        }
        this.speak('Hold gently');
        break;

      case 'relax':
        this.triggerVibrate([80, 50, 40]); // Falling gentle pulse
        if (this.soundTheme === 'woodblock') {
          this.playWoodblock(450);
        } else if (this.soundTheme === 'bell') {
          this.playBell(392.00, 1.5); // G4
        } else {
          this.playTone(659.25, 0.4, 'sine'); // E5
          setTimeout(() => this.playTone(523.25, 0.7, 'sine'), 120); // C5
        }
        this.speak('Relax and let go');
        break;

      case 'rest':
        this.triggerVibrate([30, 30, 30]);
        if (this.soundTheme === 'woodblock') {
          this.playWoodblock(350);
        } else {
          this.playTone(392.00, 0.8, 'sine'); // G4
        }
        this.speak('Rest and breathe normally');
        break;

      default:
        this.playTone(440, 0.3);
    }
  }

  // Session completion fanfare / gentle harp chord
  onSessionComplete() {
    this.triggerVibrate([100, 50, 100, 50, 200]);
    if (!this.soundEnabled) return;
    this.initAudio();

    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playBell(freq, 1.8);
      }, idx * 180);
    });

    this.speak('Session complete! Great job taking care of your wellness today.');
  }

  // Countdown tick for last 3 seconds
  onTick(secondsLeft) {
    if (!this.soundEnabled || secondsLeft > 3 || secondsLeft <= 0) return;
    this.playTone(880, 0.08, 'sine', 0.2);
    if (this.hapticEnabled) {
      this.triggerVibrate([15]);
    }
  }

  // Trigger browser haptics
  triggerVibrate(pattern) {
    if (!this.hapticEnabled) return;
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {
        // Safe fallback
      }
    }
  }

  // Voice narration cue using Web Speech API
  speak(text) {
    if (!this.voiceEnabled || !this.synth) return;
    try {
      this.synth.cancel(); // cancel previous unfinished speech
      const utter = new SpeechSynthesisUtterance(text);
      utter.rate = 0.95;
      utter.pitch = 1.05;
      utter.volume = this.soundVolume;
      this.synth.speak(utter);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
    }
  }
}

// Export singleton
window.soundManager = new SoundHapticManager();
