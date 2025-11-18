
class AudioService {
  private ctx: AudioContext | null = null;
  private enabled: boolean = false;

  constructor() {
    // Lazy initialization on first user interaction
  }

  public init() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContextClass();
      this.enabled = true;
    } else if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  private playTone(freq: number, type: OscillatorType, duration: number, vol: number = 0.1, slideTo?: number, startTime: number = 0) {
    if (!this.ctx || !this.enabled) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime + startTime);
    if (slideTo) {
      osc.frequency.linearRampToValueAtTime(slideTo, this.ctx.currentTime + startTime + duration);
    }

    gain.gain.setValueAtTime(vol, this.ctx.currentTime + startTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + startTime + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(this.ctx.currentTime + startTime);
    osc.stop(this.ctx.currentTime + startTime + duration);
  }

  public playJump() {
    this.playTone(150, 'square', 0.3, 0.1, 300);
  }

  public playCoin() {
    if (!this.ctx) return;
    this.playTone(987, 'square', 0.1, 0.1);
    setTimeout(() => this.playTone(1318, 'square', 0.2, 0.1), 50);
  }

  public playBump() {
    this.playTone(150, 'triangle', 0.1, 0.15, 50);
  }

  public playBreak() {
    this.playTone(100, 'sawtooth', 0.1, 0.1);
  }

  public playStomp() {
    this.playTone(300, 'sawtooth', 0.1, 0.1, 50);
  }

  public playFireball() {
    this.playTone(400, 'triangle', 0.1, 0.1, 200);
  }

  public playKick() {
     this.playTone(100, 'square', 0.1, 0.1);
  }

  public playPowerUpAppear() {
    if (!this.ctx) return;
    let t = 0;
    [392, 440, 494, 523, 587].forEach((f) => {
        this.playTone(f, 'triangle', 0.1, 0.1, undefined, t);
        t += 0.08;
    });
  }

  public playPowerUp() {
     if (!this.ctx) return;
     let t = 0;
     // Arpeggio up
     [300, 500, 800, 1000, 1300].forEach((f, i) => {
         this.playTone(f, 'sine', 0.15, 0.1, f + 100, t);
         t += 0.08;
     });
  }

  public playFlagSlide() {
    this.playTone(400, 'square', 0.5, 0.1, 100);
  }

  public playDie() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const t = (f: number, d: number, offset: number) => {
       const osc = this.ctx!.createOscillator();
       const gain = this.ctx!.createGain();
       osc.type = 'square';
       osc.frequency.value = f;
       gain.gain.value = 0.15;
       gain.gain.exponentialRampToValueAtTime(0.01, now + offset + d);
       osc.connect(gain);
       gain.connect(this.ctx!.destination);
       osc.start(now + offset);
       osc.stop(now + offset + d);
    };

    t(400, 0.1, 0);
    t(300, 0.1, 0.15);
    t(250, 0.4, 0.3);
  }

  public playVictory() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const t = (f: number, offset: number) => {
       const osc = this.ctx!.createOscillator();
       const gain = this.ctx!.createGain();
       osc.type = 'square';
       osc.frequency.value = f;
       gain.gain.value = 0.1;
       osc.connect(gain);
       gain.connect(this.ctx!.destination);
       osc.start(now + offset);
       osc.stop(now + offset + 0.1);
    };
    
    t(659, 0);
    t(783, 0.1);
    t(987, 0.2);
    t(783, 0.3);
    t(987, 0.4);
    t(1318, 0.5);
  }
}

export const audioService = new AudioService();