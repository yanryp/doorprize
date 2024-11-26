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
  const [showMode, setShowMode] = useState(false);
  const [showButton, setShowButton] = useState(true);
  const [stage, setStage] = useState<'grid' | 'winners'>('grid');

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const handleScrollComplete = async () => {
    setHighlightedIndex(-1);
    await sleep(500);
    setStage('winners');
    
    const shuffled = [...participants].sort(() => Math.random() - 0.5);
    const selectedWinners: Participant[] = [];

    for (let i = 0; i < prizeCount; i++) {
      await sleep(800);
      selectedWinners.push(shuffled[i]);
      setWinners([...selectedWinners]);
      triggerConfetti();
    }

    setIsSelecting(false);
  };

  const handleSelectWinners = async () => {
    setIsSelecting(true);
    setWinners([]);
    setShowButton(false);
    setStage('grid');

    await sleep(500);

    const scrollDuration = 5000;
    const intervalPerParticipant = scrollDuration / participants.length;
    
    for (let i = 0; i < participants.length; i++) {
      setHighlightedIndex(i);
      await sleep(intervalPerParticipant);
    }
  };

  return (
    <div className={`min-h-screen w-screen overflow-x-hidden ${
      showMode 
        ? 'bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-900' 
        : 'bg-gradient-to-br from-purple-600 via-blue-500 to-purple-700'
    } text-white`}>
      {showMode && (
        <div className="fixed inset-0 bg-[url('https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-10" />
      )}
      
      <div className="relative w-full px-4 py-8">
        <header className="text-center mb-8">
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, type: 'spring', bounce: 0.5 }}
          >
            <h1 className="text-4xl sm:text-5xl lg:text-7xl xl:text-8xl font-bold mb-6 flex items-center justify-center gap-3 sm:gap-6">
              <motion.div
                animate={{ 
                  rotate: [0, -10, 10, -10, 10, 0],
                  color: ['#FFD700', '#FFA500', '#FF69B4', '#4B0082', '#FFD700'],
                }}
                transition={{ duration: 5, repeat: Infinity }}
              >
                <Gift className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 xl:w-24 xl:h-24" />
              </motion.div>
              <motion.span
                animate={{ 
                  color: ['#FFD700', '#FFA500', '#FF69B4', '#4B0082', '#FFD700'],
                }}
                transition={{ duration: 5, repeat: Infinity }}
                className="whitespace-nowrap"
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
                <Trophy className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 xl:w-24 xl:h-24" />
              </motion.div>
            </h1>
          </motion.div>
        </header>

        <AnimatePresence mode="wait">
          {!showMode ? (
            <motion.div
              key="admin"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="w-full max-w-7xl mx-auto px-4"
            >
              <Card className="bg-white/10 backdrop-blur-lg border-none p-4 sm:p-6 lg:p-8 mb-8">
                {participants.length === 0 && (
                  <Alert className="mb-8 border-yellow-500 bg-yellow-500/10">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Silakan impor data peserta menggunakan file CSV terlebih dahulu.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-8">
                  <CSVImport 
                    onImport={onImportParticipants}
                    onClear={onClearParticipants}
                    participantCount={participants.length}
                  />

                  <WinnerSelection
                    participantsCount={participants.length}
                    prizeCount={prizeCount}
                    setPrizeCount={setPrizeCount}
                    onSelectWinners={handleSelectWinners}
                    isSelecting={isSelecting}
                    showMode={false}
                    adminControls={true}
                  />

                  <ParticipantAnalytics participants={participants} />

                  <Button
                    onClick={() => setShowMode(true)}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-xl py-6"
                    disabled={participants.length === 0}
                  >
                    Tampilkan di Layar
                  </Button>
                </div>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="display"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="w-full"
            >
              {showButton && (
                <div className="flex justify-center mb-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Button
                      size="lg"
                      onClick={handleSelectWinners}
                      disabled={isSelecting || participants.length === 0}
                      className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-xl sm:text-2xl lg:text-3xl px-8 sm:px-12 lg:px-16 py-6 sm:py-7 lg:py-8 transition-all duration-300 transform hover:scale-105"
                    >
                      {isSelecting ? 'Sedang Mengundi...' : 'Mulai Undian'}
                    </Button>
                  </motion.div>
                </div>
              )}

              <AnimatePresence mode="wait">
                {stage === 'grid' && (
                  <motion.div
                    key="grid"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.2 }}
                    transition={{ duration: 0.5 }}
                    className="w-full"
                  >
                    <ParticipantGrid
                      participants={participants}
                      isShowingParticipants={isSelecting}
                      highlightedIndex={highlightedIndex}
                      onScrollComplete={handleScrollComplete}
                    />
                  </motion.div>
                )}

                {stage === 'winners' && (
                  <motion.div
                    key="winners"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.2 }}
                    transition={{ duration: 0.5 }}
                    className="w-full px-4"
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
  );
}