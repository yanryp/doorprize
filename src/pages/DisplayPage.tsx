import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Expand, Gift, Loader2, Sparkles, Trophy, Users, Volume2, VolumeX } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AnimatedBrandLogo } from '@/components/BrandLogo';
import { WinnerCards } from '@/components/WinnerCards';
import { api } from '@/lib/api';
import { fireworks, goldRain, startCelebration, triggerConfetti } from '@/lib/confetti';
import { sfx } from '@/lib/sound';
import { toast } from '@/hooks/use-toast';
import { errorMessage, formatDate } from '@/lib/utils';
import type { Draw, SessionDetail } from '@/types';

type Phase = 'loading' | 'ready' | 'rolling' | 'revealing' | 'done';

interface Spot {
  name: string;
  unit: string;
  rank?: number;
  stopped: boolean;
}

/** Opening reel, independent of participant count. */
const ROLL_MS = 6000;
/** Short reel before each winner after the first. */
const MINI_ROLL_MS = 1000;
/** How long each winner stays in the spotlight. */
const SPOTLIGHT_MS = 1700;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface DisplayPageProps {
  sessionId: number;
}

export function DisplayPage({ sessionId }: DisplayPageProps) {
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [draw, setDraw] = useState<Draw | null>(null);
  const [phase, setPhase] = useState<Phase>('loading');
  const [revealed, setRevealed] = useState(0);
  const [winnerCount, setWinnerCount] = useState(5);
  const [excludeWeeks, setExcludeWeeks] = useState(0);
  const [eligible, setEligible] = useState<number | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [spot, setSpot] = useState<Spot | null>(null);
  const [muted, setMuted] = useState(sfx.muted);
  const animating = useRef(false);

  const load = useCallback(async () => {
    try {
      const detail = await api.session(sessionId);
      if (animating.current) return;
      setSession(detail);
      if (detail.draw_id) {
        const existing = await api.draw(sessionId);
        if (animating.current) return;
        setDraw(existing);
        setRevealed(existing.winners.length);
        setPhase('done');
      } else {
        setPhase((p) => (p === 'loading' ? 'ready' : p));
      }
    } catch (err) {
      toast({ title: 'Gagal memuat sesi', description: errorMessage(err), variant: 'destructive' });
    }
  }, [sessionId]);

  useEffect(() => {
    load();
  }, [load]);

  // Keep the participant count live while the operator is still importing.
  useEffect(() => {
    if (phase !== 'ready') return;
    const timer = setInterval(load, 5000);
    return () => clearInterval(timer);
  }, [phase, load]);

  useEffect(() => {
    if (phase !== 'ready') return;
    api
      .eligibleCount(sessionId, excludeWeeks)
      .then((r) => setEligible(r.eligible_count))
      .catch(() => setEligible(null));
  }, [sessionId, excludeWeeks, phase, session?.attendees.length]);

  // Endless confetti on the final screen.
  useEffect(() => {
    if (phase !== 'done') return;
    return startCelebration();
  }, [phase]);

  const attendees = useMemo(() => session?.attendees ?? [], [session]);
  const maxWinners = eligible ?? attendees.length;
  const countValid = winnerCount >= 1 && winnerCount <= maxWinners;

  /** Cycle random names, slowing down, for `ms` milliseconds. */
  const spin = async (ms: number, minDelay: number, maxDelay: number) => {
    const started = performance.now();
    while (performance.now() - started < ms) {
      const progress = (performance.now() - started) / ms;
      const pick = attendees[Math.floor(Math.random() * attendees.length)];
      setSpot({ name: pick.name, unit: pick.unit, stopped: false });
      sfx.tick();
      await sleep(minDelay + progress * progress * (maxDelay - minDelay));
    }
  };

  const celebrate = () => {
    sfx.tada();
    sfx.firework(0.3);
    fireworks(3);
    goldRain(1500);
    triggerConfetti(900);
  };

  const startDraw = async () => {
    setConfirming(false);
    sfx.unlock();
    animating.current = true;
    setPhase('rolling');
    sfx.startDrumroll();

    const drawRequest = api.runDraw(sessionId, winnerCount, excludeWeeks);
    await spin(ROLL_MS, 40, 300);

    let result: Draw;
    try {
      result = await drawRequest;
    } catch (err) {
      sfx.stopDrumroll(false);
      animating.current = false;
      toast({ title: 'Undian gagal', description: errorMessage(err), variant: 'destructive' });
      setPhase('ready');
      await load();
      return;
    }

    setDraw(result);
    setPhase('revealing');
    for (const [i, winner] of result.winners.entries()) {
      if (i > 0) await spin(MINI_ROLL_MS, 45, 220);
      if (i === 0) sfx.stopDrumroll();
      setSpot({ name: winner.name, unit: winner.unit, rank: winner.rank, stopped: true });
      celebrate();
      await sleep(SPOTLIGHT_MS);
      setRevealed(i + 1);
    }
    animating.current = false;
    setSpot(null);
    setPhase('done');
    sfx.firework();
    fireworks(5, 200);
  };

  const toggleMute = () => {
    sfx.setMuted(!muted);
    setMuted(!muted);
  };

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen().catch(() => undefined);
  };

  const winners = draw?.winners ?? [];
  const cards = winners.slice(0, revealed).map((w) => ({ id: w.rank, name: w.name, unit: w.unit }));
  const showBeams = phase === 'rolling' || phase === 'revealing' || phase === 'done';

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(ellipse_at_top,_#0ea5e9_0%,_#0369a1_45%,_#0c4a6e_100%)] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.10)_1px,_transparent_1px)] bg-[length:28px_28px]" />
      {showBeams && <SpotlightBeams intense={phase !== 'done'} />}

      <div className="absolute right-8 top-6 z-10">
        <AnimatedBrandLogo className="h-14 lg:h-20" />
      </div>

      <div className="absolute bottom-4 right-4 z-20 flex gap-1">
        <button
          onClick={toggleMute}
          className="rounded-md p-2 text-white/40 transition hover:bg-white/10 hover:text-white"
          title={muted ? 'Nyalakan suara' : 'Matikan suara'}
        >
          {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </button>
        <button
          onClick={toggleFullscreen}
          className="rounded-md p-2 text-white/40 transition hover:bg-white/10 hover:text-white"
          title="Layar penuh (F11)"
        >
          <Expand className="h-5 w-5" />
        </button>
      </div>

      <div className="relative flex min-h-screen flex-col px-6 py-8">
        <header className="text-center">
          <motion.h1
            className="flex items-center justify-center gap-4 text-5xl font-bold tracking-tight lg:text-7xl"
            animate={{ color: ['#fcd34d', '#fde68a', '#f59e0b', '#fcd34d'] }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            <motion.span
              animate={{ rotate: [0, -12, 12, -8, 8, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 1.5 }}
            >
              <Gift className="h-12 w-12 lg:h-16 lg:w-16" />
            </motion.span>
            Doorprize
            <motion.span
              animate={{ rotate: [0, 12, -12, 8, -8, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 1.5 }}
            >
              <Trophy className="h-12 w-12 lg:h-16 lg:w-16" />
            </motion.span>
          </motion.h1>
          {session && (
            <p className="mt-3 text-xl text-sky-50/90 lg:text-2xl">
              {session.title} · {formatDate(session.date)}
            </p>
          )}
        </header>

        <main className="flex flex-1 flex-col items-center justify-center">
          {phase === 'loading' && <Loader2 className="h-10 w-10 animate-spin text-white/60" />}

          {phase === 'ready' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-10"
            >
              <div className="text-center">
                <div className="flex items-center justify-center gap-4 text-8xl font-bold tabular-nums lg:text-9xl">
                  <Users className="h-20 w-20 text-amber-300/80" />
                  {attendees.length}
                </div>
                <p className="mt-2 text-2xl text-sky-50/90">jemaat terdaftar</p>
              </div>
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Button
                  size="lg"
                  disabled={!countValid}
                  onClick={() => setConfirming(true)}
                  className="h-auto rounded-full bg-gradient-to-r from-amber-400 to-amber-600 px-16 py-6 text-3xl font-semibold text-slate-900 shadow-[0_0_50px_rgba(251,191,36,0.45)] hover:from-amber-300 hover:to-amber-500"
                >
                  Mulai Undian
                </Button>
              </motion.div>
            </motion.div>
          )}

          {(phase === 'rolling' || phase === 'revealing') && spot && (
            <div className="flex w-full flex-col items-center">
              <SpotlightName spot={spot} total={winners.length} />
              {phase === 'revealing' && cards.length > 0 && <HallOfFame cards={cards} />}
            </div>
          )}

          {phase === 'done' && (
            <div className="w-full">
              <motion.p
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', bounce: 0.5 }}
                className="mb-2 flex items-center justify-center gap-3 text-center text-3xl font-semibold text-amber-200 lg:text-4xl"
              >
                <Sparkles className="h-8 w-8" />
                Selamat kepada {winners.length === 1 ? 'pemenang' : `${winners.length} pemenang`}!
                <Sparkles className="h-8 w-8" />
              </motion.p>
              <WinnerCards winners={cards} />
              <p className="mt-2 text-center text-lg text-sky-50/80">
                Pemenang dipersilakan maju mengambil hadiah sekarang. Bila tidak hadir, hadiah hangus.
              </p>
            </div>
          )}
        </main>

        {phase === 'ready' && (
          <footer className="mx-auto flex flex-wrap items-center justify-center gap-6 rounded-xl bg-sky-950/40 px-6 py-3 text-sm text-sky-50/90">
            <label className="flex items-center gap-2">
              Jumlah pemenang
              <Input
                type="number"
                min={1}
                max={maxWinners}
                value={winnerCount}
                onChange={(e) => setWinnerCount(Number(e.target.value))}
                className="h-8 w-20 border-white/20 bg-white/10 text-white"
              />
            </label>
            <label className="flex items-center gap-2">
              Kecualikan pemenang
              <select
                value={excludeWeeks}
                onChange={(e) => setExcludeWeeks(Number(e.target.value))}
                className="h-8 rounded-md border border-white/20 bg-sky-900 px-2 text-white"
              >
                <option value={0}>— tidak —</option>
                {[1, 2, 4, 8, 12].map((w) => (
                  <option key={w} value={w}>
                    {w} minggu terakhir
                  </option>
                ))}
              </select>
            </label>
            {eligible !== null && eligible !== attendees.length && (
              <span>{eligible} peserta memenuhi syarat</span>
            )}
            {!countValid && <span className="text-rose-300">Jumlah pemenang 1–{maxWinners}</span>}
          </footer>
        )}
      </div>

      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mulai undian sekarang?</AlertDialogTitle>
            <AlertDialogDescription>
              {winnerCount} pemenang akan diundi dari {maxWinners} peserta. Undian hanya dapat dilakukan
              satu kali untuk sesi ini dan daftar peserta akan dikunci.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={startDraw}>Ya, mulai</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/** Stage lights sweeping from the top corners. */
function SpotlightBeams({ intense }: { intense: boolean }) {
  const beam = (origin: 'left' | 'right', delay: number) => (
    <motion.div
      className="pointer-events-none absolute top-[-20%] h-[140%] w-[140%]"
      style={{
        [origin]: '-20%',
        transformOrigin: `${origin === 'left' ? '20%' : '80%'} 0%`,
        background: `conic-gradient(from 180deg at ${origin === 'left' ? '20%' : '80%'} 0%, transparent 0deg, rgba(224,242,254,${intense ? 0.30 : 0.15}) 8deg, transparent 16deg)`,
      }}
      animate={{ rotate: origin === 'left' ? [-25, 20, -25] : [25, -20, 25] }}
      transition={{ duration: intense ? 3.5 : 7, repeat: Infinity, ease: 'easeInOut', delay }}
    />
  );
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden mix-blend-screen">
      {beam('left', 0)}
      {beam('right', 0.6)}
    </div>
  );
}

/** Big centre card: spinning names, then the winner with a shake and glow. */
function SpotlightName({ spot, total }: { spot: Spot; total: number }) {
  return (
    <div className="w-full max-w-5xl text-center">
      <div className="mb-6 h-10 text-2xl uppercase tracking-[0.3em] text-amber-300/90 lg:text-3xl">
        {spot.stopped && spot.rank ? (
          <motion.span
            key={`label-${spot.rank}`}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Pemenang ke-{spot.rank}
            {total > 1 && <span className="text-amber-300/50"> / {total}</span>}
          </motion.span>
        ) : (
          <motion.span animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 0.8, repeat: Infinity }}>
            Mengundi…
          </motion.span>
        )}
      </div>
      <motion.div
        key={spot.stopped ? `win-${spot.rank}` : 'reel'}
        className={`relative rounded-2xl border px-8 py-12 backdrop-blur ${
          spot.stopped
            ? 'border-amber-300 bg-gradient-to-br from-sky-700/95 via-sky-800/95 to-sky-950/95 shadow-[0_0_80px_rgba(251,191,36,0.55)]'
            : 'border-white/40 bg-sky-950/30 shadow-[0_0_60px_rgba(251,191,36,0.15)]'
        }`}
        animate={
          spot.stopped
            ? { x: [0, -14, 14, -10, 10, -5, 5, 0], scale: [1, 1.12, 1.04] }
            : { x: 0, scale: 1 }
        }
        transition={{ duration: 0.6 }}
      >
        <motion.div
          key={`${spot.name}-${spot.unit}-${spot.stopped}`}
          initial={spot.stopped ? { scale: 0.6, opacity: 0 } : { y: 24, opacity: 0.2 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          transition={{ duration: spot.stopped ? 0.35 : 0.08 }}
        >
          <div
            className={`truncate font-bold ${
              spot.stopped ? 'text-7xl text-amber-200 lg:text-8xl' : 'text-6xl text-white/90 lg:text-7xl'
            }`}
            style={spot.stopped ? { filter: 'drop-shadow(0 0 18px rgba(251,191,36,0.75))' } : undefined}
          >
            {spot.name}
          </div>
          <div className="mt-3 text-3xl text-amber-100/80 lg:text-4xl">{spot.unit}</div>
        </motion.div>
      </motion.div>
    </div>
  );
}

/** Winners revealed so far, collected under the spotlight. */
function HallOfFame({ cards }: { cards: { id: number; name: string; unit: string }[] }) {
  return (
    <div className="mt-10 flex max-w-6xl flex-wrap justify-center gap-3">
      <AnimatePresence>
        {cards.map((c) => (
          <motion.div
            key={c.id}
            initial={{ y: -120, scale: 1.4, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            transition={{ type: 'spring', bounce: 0.45, duration: 0.7 }}
            className="rounded-xl border border-amber-300/70 bg-gradient-to-br from-sky-700/95 via-sky-800/95 to-sky-950/95 px-5 py-3 text-center shadow-[0_0_20px_rgba(251,191,36,0.25)]"
          >
            <div className="text-xs text-amber-300/80">#{c.id}</div>
            <div className="font-semibold text-amber-100">{c.name}</div>
            <div className="text-xs text-sky-100/80">{c.unit}</div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
