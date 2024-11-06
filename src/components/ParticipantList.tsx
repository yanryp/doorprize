import { Card } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { Participant } from '@/types';

interface ParticipantListProps {
  participants: Participant[];
}

export function ParticipantList({ participants }: ParticipantListProps) {
  return (
    <Card className="mt-8 p-6 bg-white/10 backdrop-blur-lg border-none">
      <h2 className="text-2xl font-semibold mb-6">
        Participants ({participants.length})
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnimatePresence>
          {participants.map((participant) => (
            <motion.div
              key={participant.id}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="bg-white/20 p-4 rounded-lg"
            >
              <div className="font-semibold">{participant.name}</div>
              <div className="text-sm opacity-75">{participant.unit}</div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Card>
  );
}