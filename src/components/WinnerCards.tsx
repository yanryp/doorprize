import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Crown } from 'lucide-react';
import type { Participant } from '@/types';

interface WinnerCardsProps {
  winners: Participant[];
}

export function WinnerCards({ winners }: WinnerCardsProps) {
  if (winners.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
      <AnimatePresence mode="wait">
        {winners.map((winner, index) => (
          <motion.div
            key={winner.id}
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{ 
              duration: 0.8, 
              type: 'spring', 
              bounce: 0.4,
              delay: index * 0.2 
            }}
          >
            <Card className="relative overflow-hidden bg-gradient-to-br from-purple-900/90 to-indigo-900/90 backdrop-blur-lg border-2 border-yellow-400 p-6 transform hover:scale-105 transition-transform duration-300 shadow-[0_0_15px_rgba(255,215,0,0.3)]">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-400" />
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.2 }}
                className="relative z-10"
              >
                <div className="flex items-center gap-3 mb-4">
                  <Crown className="w-6 h-6 text-yellow-400" />
                  <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-transparent bg-clip-text text-xl lg:text-2xl font-bold">
                    Pemenang #{index + 1}
                  </div>
                </div>
                
                <div className="bg-white/10 backdrop-blur-md rounded-lg p-4">
                  <div className="text-2xl lg:text-3xl font-bold text-white mb-2 truncate">
                    {winner.name}
                  </div>
                  <div className="text-lg lg:text-xl text-yellow-200/90 truncate">
                    {winner.unit}
                  </div>
                </div>
              </motion.div>

              <div className="absolute bottom-0 right-0 w-32 h-32 bg-yellow-400/10 rounded-full blur-2xl" />
              <div className="absolute top-0 left-0 w-24 h-24 bg-orange-400/10 rounded-full blur-2xl" />
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}