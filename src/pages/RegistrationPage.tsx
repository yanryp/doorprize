import { ParticipantForm } from '@/components/ParticipantForm';
import { Gift } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Participant } from '@/types';

interface RegistrationPageProps {
  participants: Participant[];
  onAddParticipant: (name: string, unit: string) => void;
}

export function RegistrationPage({ participants, onAddParticipant }: RegistrationPageProps) {
  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-purple-600 via-blue-500 to-purple-700 text-white px-4 py-8">
      <div className="max-w-md mx-auto pt-safe">
        <header className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl md:text-4xl font-bold mb-4 flex items-center justify-center gap-3">
              <Gift className="w-8 h-8 md:w-10 md:h-10" />
              Pendaftaran Doorprize
            </h1>
            <p className="text-base md:text-lg opacity-90">Daftar sekarang untuk kesempatan menang!</p>
          </motion.div>
        </header>

        <ParticipantForm 
          onAddParticipant={onAddParticipant} 
          participants={participants}
        />
      </div>
    </div>
  );
}