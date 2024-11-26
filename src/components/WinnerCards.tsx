import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Crown } from 'lucide-react';
import type { Participant } from '@/types';

interface WinnerCardsProps {
  winners: Participant[];
}

export function WinnerCards({ winners }: WinnerCardsProps) {
  if (winners.length === 0) return null;

  // Calculate optimal grid layout based on winner count
  const getGridCols = () => {
    switch (winners.length) {
      case 1:
        return "grid-cols-1 max-w-md";
      case 2:
        return "grid-cols-2 max-w-2xl";
      case 3:
        return "grid-cols-3 max-w-4xl";
      case 4:
        return "grid-cols-2 lg:grid-cols-4 max-w-5xl";
      case 5:
        return "grid-cols-2 lg:grid-cols-5 max-w-6xl";
      case 6:
        return "grid-cols-2 lg:grid-cols-3 max-w-6xl";
      case 7:
      case 8:
        return "grid-cols-2 lg:grid-cols-4 max-w-6xl";
      case 9:
        return "grid-cols-3 max-w-6xl";
      default:
        return "grid-cols-2 md:grid-cols-3 lg:grid-cols-5 max-w-7xl";
    }
  };

  // Calculate dynamic card size based on winner count
  const getCardSize = () => {
    if (winners.length <= 3) return 'h-48';
    if (winners.length <= 6) return 'h-40';
    if (winners.length <= 9) return 'h-36';
    return 'h-32';
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className={`grid ${getGridCols()} gap-3 mx-auto px-4 h-[calc(100vh-12rem)] place-content-center`}
    >
      <AnimatePresence mode="wait">
        {winners.map((winner, index) => (
          <motion.div
            key={winner.id}
            initial={{ scale: 0, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0, opacity: 0, y: -50 }}
            transition={{ 
              duration: 0.6,
              delay: index * 0.2,
              type: 'spring',
              bounce: 0.35
            }}
            className="flex justify-center"
          >
            <Card className={`relative overflow-hidden bg-gradient-to-br from-purple-900/90 to-indigo-900/90 backdrop-blur-lg border-2 border-yellow-400 p-3 transform hover:scale-105 transition-transform duration-300 shadow-[0_0_15px_rgba(255,215,0,0.3)] w-full ${getCardSize()} flex flex-col justify-center`}>
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-400/20 to-transparent"
                animate={{
                  x: ['-200%', '200%']
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "linear"
                }}
              />

              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-400" />
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  delay: 0.3 + index * 0.2,
                  duration: 0.5,
                  type: 'spring',
                  bounce: 0.3
                }}
                className="relative z-10 flex flex-col items-center"
              >
                <div className="flex items-center justify-center gap-2 mb-2">
                  <motion.div
                    animate={{ 
                      rotate: [0, -10, 10, -10, 10, 0],
                      scale: [1, 1.2, 1, 1.2, 1]
                    }}
                    transition={{ 
                      duration: 2,
                      delay: 0.5 + index * 0.2,
                      repeat: Infinity,
                      repeatDelay: 1
                    }}
                  >
                    <Crown className="w-4 h-4 text-yellow-400" />
                  </motion.div>
                  <motion.div
                    animate={{ 
                      color: ['#FFD700', '#FFA500', '#FFD700'],
                      scale: [1, 1.05, 1]
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      repeatDelay: 1
                    }}
                    className="bg-gradient-to-r from-yellow-400 to-orange-400 text-transparent bg-clip-text text-sm font-bold text-center"
                  >
                    Pemenang #{index + 1}
                  </motion.div>
                </div>
                
                <motion.div 
                  className="bg-white/10 backdrop-blur-md rounded-lg p-2 w-full"
                  animate={{ 
                    boxShadow: [
                      '0 0 0 rgba(255,215,0,0)',
                      '0 0 20px rgba(255,215,0,0.3)',
                      '0 0 0 rgba(255,215,0,0)'
                    ]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 1
                  }}
                >
                  <motion.div 
                    className="text-lg font-bold text-white mb-1 truncate text-center"
                    animate={{ scale: [1, 1.02, 1] }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      repeatDelay: 1
                    }}
                  >
                    {winner.name}
                  </motion.div>
                  <motion.div 
                    className="text-sm text-yellow-200/90 truncate text-center"
                    animate={{ opacity: [0.7, 1, 0.7] }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      repeatDelay: 1
                    }}
                  >
                    {winner.unit}
                  </motion.div>
                </motion.div>
              </motion.div>

              <motion.div 
                className="absolute bottom-0 right-0 w-24 h-24 bg-yellow-400/10 rounded-full blur-2xl"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 0.8, 0.5]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              <motion.div 
                className="absolute top-0 left-0 w-16 h-16 bg-orange-400/10 rounded-full blur-2xl"
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.5, 0.8, 0.5]
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}