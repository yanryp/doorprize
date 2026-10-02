import confetti from 'canvas-confetti';

// Palette for the sky-blue theme: gold, white, light and deep blue.
const COLORS = ['#fcd34d', '#f59e0b', '#fde68a', '#ffffff', '#bae6fd', '#1e40af'];
const GOLD = ['#fcd34d', '#f59e0b', '#fde68a', '#fffbeb'];

/** Side cannons from both bottom corners. */
export function triggerConfetti(durationMs = 1200) {
  const end = Date.now() + durationMs;
  (function frame() {
    confetti({ particleCount: 6, angle: 60, spread: 60, startVelocity: 65, origin: { x: 0, y: 1 }, colors: COLORS });
    confetti({ particleCount: 6, angle: 120, spread: 60, startVelocity: 65, origin: { x: 1, y: 1 }, colors: COLORS });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}

/** A few firework bursts at random spots in the upper half of the screen. */
export function fireworks(bursts = 3, spacingMs = 280) {
  for (let i = 0; i < bursts; i++) {
    window.setTimeout(() => {
      const origin = { x: 0.15 + Math.random() * 0.7, y: 0.15 + Math.random() * 0.3 };
      confetti({
        particleCount: 90,
        spread: 360,
        startVelocity: 32,
        gravity: 0.8,
        ticks: 140,
        scalar: 0.9,
        shapes: ['circle'],
        origin,
        colors: COLORS,
      });
    }, i * spacingMs);
  }
}

/** Gold rain falling from the top. */
export function goldRain(durationMs = 1500) {
  const end = Date.now() + durationMs;
  (function frame() {
    confetti({
      particleCount: 4,
      angle: 270,
      spread: 180,
      startVelocity: 8,
      gravity: 0.6,
      ticks: 300,
      origin: { x: Math.random(), y: -0.05 },
      colors: GOLD,
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}

/** Gentle never-ending confetti for the final screen. Returns a stop function. */
export function startCelebration(): () => void {
  const timer = window.setInterval(() => {
    confetti({
      particleCount: 3,
      angle: 270,
      spread: 120,
      startVelocity: 4,
      gravity: 0.35,
      drift: Math.random() - 0.5,
      ticks: 500,
      scalar: 1.1,
      origin: { x: Math.random(), y: -0.05 },
      colors: COLORS,
    });
  }, 180);
  const burst = window.setInterval(() => fireworks(1), 6000);
  return () => {
    window.clearInterval(timer);
    window.clearInterval(burst);
  };
}
