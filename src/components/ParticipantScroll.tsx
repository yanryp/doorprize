import { motion, AnimatePresence } from 'framer-motion';
import type { Participant } from '@/types';

interface ParticipantScrollProps {
  participants: Participant[];
  isShowingParticipants: boolean;
  highlightedIndex: number;
}

export function ParticipantScroll({
  participants,
  isShowingParticipants,
  highlightedIndex
}: ParticipantScrollProps) {
  if (!isShowingParticipants) return null;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="relative overflow-hidden rounded-lg bg-white/10 backdrop-blur-md">
        {/* Highlight sweep effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-400/30 to-transparent w-[200%]"
          animate={{
            x: ['-100%', '100%'],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear"
          }}
        />

        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={highlightedIndex}
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -50, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={`p-6 text-center ${
                highlightedIndex >= 0 ? 'bg-yellow-400/20' : 'bg-white/5'
              }`}
            >
              {highlightedIndex >= 0 && participants[highlightedIndex] && (
                <>
                  <motion.div 
                    className="text-2xl font-bold text-white mb-1"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 0.3, repeat: Infinity }}
                  >
                    {participants[highlightedIndex].name}
                  </motion.div>
                  <motion.div 
                    className="text-lg text-yellow-200/90"
                    animate={{ opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 0.3, repeat: Infinity }}
                  >
                    {participants[highlightedIndex].unit}
                  </motion.div>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}