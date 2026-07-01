/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export class CafeAmbientGenerator {
  private ctx: AudioContext | null = null;
  private noiseNode: AudioBufferSourceNode | null = null;
  private lowHumOsc: OscillatorNode | null = null;
  private masterGain: GainNode | null = null;
  private intervalId: any = null;
  private isPlaying: boolean = false;

  constructor() {}

  private handleInteraction = () => {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume()
          .then(() => {
            console.log('Cafe Ambient: Resumed audio context successfully on user gesture.');
          })
          .catch((err) => {
            console.warn('Cafe Ambient: Failed to auto-resume context.', err);
          });
      }
    }
  };

  public start() {
    if (this.isPlaying) return;

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) {
        console.warn('Web Audio API is not supported in this browser.');
        return;
      }

      const context = new AudioContextClass();
      this.ctx = context;

      // Master volume node
      const masterGain = context.createGain();
      masterGain.gain.setValueAtTime(0.55, context.currentTime); // Perfect volume level for ambient presence
      masterGain.connect(context.destination);
      this.masterGain = masterGain;

      // Force resume immediately in case it was triggered during a button click
      if (context.state === 'suspended') {
        context.resume().catch(() => {});
      }

      // Add auto-resume listeners for safe browser gesture handling
      window.addEventListener('click', this.handleInteraction, { passive: true });
      window.addEventListener('touchstart', this.handleInteraction, { passive: true });
      window.addEventListener('keydown', this.handleInteraction, { passive: true });
      document.body.addEventListener('click', this.handleInteraction, { passive: true });

      // --- 1. Brownian Noise (Distanced Crowd/Chatter Ambient Hum) ---
      const bufferSize = context.sampleRate * 2; // 2-second loop
      const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
      const data = buffer.getChannelData(0);
      let lastOut = 0.0;

      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        // Brownian noise filter approximation
        lastOut = (lastOut + (0.02 * white)) / 1.02;
        data[i] = lastOut * 4.5; // Scale to be rich but pleasant
      }

      const noiseSource = context.createBufferSource();
      noiseSource.buffer = buffer;
      noiseSource.loop = true;

      // Low-pass filter to sound muffled and distanced like cozy background murmur
      const filterNode = context.createBiquadFilter();
      filterNode.type = 'lowpass';
      filterNode.frequency.setValueAtTime(380, context.currentTime); // Elevated frequency to allow pleasant chatter frequencies through

      // Slow amplitude modulation to simulate organic rising and falling of speech / movement
      const ampModLfo = context.createOscillator();
      ampModLfo.type = 'sine';
      ampModLfo.frequency.setValueAtTime(0.08, context.currentTime); // Very slow cycle (12.5 seconds)

      const ampModGain = context.createGain();
      ampModGain.gain.setValueAtTime(0.02, context.currentTime);

      // Connect noise
      const noiseGain = context.createGain();
      noiseGain.gain.setValueAtTime(0.18, context.currentTime); // Raised for audible cozy coffeehouse background hum

      noiseSource.connect(filterNode);
      filterNode.connect(noiseGain);
      noiseGain.connect(masterGain);

      noiseSource.start();
      ampModLfo.start();
      this.noiseNode = noiseSource;

      // --- 2. Low Espresso Machine / Refrigerator Motor Hum ---
      const humOsc = context.createOscillator();
      humOsc.type = 'sine';
      humOsc.frequency.setValueAtTime(65, context.currentTime); // 65 Hz electrical hum

      const humGain = context.createGain();
      humGain.gain.setValueAtTime(0.045, context.currentTime); // Raised for standard speaker playback

      humOsc.connect(humGain);
      humGain.connect(masterGain);
      humOsc.start();
      this.lowHumOsc = humOsc;

      // --- 3. Coffe Cup & Spoon Clinks Scheduler ---
      this.isPlaying = true;

      const scheduleClink = () => {
        if (!this.isPlaying || !this.ctx || !this.masterGain) return;

        try {
          const osc = this.ctx.createOscillator();
          const panner = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;
          const clinkGain = this.ctx.createGain();

          const metallicFreqs = [1850, 2100, 2350, 2600, 2900];
          const randomFreq = metallicFreqs[Math.floor(Math.random() * metallicFreqs.length)] + (Math.random() * 80 - 40);

          osc.type = 'sine';
          osc.frequency.setValueAtTime(randomFreq, this.ctx.currentTime);

          const now = this.ctx.currentTime;
          clinkGain.gain.setValueAtTime(0, now);

          // Raised clinks volume levels so they sound highly realistic
          const volume = 0.035 + Math.random() * 0.055;
          clinkGain.gain.linearRampToValueAtTime(volume, now + 0.004);
          clinkGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06 + Math.random() * 0.12);

          // Pan clinks subtly to left or right if panning is supported
          if (panner) {
            const panVal = Math.random() * 1.6 - 0.8; // -0.8 to 0.8
            panner.pan.setValueAtTime(panVal, now);
            osc.connect(panner);
            panner.connect(clinkGain);
          } else {
            osc.connect(clinkGain);
          }

          clinkGain.connect(this.masterGain);

          osc.start();
          osc.stop(now + 0.3);
        } catch (err) {
          console.debug('Error in cafe clink sound scheduling', err);
        }

        // Schedule next random cup clink
        const nextDelay = 3500 + Math.random() * 8500; // Over 3.5 to 12 seconds
        this.intervalId = setTimeout(scheduleClink, nextDelay);
      };

      // Start the clinking interval
      this.intervalId = setTimeout(scheduleClink, 1500);

    } catch (e) {
      console.error('Failed to initialize Cafe Ambient:', e);
      this.isPlaying = false;
    }
  }

  public stop() {
    this.isPlaying = false;

    // Clean up auto-resume listeners
    window.removeEventListener('click', this.handleInteraction);
    window.removeEventListener('touchstart', this.handleInteraction);
    window.removeEventListener('keydown', this.handleInteraction);

    if (this.intervalId) {
      clearTimeout(this.intervalId);
      this.intervalId = null;
    }

    try {
      if (this.noiseNode) {
        this.noiseNode.stop();
        this.noiseNode.disconnect();
        this.noiseNode = null;
      }
    } catch (e) {}

    try {
      if (this.lowHumOsc) {
        this.lowHumOsc.stop();
        this.lowHumOsc.disconnect();
        this.lowHumOsc = null;
      }
    } catch (e) {}

    if (this.masterGain) {
      try {
        this.masterGain.disconnect();
      } catch (e) {}
      this.masterGain = null;
    }

    if (this.ctx) {
      try {
        this.ctx.close();
      } catch (e) {}
      this.ctx = null;
    }
  }

  public getPlaybackState(): boolean {
    return this.isPlaying;
  }
}
