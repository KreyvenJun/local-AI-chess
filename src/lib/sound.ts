// 8-Bit HTML5 Web Audio Synthesizer for Arcade Sounds

let audioCtx: AudioContext | null = null;

function getAudioContext() {
  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return null;
      audioCtx = new AudioContextClass();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  } catch (e) {
    console.warn('AudioContext is blocked or not supported:', e);
    return null;
  }
}

// Generate an 8-bit tone
function playTone(freq: number, duration: number, type: OscillatorType = 'square', slideTo?: number, volume = 0.08) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.type = type; // 'square', 'sawtooth', 'triangle', 'sine'
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    if (slideTo) {
      osc.frequency.exponentialRampToValueAtTime(slideTo, ctx.currentTime + duration);
    }

    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + duration);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    console.error('Audio playback failed', e);
  }
}

export const sfx = {
  // Classic high-pitch move beep
  move: () => {
    playTone(523.25, 0.08, 'triangle', 783.99, 0.1); // C5 -> G5 slide
  },

  // Crunchier sawtooth sound for capture
  capture: () => {
    playTone(392.00, 0.15, 'sawtooth', 130.81, 0.12); // G4 -> C3 crunch slide
  },

  // Severe warning dual-tone for check
  check: () => {
    playTone(220, 0.1, 'square', undefined, 0.15); // A3
    setTimeout(() => {
      playTone(220, 0.2, 'square', 110, 0.15); // A3 -> A2 drop down
    }, 100);
  },

  // Upbeat victorious arpeggio
  win: () => {
    const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // C major arpeggio
    notes.forEach((freq, index) => {
      setTimeout(() => {
        playTone(freq, 0.15, 'square', freq * 1.05, 0.06);
      }, index * 100);
    });
  },

  // Melancholy descending game over sound
  lose: () => {
    const notes = [311.13, 293.66, 277.18, 246.94]; // Eb, D, Db, B
    notes.forEach((freq, index) => {
      setTimeout(() => {
        playTone(freq, 0.25, 'sawtooth', freq * 0.7, 0.08);
      }, index * 200);
    });
  }
};
