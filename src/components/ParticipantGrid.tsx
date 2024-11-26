import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Participant } from '@/types';

interface ParticipantGridProps {
  participants: Participant[];
  isShowingParticipants: boolean;
  highlightedIndex: number;
  onScrollComplete?: () => void;
}

export function ParticipantGrid({
  participants,
  isShowingParticipants,
  highlightedIndex,
  onScrollComplete
}: ParticipantGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const scrollingRef = useRef(false);

  useEffect(() => {
    if (!gridRef.current || scrollingRef.current) return;

    const container = gridRef.current;
    const totalHeight = container.scrollHeight - container.clientHeight;
    
    if (highlightedIndex === participants.length - 1) {
      scrollingRef.current = true;
      container.scrollTo({
        top: totalHeight,
        behavior: 'smooth'
      });

      const timer = setTimeout(() => {
        onScrollComplete?.();
      }, 1000);

      return () => clearTimeout(timer);
    } else if (highlightedIndex >= 0) {
      const progress = highlightedIndex / (participants.length - 1);
      const scrollTarget = totalHeight * progress;

      container.scrollTo({
        top: scrollTarget,
        behavior: 'smooth'
      });
    }
  }, [highlightedIndex, participants.length, onScrollComplete]);

  if (!isShowingParticipants) return null;

  return (
    <div 
      ref={gridRef}
      className="w-full max-w-[95vw] mx-auto overflow-y-auto relative"
      style={{ height: '70vh' }}
    >
      {/* Highlight sweep overlay */}
      <motion.div
        className="absolute inset-0 pointer-events-none z-10 bg-gradient-to-b from-transparent via-yellow-400/20 to-transparent"
        animate={{
          y: ['-100%', '100%']
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "linear"
        }}
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-2 sm:gap-3 p-2 sm:p-4">
        <AnimatePresence>
          {participants.map((participant, index) => (
            <motion.div
              key={participant.id}
              className={`
                relative p-3 sm:p-4 rounded-lg backdrop-blur-sm
                ${index === highlightedIndex ? 'ring-2 ring-yellow-400 bg-yellow-400/50' : 'bg-white/30'}
              `}
              initial={{ opacity: 0.6, scale: 0.95 }}
              animate={{ 
                opacity: index === highlightedIndex ? 1 : 0.8,
                scale: index === highlightedIndex ? 1.05 : 1,
                backgroundColor: index === highlightedIndex ? 'rgba(251, 191, 36, 0.5)' : 'rgba(255, 255, 255, 0.3)',
                boxShadow: index === highlightedIndex ? '0 0 20px rgba(251, 191, 36, 0.3)' : 'none'
              }}
              transition={{ 
                duration: 0.4,
                ease: "easeOut"
              }}
            >
              {index === highlightedIndex && (
                <motion.div
                  className="absolute inset-0 rounded-lg ring-2 ring-yellow-400"
                  animate={{
                    opacity: [0, 1, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity
                  }}
                />
              )}
              
              <div className="font-medium text-white text-xs sm:text-sm truncate">
                {participant.name}
              </div>
              <div className="text-yellow-200/90 text-[10px] sm:text-xs truncate">
                {participant.unit}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}