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
    <div className="mb-3 md:mb-4 rounded-3xl border border-slate-700/60 bg-slate-900/70 shadow-[0_4px_16px_rgba(0,0,0,0.25)] backdrop-blur overflow-hidden" style={{ boxShadow: 'inset 0 -1px 0 rgba(255,255,255,0.1), 0 4px 16px rgba(0,0,0,0.25)' }}>
      {/* PASS 2: reduced padding p-4/6 → p-3/4, gaps 2.5/3 → 2/2.5 */}
      <div className="p-3 md:p-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center gap-2 md:gap-2.5"
        >
          {/* PASS 2: icon w-10/12 h-10/12 → w-8/10 h-8/10 */}
          <div className="flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-amber-300/20 to-amber-500/20 border border-amber-400/30">
            <Sparkles className="h-4 w-4 md:h-5 md:w-5 text-amber-300" />
          </div>

          {/* PASS 2: text-xl/3xl → text-lg/2xl */}
          <h1 className="text-lg md:text-2xl font-heading text-white tracking-tight">
            {t.title}
          </h1>

          {/* PASS 2: tighter leading, smaller text */}
          <p className="text-xs md:text-sm text-slate-300 max-w-2xl mx-auto leading-snug">
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
