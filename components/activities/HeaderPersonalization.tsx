"use client";

import { ChangeEvent, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Users, Sparkles } from "lucide-react";

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
      count === 1 ? "persona" : "personas",
    summaryPrefix: "Configurando para",
    defaultGroup: "Tu grupo",
  },
  en: {
    title: "Personalize your experience",
    nameLabel: "Lead guest name",
    namePlaceholder: "Your name",
    participantLabel: "Participants",
    participantSuffix: (count: number) =>
      count === 1 ? "person" : "people",
    summaryPrefix: "Setting up for",
    defaultGroup: "Your group",
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
    const baseName = name.trim() || t.defaultGroup;
    if (participants <= 1) {
      return baseName;
    }

    const extra = participants - 1;
    return `${baseName} + ${extra} ${t.participantSuffix(extra)}`;
  }, [name, participants, t]);

  const handleParticipantChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onParticipantsChange(Number(event.target.value));
  };

  return (
    <div className="mb-8 rounded-3xl border border-slate-700/60 bg-slate-900/70 p-6 shadow-xl shadow-black/20 backdrop-blur">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex-1">
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
            <Sparkles className="h-4 w-4 text-amber-300" />
            <span>{t.title}</span>
          </div>
          <AnimatePresence mode="wait">
            <motion.p
              key={summary}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.25 }}
              className="text-lg font-semibold text-slate-100 md:text-2xl text-amber-200"
            >
              {t.summaryPrefix} {summary}
            </motion.p>
          </AnimatePresence>
        </div>
        <div className="flex w-full flex-col gap-4 md:w-auto md:flex-row">
          <label className="flex-1 md:w-72">
            <span className="text-xs font-semibold uppercase text-slate-400 tracking-wide">
              {t.nameLabel}
            </span>
            <input
              value={name}
              onChange={(event) => onNameChange(event.target.value)}
              placeholder={t.namePlaceholder}
              className="mt-2 w-full rounded-2xl border border-slate-600 bg-slate-800/80 px-4 py-3 text-slate-100 shadow-inner shadow-black/20 outline-none transition focus:border-amber-300 focus:ring-2 focus:ring-amber-300/40"
              aria-label={t.nameLabel}
            />
          </label>
          <label className="md:w-40">
            <span className="text-xs font-semibold uppercase text-slate-400 tracking-wide">
              {t.participantLabel}
            </span>
            <div className="mt-2 flex items-center gap-2 rounded-2xl border border-slate-600 bg-slate-800/80 px-4 py-3 text-slate-100 shadow-inner shadow-black/20">
              <Users className="h-4 w-4 text-amber-300" aria-hidden="true" />
              <select
                value={participants}
                onChange={handleParticipantChange}
                className="w-full bg-transparent text-sm font-medium outline-none"
                aria-label={t.participantLabel}
              >
                {PARTICIPANT_OPTIONS.map((option) => (
                  <option key={option} value={option} className="bg-slate-900 text-slate-100">
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
};

export default HeaderPersonalization;
