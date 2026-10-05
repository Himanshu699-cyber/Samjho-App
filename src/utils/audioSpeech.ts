export class SpeechNarrator {
  private static synth: SpeechSynthesis | null =
    typeof window !== 'undefined' && 'speechSynthesis' in window
      ? window.speechSynthesis
      : null;
  private static currentUtterance: SpeechSynthesisUtterance | null = null;

  public static speak(
    text: string,
    language: 'hi' | 'en' = 'hi',
    onStart?: () => void,
    onEnd?: () => void
  ): boolean {
    if (!this.synth) return false;

    this.stop();

    const utterance = new SpeechSynthesisUtterance(text);
    this.currentUtterance = utterance;

    // Pick best voice
    const voices = this.synth.getVoices();
    if (language === 'hi') {
      const hindiVoice = voices.find(
        (v) =>
          v.lang.toLowerCase().includes('hi') ||
          v.name.toLowerCase().includes('hindi') ||
          v.lang.toLowerCase().includes('in')
      );
      if (hindiVoice) {
        utterance.voice = hindiVoice;
        utterance.lang = hindiVoice.lang;
      } else {
        utterance.lang = 'hi-IN';
      }
    } else {
      const enVoice = voices.find(
        (v) => v.lang.toLowerCase().includes('en-in') || v.lang.toLowerCase().includes('en')
      );
      if (enVoice) {
        utterance.voice = enVoice;
        utterance.lang = enVoice.lang;
      } else {
        utterance.lang = 'en-US';
      }
    }

    utterance.rate = 0.95; // Slightly slower for clear understanding
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      onStart?.();
    };

    utterance.onend = () => {
      onEnd?.();
      this.currentUtterance = null;
    };

    utterance.onerror = () => {
      onEnd?.();
      this.currentUtterance = null;
    };

    this.synth.speak(utterance);
    return true;
  }

  public static stop(): void {
    if (this.synth) {
      this.synth.cancel();
      this.currentUtterance = null;
    }
  }

  public static isSpeaking(): boolean {
    return this.synth ? this.synth.speaking : false;
  }
}
