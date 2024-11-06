import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Trophy, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { WinnerSelection } from '@/components/WinnerSelection';
import { ParticipantGrid } from '@/components/ParticipantGrid';
import { WinnerCards } from '@/components/WinnerCards';
import { ExportButton } from '@/components/ExportButton';
import { CSVImport } from '@/components/CSVImport';
import { ParticipantAnalytics } from '@/components/ParticipantAnalytics';
import { triggerConfetti } from '@/lib/confetti';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import type { Participant } from '@/types';

interface DisplayPageProps {
  participants: Participant[];
  onImportParticipants: (participants: Participant[], merge?: boolean) => void;
  onClearParticipants: () => void;
}

export function DisplayPage({ 
  participants, 
  onImportParticipants, 
  onClearParticipants 
}: DisplayPageProps) {
  const [winners, setWinners] = useState<Participant[]>([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [prizeCount, setPrizeCount] = useState(3);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [sweepPosition, setSweepPosition] = useState(0);
  const [showMode, setShowMode] = useState(false);
  const [showButton, setShowButton] = useState(true);
  const [stage, setStage] = useState<'grid' | 'winners'>('grid');

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const handleSelectWinners = async () => {
    setIsSelecting(true);
    setWinners([]);
    setShowButton(false);
    setStage('grid');
    
    // Initial sweep animation
    for (let sweep = 0; sweep < 2; sweep++) {
      setSweepPosition(-100);
      await sleep(100);
      setSweepPosition(100);
      await sleep(500);
    }

    // Fast random highlights
    for (let cycle = 0; cycle < 3; cycle++) {
      for (let i = 0; i < 10; i++) {
        setHighlightedIndex(Math.floor(Math.random() * participants.length));
        await sleep(50);
      }
    }

    // Sequential sweep
    for (let cycle = 0; cycle < 2; cycle++) {
      for (let i = 0; i < participants.length; i++) {
        setHighlightedIndex(i);
        await sleep(30);
      }
    }

    // Final random flashes
    for (let i = 0; i < 5; i++) {
      setHighlightedIndex(Math.floor(Math.random() * participants.length));
      await sleep(100);
    }

    // Reset and pause
    setHighlightedIndex(-1);
    setSweepPosition(0);
    await sleep(300);

    // Switch to winners view
    setStage('winners');
    
    const shuffled = [...participants].sort(() => Math.random() - 0.5);
    const selectedWinners: Participant[] = [];

    for (let i = 0; i < prizeCount; i++) {
      await sleep(2000);
      selectedWinners.push(shuffled[i]);
      setWinners([...selectedWinners]);
      triggerConfetti();
    }

    setIsSelecting(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-900 text-white">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-10" />
      
      <div className="relative">
        <header className="text-center py-8">
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, type: 'spring', bounce: 0.5 }}
          >
            <h1 className="text-5xl lg:text-7xl font-bold mb-6 flex items-center justify-center gap-6">
              <motion.div
                animate={{ 
                  rotate: [0, -10, 10, -10, 10, 0],
                  color: ['#FFD700', '#FFA500', '#FF69B4', '#4B0082', '#FFD700'],
                }}
                transition={{ duration: 5, repeat: Infinity }}
              >
                <Gift className="w-16 h-16 lg:w-20 lg:h-20" />
              </motion.div>
              <motion.span
                animate={{ 
                  color: ['#FFD700', '#FFA500', '#FF69B4', '#4B0082', '#FFD700'],
                }}
                transition={{ duration: 5, repeat: Infinity }}
              >
                Pemenang Doorprize
              </motion.span>
              <motion.div
                animate={{ 
                  rotate: [0, 10, -10, 10, -10, 0],
                  color: ['#FFD700', '#FFA500', '#FF69B4', '#4B0082', '#FFD700'],
                }}
                transition={{ duration: 5, repeat: Infinity }}
              >
                <Trophy className="w-16 h-16 lg:w-20 lg:h-20" />
              </motion.div>
            </h1>
          </motion.div>
        </header>

        <div className="max-w-[90vw] mx-auto">
          <AnimatePresence mode="wait">
            {!showMode ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="space-y-6"
              >
                <Card className="bg-white/10 backdrop-blur-lg border-none p-8 shadow-xl">
                  {participants.length === 0 && (
                    <Alert className="mb-8 border-yellow-500 bg-yellow-500/10">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Silakan impor data peserta menggunakan file CSV terlebih dahulu.
                      </AlertDescription>
                    </Alert>
                  )}

                  <CSVImport 
                    onImport={onImportParticipants}
                    onClear={onClearParticipants}
                    participantCount={participants.length}
                  />

                  <div className="mt-6">
                    <WinnerSelection
                      participantsCount={participants.length}
                      prizeCount={prizeCount}
                      setPrizeCount={setPrizeCount}
                      onSelectWinners={() => {}}
                      isSelecting={false}
                      showMode={false}
                      adminControls
                    />
                  </div>
                </Card>

                <ParticipantAnalytics participants={participants} />

                <Button
                  onClick={() => setShowMode(true)}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-xl py-6"
                  disabled={participants.length === 0}
                >
                  Tampilkan di Layar
                </Button>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="relative min-h-[70vh] flex items-center justify-center"
              >
                <AnimatePresence mode="wait">
                  {stage === 'grid' && (
                    <motion.div
                      key="grid"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.2 }}
                      className="w-full"
                    >
                      {showButton && (
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
                          <Button
                            size="lg"
                            onClick={handleSelectWinners}
                            disabled={isSelecting || participants.length === 0}
                            className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-3xl px-16 py-8 transition-all duration-300 transform hover:scale-105 whitespace-nowrap"
                          >
                            {isSelecting ? 'Sedang Mengundi...' : 'Mulai Undian'}
                          </Button>
                        </div>
                      )}

                      <ParticipantGrid
                        participants={participants}
                        isShowingParticipants={true}
                        highlightedIndex={highlightedIndex}
                        sweepPosition={sweepPosition}
                      />
                    </motion.div>
                  )}

                  {stage === 'winners' && (
                    <motion.div
                      key="winners"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="w-full"
                    >
                      <WinnerCards winners={winners} />
                      <ExportButton winners={winners} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}