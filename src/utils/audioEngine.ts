/**
 * Moteur Audio Procédural Web Audio API pour la turbine/moteur connecté
 * Génère un son réaliste d'entraînement électro-mécanique sans aucun fichier audio externe.
 */

class AudioEngine {
  private ctx: AudioContext | null = null;
  private osc1: OscillatorNode | null = null;
  private osc2: OscillatorNode | null = null;
  private noiseNode: AudioBufferSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private filterNode: BiquadFilterNode | null = null;
  private isMuted: boolean = true;
  private isRunning: boolean = false;

  public init() {
    if (this.ctx) return;
    try {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtxClass();
      
      this.gainNode = this.ctx.createGain();
      this.gainNode.gain.setValueAtTime(0, this.ctx.currentTime);

      this.filterNode = this.ctx.createBiquadFilter();
      this.filterNode.type = 'lowpass';
      this.filterNode.frequency.setValueAtTime(450, this.ctx.currentTime);
      this.filterNode.Q.setValueAtTime(3, this.ctx.currentTime);

      this.osc1 = this.ctx.createOscillator();
      this.osc1.type = 'sawtooth';
      this.osc1.frequency.setValueAtTime(50, this.ctx.currentTime);

      this.osc2 = this.ctx.createOscillator();
      this.osc2.type = 'sine';
      this.osc2.frequency.setValueAtTime(100, this.ctx.currentTime);

      // Routing
      this.osc1.connect(this.filterNode);
      this.osc2.connect(this.filterNode);
      this.filterNode.connect(this.gainNode);
      this.gainNode.connect(this.ctx.destination);

      this.osc1.start();
      this.osc2.start();
      this.isRunning = true;
    } catch {
      // AudioContext non supporté ou bloqué par autoplay policy
    }
  }

  public updateRpm(rpm: number, powerOn: boolean) {
    if (!this.ctx || !this.isRunning || !this.gainNode || !this.osc1 || !this.osc2 || !this.filterNode) return;

    if (!powerOn || rpm < 20 || this.isMuted) {
      this.gainNode.gain.setTargetAtTime(0, this.ctx.currentTime, 0.15);
      return;
    }

    // Calcul de la fréquence fondamentale (Pole pairs & RPM)
    const baseFreq = Math.max(25, (rpm / 60) * 1.5);
    const harmonicFreq = baseFreq * 2;
    const filterFreq = Math.min(2200, 200 + (rpm / 6000) * 1400);

    const now = this.ctx.currentTime;
    this.osc1.frequency.setTargetAtTime(baseFreq, now, 0.1);
    this.osc2.frequency.setTargetAtTime(harmonicFreq, now, 0.1);
    this.filterNode.frequency.setTargetAtTime(filterFreq, now, 0.1);

    // Volume subtil et progressif
    const targetVolume = Math.min(0.08, 0.015 + (rpm / 6000) * 0.05);
    this.gainNode.gain.setTargetAtTime(targetVolume, now, 0.1);
  }

  public toggleMute(): boolean {
    if (!this.ctx) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    this.isMuted = !this.isMuted;
    if (this.isMuted && this.gainNode && this.ctx) {
      this.gainNode.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
    }
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }
}

export const audioEngine = new AudioEngine();
