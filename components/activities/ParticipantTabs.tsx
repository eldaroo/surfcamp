'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit2, Copy, CheckCircle2 } from 'lucide-react';

export interface Participant {
  id: string;
  name: string;
  isYou: boolean;
  activitiesCount: number;
}

interface ParticipantTabsProps {
  participants: Participant[];
  activeParticipantId: string;
  onParticipantChange: (participantId: string) => void;
  onParticipantNameChange: (participantId: string, name: string) => void;
  onAddParticipant?: () => void;
  onCopyChoicesToAll?: () => void;
  locale: 'es' | 'en';
}

const ParticipantTabs = ({
  participants,
  activeParticipantId,
  onParticipantChange,
  onParticipantNameChange,
  onAddParticipant,
  onCopyChoicesToAll,
  locale
}: ParticipantTabsProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const t = {
    es: {
      you: 'Tú',
      participant: 'Participante',
      addParticipant: 'Agregar participante',
      copyToAll: 'Copiar mis elecciones a todos',
      editName: 'Editar nombre',
      activitiesSelected: 'actividades seleccionadas'
    },
    en: {
      you: 'You',
      participant: 'Participant',
      addParticipant: 'Add participant',
      copyToAll: 'Copy my choices to all',
      editName: 'Edit name',
      activitiesSelected: 'activities selected'
    }
  };

  const copy = t[locale];

  const handleStartEdit = (participant: Participant) => {
    setEditingId(participant.id);
    setEditingName(participant.name);
  };

  const handleSaveEdit = (participantId: string) => {
    if (editingName.trim()) {
      onParticipantNameChange(participantId, editingName.trim());
    }
    setEditingId(null);
    setEditingName('');
  };

  const handleKeyDown = (e: React.KeyboardEvent, participantId: string) => {
    if (e.key === 'Enter') {
      handleSaveEdit(participantId);
    } else if (e.key === 'Escape') {
      setEditingId(null);
      setEditingName('');
    }
  };

  return (
    <div className="w-full">
      {/* Desktop: Horizontal scrollable tabs */}
      <div className="hidden md:block">
        <div className="flex items-center gap-3 overflow-x-auto pb-4 scrollbar-hide">
          <div className="flex items-center gap-3 min-w-full">
            {participants.map((participant) => (
              <motion.div
                key={participant.id}
                onClick={() => {
                  if (editingId !== participant.id) {
                    onParticipantChange(participant.id);
                  }
                }}
                whileHover={{ scale: editingId === participant.id ? 1 : 1.02 }}
                whileTap={{ scale: editingId === participant.id ? 1 : 0.98 }}
                className={`
                  relative flex items-center gap-3 px-5 py-3 rounded-2xl font-semibold
                  transition-all duration-300 whitespace-nowrap min-w-fit cursor-pointer
                  ${activeParticipantId === participant.id
                    ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-white border-2 border-cyan-400/50 shadow-lg shadow-cyan-500/20'
                    : 'bg-slate-800/50 text-slate-300 border border-slate-700/50 hover:bg-slate-700/50 hover:border-slate-600'
                  }
                `}
              >
                <div className="flex items-center gap-2 relative z-10">
                  {editingId === participant.id ? (
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onBlur={() => handleSaveEdit(participant.id)}
                      onKeyDown={(e) => handleKeyDown(e, participant.id)}
                      onClick={(e) => e.stopPropagation()}
                      autoFocus
                      className="bg-slate-900 border border-slate-600 rounded px-2 py-1 text-sm w-32 focus:outline-none focus:ring-2 focus:ring-cyan-400 text-white"
                    />
                  ) : (
                    <>
                      <span className="text-sm md:text-base">
                        {participant.name}
                        {participant.isYou && ` (${copy.you})`}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartEdit(participant);
                        }}
                        className="p-1 hover:bg-white/10 rounded transition-colors"
                        title={copy.editName}
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    </>
                  )}
                </div>

                {participant.activitiesCount > 0 && (
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-500 text-xs font-bold text-slate-900 relative z-10">
                    {participant.activitiesCount}
                  </span>
                )}

                {activeParticipantId === participant.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-500/10 to-blue-500/10 -z-0"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </motion.div>
            ))}

            {onAddParticipant && (
              <motion.button
                onClick={onAddParticipant}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-4 py-3 rounded-2xl border-2 border-dashed border-slate-600 text-slate-400 hover:border-cyan-400 hover:text-cyan-400 transition-colors whitespace-nowrap"
              >
                <span className="text-xl">+</span>
                <span className="text-sm font-medium">{copy.addParticipant}</span>
              </motion.button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile: Compact scrollable tabs */}
      <div className="block md:hidden">
        <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
          {participants.map((participant, index) => (
            <motion.div
              key={participant.id}
              onClick={() => {
                if (editingId !== participant.id) {
                  onParticipantChange(participant.id);
                }
              }}
              onDoubleClick={() => handleStartEdit(participant)}
              whileTap={{ scale: editingId === participant.id ? 1 : 0.95 }}
              className={`
                relative flex flex-col items-center gap-1 px-4 py-2.5 rounded-xl font-medium
                transition-all duration-300 min-w-[100px] snap-center flex-shrink-0 cursor-pointer
                ${activeParticipantId === participant.id
                  ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-white border border-cyan-400/50 shadow-lg'
                  : 'bg-slate-800/50 text-slate-400 border border-slate-700/30'
                }
              `}
            >
              {editingId === participant.id ? (
                <input
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onBlur={() => handleSaveEdit(participant.id)}
                  onKeyDown={(e) => handleKeyDown(e, participant.id)}
                  onClick={(e) => e.stopPropagation()}
                  autoFocus
                  className="bg-slate-900 border border-slate-600 rounded px-2 py-1 text-sm w-20 focus:outline-none focus:ring-2 focus:ring-cyan-400 text-white text-center"
                />
              ) : (
                <>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold truncate max-w-[70px]">
                      {participant.name}
                    </span>
                    {participant.activitiesCount > 0 && (
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-500 text-xs font-bold text-slate-900">
                        {participant.activitiesCount}
                      </span>
                    )}
                  </div>
                  {participant.isYou && (
                    <span className="text-xs text-cyan-400">{copy.you}</span>
                  )}
                </>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Copy to All Button - Only show if multiple participants */}
      {onCopyChoicesToAll && participants.length > 1 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 flex justify-center md:justify-start"
        >
          <button
            onClick={onCopyChoicesToAll}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/50 border border-slate-700 text-slate-300 hover:bg-slate-700/50 hover:border-cyan-400/50 hover:text-white transition-all text-sm font-medium"
          >
            <Copy className="w-4 h-4" />
            <span>{copy.copyToAll}</span>
          </button>
        </motion.div>
      )}

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

export default ParticipantTabs;
