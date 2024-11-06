import confetti from 'canvas-confetti';

export function triggerConfetti() {
  const end = Date.now() + 1000;
  const colors = ['#FFD700', '#FFA500', '#FF69B4', '#4B0082'];

  (function frame() {
    confetti({
      particleCount: 4,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: colors
    });
    confetti({
      particleCount: 4,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: colors
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  }());
}