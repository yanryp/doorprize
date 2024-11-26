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
        return "grid-cols-1 max-w-2xl";
      case 2:
        return "grid-cols-2 max-w-5xl";
      case 3:
        return "grid-cols-3 max-w-6xl";
      case 4:
        return "grid-cols-2 lg:grid-cols-4 max-w-6xl";
      case 5:
        return "grid-cols-2 lg:grid-cols-5 max-w-7xl";
      default:
        return "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 max-w-7xl";
    }
  };

  // Calculate dynamic card size based on winner count
  const getCardSize = () => {
    switch (winners.length) {
      case 1:
        return 'h-96'; // Much larger for single winner
      case 2:
        return 'h-80'; // Larger for two winners
      case 3:
        return 'h-72'; // Large for three winners
      case 4:
        return 'h-64';
      case 5:
        return 'h-56';
      default:
        return 'h-48';
    }
  };

  // Calculate font sizes based on winner count
  const getFontSizes = () => {
    switch (winners.length) {
      case 1:
        return {
          title: 'text-2xl',
          name: 'text-4xl',
          unit: 'text-2xl'
        };
      case 2:
        return {
          title: 'text-xl',
          name: 'text-3xl',
          unit: 'text-xl'
        };
      case 3:
        return {
          title: 'text-lg',
          name: 'text-2xl',
          unit: 'text-lg'
        };
      default:
        return {
          title: 'text-base',
          name: 'text-xl',
          unit: 'text-base'
        };
    }
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

  const fontSizes = getFontSizes();

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className={`grid ${getGridCols()} gap-4 md:gap-6 mx-auto px-4 h-[calc(100vh-12rem)] place-content-center`}
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
            <Card className={`relative overflow-hidden bg-gradient-to-br from-purple-900/90 to-indigo-900/90 backdrop-blur-lg border-2 border-yellow-400 p-6 transform hover:scale-105 transition-transform duration-300 shadow-[0_0_15px_rgba(255,215,0,0.3)] w-full ${getCardSize()} flex flex-col justify-center`}>
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

              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-400" />
              
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
                <div className="flex items-center justify-center gap-3 mb-4">
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
                    <Crown className={`${winners.length === 1 ? 'w-12 h-12' : 'w-8 h-8'} text-yellow-400`} />
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
                    className={`bg-gradient-to-r from-yellow-400 to-orange-400 text-transparent bg-clip-text font-bold text-center ${fontSizes.title}`}
                  >
                    Pemenang #{index + 1}
                  </motion.div>
                </div>
                
                <motion.div 
                  className="bg-white/10 backdrop-blur-md rounded-lg p-4 w-full"
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
                    className={`font-bold text-white mb-2 truncate text-center ${fontSizes.name}`}
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
                    className={`text-yellow-200/90 truncate text-center ${fontSizes.unit}`}
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
                className="absolute bottom-0 right-0 w-32 h-32 bg-yellow-400/10 rounded-full blur-2xl"
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
                className="absolute top-0 left-0 w-24 h-24 bg-orange-400/10 rounded-full blur-2xl"
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