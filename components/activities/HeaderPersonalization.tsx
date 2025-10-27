"use client";

import { ChangeEvent, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Users, Sparkles, Edit2, X } from "lucide-react";

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
  // New props for integrated tabs
  participantTabs?: Participant[];
  activeParticipantId?: string;
  onParticipantChange?: (participantId: string) => void;
  onParticipantNameChange?: (participantId: string, name: string) => void;
  onRemoveParticipant?: (participantId: string) => void;
  onCopyChoicesToAll?: () => void;
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
    copyToAll: "Copiar a todos",
    you: "Tú",
    editName: "Editar nombre",
    removeParticipant: "Eliminar participante",
    confirmDelete: "¿Estás seguro?",
    confirmDeleteMessage: "¿Deseas eliminar a este participante? Esta acción no se puede deshacer.",
    cancel: "Cancelar",
    delete: "Eliminar",
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
    copyToAll: "Copy to all",
    you: "You",
    editName: "Edit name",
    removeParticipant: "Remove participant",
    confirmDelete: "Are you sure?",
    confirmDeleteMessage: "Do you want to remove this participant? This action cannot be undone.",
    cancel: "Cancel",
    delete: "Delete",
  },
};

const HeaderPersonalization = ({
  name,
  participants,
  locale,
  onNameChange,
  onParticipantsChange,
  participantTabs = [],
  activeParticipantId,
  onParticipantChange,
  onParticipantNameChange,
  onRemoveParticipant,
  onCopyChoicesToAll,
}: HeaderPersonalizationProps) => {
  const t = translations[locale] ?? translations.es;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const summary = useMemo(() => {
    const count = participants;
    return `${count} ${t.participantSuffix(count)}`;
  }, [participants, t]);

  const handleParticipantChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onParticipantsChange(Number(event.target.value));
  };

  const handleStartEdit = (participant: Participant, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(participant.id);
    setEditingName(participant.name);
  };

  const handleSaveEdit = (participantId: string) => {
    if (editingName.trim() && onParticipantNameChange) {
      onParticipantNameChange(participantId, editingName.trim());
    }
    setEditingId(null);
    setEditingName("");
  };

  const handleKeyDown = (e: React.KeyboardEvent, participantId: string) => {
    if (e.key === "Enter") {
      handleSaveEdit(participantId);
    } else if (e.key === "Escape") {
      setEditingId(null);
      setEditingName("");
    }
  };

  const handleDeleteClick = (participantId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirmId(participantId);
  };

  const handleConfirmDelete = () => {
    if (deleteConfirmId && onRemoveParticipant) {
      onRemoveParticipant(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmId(null);
  };

  return (
    <div className="mb-6 md:mb-8 rounded-3xl border border-slate-700/60 bg-slate-900/70 shadow-[0_4px_16px_rgba(0,0,0,0.25)] backdrop-blur overflow-hidden" style={{ boxShadow: 'inset 0 -1px 0 rgba(255,255,255,0.1), 0 4px 16px rgba(0,0,0,0.25)' }}>
      {/* Inspirational Header */}
      <div className="p-6 md:p-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center gap-4 md:gap-5"
        >
          {/* Icon */}
          <div className="flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-amber-300/20 to-amber-500/20 border border-amber-400/30">
            <Sparkles className="h-6 w-6 md:h-7 md:w-7 text-amber-300" />
          </div>

          {/* Main Title */}
          <h1 className="text-2xl md:text-4xl font-heading text-white tracking-tight">
            {t.title}
          </h1>

          {/* Subtitle */}
          <p className="text-sm md:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            {locale === 'es'
              ? 'Elige las actividades que darán forma a tu experiencia perfecta.'
              : 'Choose the activities that will shape your perfect experience.'}
          </p>
        </motion.div>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCancelDelete}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl p-6 md:p-8 max-w-md mx-4"
            >
              <div className="flex flex-col gap-4">
                {/* Title */}
                <h3 className="text-xl md:text-2xl font-bold text-white">
                  {t.confirmDelete}
                </h3>

                {/* Message */}
                <p className="text-slate-300 text-sm md:text-base">
                  {t.confirmDeleteMessage}
                </p>

                {/* Participant name */}
                {deleteConfirmId && (
                  <div className="bg-slate-800/50 rounded-lg px-4 py-3 border border-slate-700/50">
                    <p className="text-cyan-400 font-semibold">
                      {participantTabs.find(p => p.id === deleteConfirmId)?.name}
                    </p>
                  </div>
                )}

                {/* Buttons */}
                <div className="flex gap-3 mt-2">
                  <motion.button
                    onClick={handleCancelDelete}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 hover:border-slate-600 transition-all font-semibold"
                  >
                    {t.cancel}
                  </motion.button>
                  <motion.button
                    onClick={handleConfirmDelete}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 px-4 py-3 rounded-xl bg-red-500/20 border border-red-500/50 text-red-400 hover:bg-red-500/30 hover:border-red-500/70 transition-all font-semibold"
                  >
                    {t.delete}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default HeaderPersonalization;
