"use client";

import { ChangeEvent, useMemo } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export interface Participant {
  id: string;
  name: string;
  isYou: boolean;
  activitiesCount: number;
}

interface HeaderPersonalizationProps {
  name: string;
  participants: number;
  locale: "es" | "en";
  onNameChange: (value: string) => void;
  onParticipantsChange: (value: number) => void;
}

const PARTICIPANT_OPTIONS = [1, 2, 3, 4, 5];

const translations = {
  es: {
    title: "Personaliza tu experiencia",
    nameLabel: "Nombre del huésped principal",
    namePlaceholder: "Tu nombre",
    participantLabel: "Participantes",
    participantSuffix: (count: number) =>
      count === 1 ? "huésped" : "huéspedes",
    summaryPrefix: "Personalizando para",
    defaultGroup: "tu grupo",
  },
  en: {
    title: "Personalize your experience",
    nameLabel: "Lead guest name",
    namePlaceholder: "Your name",
    participantLabel: "Participants",
    participantSuffix: (count: number) =>
      count === 1 ? "guest" : "guests",
    summaryPrefix: "Customizing for",
    defaultGroup: "your group",
  },
};

const HeaderPersonalization = ({
  name,
  participants,
  locale,
  onNameChange,
  onParticipantsChange,
}: HeaderPersonalizationProps) => {
  const t = translations[locale] ?? translations.es;

  const summary = useMemo(() => {
    const count = participants;
    return `${count} ${t.participantSuffix(count)}`;
  }, [participants, t]);

  const handleParticipantChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onParticipantsChange(Number(event.target.value));
  };

  return (
    <div className="mb-3 md:mb-4 rounded-3xl border border-[white]/50 bg-[white]/80 shadow-[0_4px_16px_rgba(0,0,0,0.25)] backdrop-blur overflow-hidden">
      {/* PASS 2: reduced padding p-4/6 ? p-3/4, gaps 2.5/3 ? 2/2.5 */}
      <div className="p-3 md:p-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center gap-2 md:gap-2.5"
        >
          {/* PASS 2: icon w-10/12 h-10/12 ? w-8/10 h-8/10 */}
          <div className="flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full bg-black/70 backdrop-blur-md border border-white/20">
            <Sparkles className="h-4 w-4 md:h-5 md:w-5 text-amber-300" />
          </div>

          {/* Title - Increased size */}
          <h1 className="text-2xl md:text-3xl font-heading text-black tracking-tight">
            {t.title}
          </h1>

          {/* Subtitle - Much larger */}
          <p className="text-sm md:text-base text-[#6d5f57] max-w-2xl mx-auto leading-snug">
            {locale === 'es'
              ? 'Elige las actividades que darán forma a tu experiencia perfecta.'
              : 'Choose the activities that will shape your perfect experience.'}
          </p>
        </motion.div>
      </div>

    </div>
  );
};

export default HeaderPersonalization;
