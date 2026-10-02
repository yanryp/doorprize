import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Expand, Gift, Loader2, Users } from 'lucide-react';
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
import { BrandLogo } from '@/components/BrandLogo';
import { WinnerCards } from '@/components/WinnerCards';
import { api } from '@/lib/api';
import { triggerConfetti } from '@/lib/confetti';
import { toast } from '@/hooks/use-toast';
import { errorMessage, formatDate } from '@/lib/utils';
import type { Draw, SessionDetail } from '@/types';

type Phase = 'loading' | 'ready' | 'rolling' | 'revealing' | 'done';

const ROLL_MS = 6000;
const REVEAL_INTERVAL_MS = 900;

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
  const [reelName, setReelName] = useState<{ name: string; unit: string } | null>(null);
  const audio = useRef<HTMLAudioElement | null>(null);

  const load = useCallback(async () => {
    try {
      const detail = await api.session(sessionId);
      setSession(detail);
      if (detail.draw_id) {
        const existing = await api.draw(sessionId);
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

  const attendees = useMemo(() => session?.attendees ?? [], [session]);
  const maxWinners = eligible ?? attendees.length;
  const countValid = winnerCount >= 1 && winnerCount <= maxWinners;

  const startDraw = async () => {
    setConfirming(false);
    setPhase('rolling');
    try {
      audio.current = new Audio('/drumroll.mp3');
      audio.current.loop = true;
      await audio.current.play();
    } catch {
      /* audio is optional */
    }

    const drawRequest = api.runDraw(sessionId, winnerCount, excludeWeeks);
    // Fixed-length reel regardless of participant count; slows down towards the end.
    const started = performance.now();
    while (performance.now() - started < ROLL_MS) {
      const progress = (performance.now() - started) / ROLL_MS;
      setReelName(attendees[Math.floor(Math.random() * attendees.length)]);
      await sleep(40 + progress * progress * 260);
    }

    try {
      const result = await drawRequest;
      audio.current?.pause();
      setDraw(result);
      setPhase('revealing');
      for (let i = 1; i <= result.winners.length; i++) {
        setRevealed(i);
        triggerConfetti();
        await sleep(REVEAL_INTERVAL_MS);
      }
      setPhase('done');
    } catch (err) {
      audio.current?.pause();
      toast({ title: 'Undian gagal', description: errorMessage(err), variant: 'destructive' });
      await load();
      setPhase((p) => (p === 'rolling' ? 'ready' : p));
    }
  };

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen().catch(() => undefined);
  };

  const cards = (draw?.winners ?? [])
    .slice(0, revealed)
    .map((w) => ({ id: w.rank, name: w.name, unit: w.unit }));

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(ellipse_at_top,_#1e3a8a_0%,_#0f172a_55%,_#020617_100%)] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(251,191,36,0.08)_1px,_transparent_1px)] bg-[length:28px_28px]" />

      <BrandLogo className="absolute left-6 top-5 z-10 h-14 w-auto opacity-90 lg:h-16" />

      <button
        onClick={toggleFullscreen}
        className="absolute right-4 top-4 z-20 rounded-md p-2 text-white/40 transition hover:bg-white/10 hover:text-white"
        title="Layar penuh (F11)"
      >
        <Expand className="h-5 w-5" />
      </button>

      <div className="relative flex min-h-screen flex-col px-6 py-8">
        <header className="text-center">
          <h1 className="flex items-center justify-center gap-4 text-5xl font-bold tracking-tight text-amber-300 lg:text-7xl">
            <Gift className="h-12 w-12 lg:h-16 lg:w-16" />
            Doorprize
          </h1>
          {session && (
            <p className="mt-3 text-xl text-blue-100/80 lg:text-2xl">
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
                <p className="mt-2 text-2xl text-blue-100/80">jemaat terdaftar</p>
              </div>
              <Button
                size="lg"
                disabled={!countValid}
                onClick={() => setConfirming(true)}
                className="h-auto rounded-full bg-gradient-to-r from-amber-400 to-amber-600 px-16 py-6 text-3xl font-semibold text-slate-900 shadow-[0_0_40px_rgba(251,191,36,0.35)] hover:from-amber-300 hover:to-amber-500"
              >
                Mulai Undian
              </Button>
            </motion.div>
          )}

          {phase === 'rolling' && reelName && (
            <div className="w-full max-w-4xl text-center">
              <p className="mb-6 text-2xl uppercase tracking-[0.3em] text-amber-300/80">Mengundi…</p>
              <div className="rounded-2xl border border-amber-300/40 bg-white/5 px-8 py-12 shadow-[0_0_60px_rgba(251,191,36,0.15)] backdrop-blur">
                <motion.div
                  key={`${reelName.name}-${reelName.unit}`}
                  initial={{ y: 24, opacity: 0.2 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.08 }}
                >
                  <div className="truncate text-6xl font-bold lg:text-7xl">{reelName.name}</div>
                  <div className="mt-3 text-3xl text-amber-200/80">{reelName.unit}</div>
                </motion.div>
              </div>
            </div>
          )}

          {(phase === 'revealing' || phase === 'done') && (
            <div className="w-full">
              <p className="mb-2 text-center text-2xl text-amber-200/90">
                Selamat kepada {draw?.winners.length === 1 ? 'pemenang' : `${draw?.winners.length} pemenang`}!
              </p>
              <WinnerCards winners={cards} />
              {phase === 'done' && (
                <p className="mt-2 text-center text-lg text-blue-100/60">
                  Hadiah diambil hari ini; bila pemenang tidak hadir, hadiah hangus.
                </p>
              )}
            </div>
          )}
        </main>

        {phase === 'ready' && (
          <footer className="mx-auto flex flex-wrap items-center justify-center gap-6 rounded-xl bg-white/5 px-6 py-3 text-sm text-blue-100/80">
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
                className="h-8 rounded-md border border-white/20 bg-slate-800 px-2 text-white"
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
