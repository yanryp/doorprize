import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Participant } from '@/types';

interface WinnerDisplayProps {
  winners: Participant[];
  prizeCount: number;
  onPrizeCountChange: (count: number) => void;
  onSelectWinners: () => void;
  isSelecting: boolean;
  participantsCount: number;
}

export function WinnerDisplay({
  winners,
  prizeCount,
  onPrizeCountChange,
  onSelectWinners,
  isSelecting,
  participantsCount,
}: WinnerDisplayProps) {
  return (
    <Card className="p-6 bg-white/10 backdrop-blur-lg border-none">
      <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
        <Trophy className="w-6 h-6" />
        Winners
      </h2>
      <div className="space-y-4">
        <div className="flex items-center gap-4 mb-4">
          <Input
            type="number"
            value={prizeCount}
            onChange={(e) => onPrizeCountChange(Number(e.target.value))}
            min={1}
            max={participantsCount}
            className="bg-white/20 w-24"
          />
          <Button
            onClick={onSelectWinners}
            disabled={isSelecting || participantsCount === 0}
            className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
          >
            {isSelecting ? 'Selecting...' : 'Draw Winners'}
          </Button>
        </div>

        <div className="space-y-4">
          <AnimatePresence>
            {winners.map((winner, index) => (
              <motion.div
                key={winner.id}
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 100, opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white/20 p-4 rounded-lg"
              >
                <div className="font-semibold text-lg">
                  Prize Winner #{index + 1}
                </div>
                <div>{winner.name}</div>
                <div className="text-sm opacity-75">{winner.unit}</div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </Card>
  );
}