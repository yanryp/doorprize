import { motion, AnimatePresence } from 'framer-motion';
import type { Participant } from '@/types';

interface ParticipantGridProps {
  participants: Participant[];
  isShowingParticipants: boolean;
  highlightedIndex: number;
  sweepPosition: number;
}

export function ParticipantGrid({
  participants,
  isShowingParticipants,
  highlightedIndex,
  sweepPosition
}: ParticipantGridProps) {
  if (!isShowingParticipants) return null;

  return (
    <div className="relative overflow-hidden">
      {/* Sweeping highlight effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-400/50 to-transparent w-[200%] pointer-events-none z-10"
        animate={{
          x: `${sweepPosition}%`,
        }}
        transition={{
          duration: 0.4,
          ease: "easeInOut"
        }}
      />

      <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 2xl:grid-cols-12 gap-3 p-4">
        <AnimatePresence mode="sync">
          {participants.map((participant, index) => (
            <motion.div
              key={participant.id}
              initial={{ scale: 0, rotateX: 180 }}
              animate={{ 
                scale: 1,
                rotateX: 0,
                backgroundColor: index === highlightedIndex 
                  ? ['rgba(255, 215, 0, 0.3)', 'rgba(255, 215, 0, 0.6)', 'rgba(255, 215, 0, 0.3)']
                  : 'rgba(255, 255, 255, 0.1)',
                boxShadow: index === highlightedIndex
                  ? [
                      '0 0 10px rgba(255, 215, 0, 0.3)',
                      '0 0 20px rgba(255, 215, 0, 0.5)',
                      '0 0 10px rgba(255, 215, 0, 0.3)'
                    ]
                  : 'none'
              }}
              exit={{ scale: 0, rotateX: -180 }}
              transition={{ 
                duration: 0.3,
                type: 'spring',
                stiffness: 200,
                damping: 20,
                backgroundColor: {
                  duration: 0.5,
                  repeat: highlightedIndex === index ? Infinity : 0,
                  repeatType: "reverse"
                },
                boxShadow: {
                  duration: 0.5,
                  repeat: highlightedIndex === index ? Infinity : 0,
                  repeatType: "reverse"
                }
              }}
              className="p-2 rounded-lg text-center backdrop-blur-sm"
            >
              <div className="font-semibold text-sm lg:text-base truncate">
                {participant.name}
              </div>
              <div className="text-xs lg:text-sm opacity-75 truncate">
                {participant.unit}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}