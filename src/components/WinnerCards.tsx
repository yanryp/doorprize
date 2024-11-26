import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';
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
        return "grid-cols-1 max-w-3xl";
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
        return 'min-h-[16rem] lg:min-h-[20rem]';
      case 2:
        return 'min-h-[14rem] lg:min-h-[16rem]';
      case 3:
        return 'min-h-[12rem] lg:min-h-[14rem]';
      case 4:
        return 'min-h-[10rem] lg:min-h-[12rem]';
      default:
        return 'min-h-[9rem] lg:min-h-[11rem]';
    }
  };

  // Calculate font sizes based on winner count and viewport
  const getFontSizes = () => {
    switch (winners.length) {
      case 1:
        return {
          name: 'text-4xl sm:text-5xl lg:text-6xl',
          unit: 'text-2xl sm:text-3xl lg:text-4xl'
        };
      case 2:
        return {
          name: 'text-3xl sm:text-4xl lg:text-5xl',
          unit: 'text-xl sm:text-2xl lg:text-3xl'
        };
      case 3:
        return {
          name: 'text-2xl sm:text-3xl lg:text-4xl',
          unit: 'text-lg sm:text-xl lg:text-2xl'
        };
      case 4:
        return {
          name: 'text-xl sm:text-2xl lg:text-3xl',
          unit: 'text-base sm:text-lg lg:text-xl'
        };
      default:
        return {
          name: 'text-lg sm:text-xl lg:text-2xl',
          unit: 'text-base sm:text-lg'
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
      className={`grid ${getGridCols()} gap-6 mx-auto px-4 h-[calc(100vh-12rem)] place-content-center`}
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
            <Card className={`relative overflow-hidden ${getCardSize()} w-full group`}>
              {/* Base gradient background */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-900/90 to-indigo-900/90" />
              
              {/* Shimmering overlay */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-400/30 to-transparent skew-x-12 translate-x-[-200%]"
                animate={{
                  translateX: ['100%', '-100%']
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "linear",
                  repeatDelay: 1
                }}
              />

              {/* Sparkle pattern overlay */}
              <div className="absolute inset-0 opacity-20 mix-blend-overlay bg-[radial-gradient(circle_at_center,_white_0.5px,_transparent_1px)] bg-[length:12px_12px]" />

              {/* Animated border with double gradient */}
              <div className="absolute inset-0">
                <div className="absolute inset-0 p-[2px] rounded-lg bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-300">
                  <div className="h-full w-full rounded-[6px] bg-gradient-to-br from-purple-900/90 to-indigo-900/90" />
                </div>
                <motion.div
                  className="absolute inset-0 p-[2px] rounded-lg bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-50"
                  animate={{
                    translateX: ['-100%', '100%']
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "linear",
                    repeatDelay: 1
                  }}
                />
              </div>

              {/* Content container */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="relative h-full flex flex-col items-center justify-center p-6 text-center"
              >
                {/* Sparkle icons */}
                <motion.div
                  className="absolute top-3 right-3"
                  animate={{ 
                    rotate: 360,
                    scale: [1, 1.2, 1]
                  }}
                  transition={{ 
                    duration: 4,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                >
                  <Sparkles className="w-5 h-5 text-yellow-300/70" />
                </motion.div>

                {/* Winner name with gradient and glow */}
                <motion.div 
                  className={`relative font-bold ${fontSizes.name} mb-3`}
                  animate={{ 
                    color: ['#fef3c7', '#fcd34d', '#fef3c7']
                  }}
                  transition={{ 
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-200">
                    {winner.name}
                  </span>
                  <motion.div
                    className="absolute inset-0 blur-sm"
                    animate={{ 
                      opacity: [0.5, 0.8, 0.5]
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    {winner.name}
                  </motion.div>
                </motion.div>

                {/* Winner unit with shimmer */}
                <motion.div 
                  className={`text-yellow-100/90 ${fontSizes.unit} relative`}
                  animate={{ 
                    opacity: [0.7, 1, 0.7]
                  }}
                  transition={{ 
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  {winner.unit}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    animate={{
                      translateX: ['-200%', '200%']
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "linear",
                      repeatDelay: 1
                    }}
                  />
                </motion.div>

                {/* Ambient glow effects */}
                <motion.div 
                  className="absolute -bottom-20 -right-20 w-40 h-40 bg-yellow-400/20 rounded-full blur-3xl"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.5, 0.3]
                  }}
                  transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
                <motion.div 
                  className="absolute -top-20 -left-20 w-40 h-40 bg-amber-400/20 rounded-full blur-3xl"
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.3, 0.5, 0.3]
                  }}
                  transition={{
                    duration: 7,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.5
                  }}
                />
              </motion.div>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}