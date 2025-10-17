'use client';

import { motion } from 'framer-motion';
import { X, CheckCircle2, User } from 'lucide-react';
import { Activity } from '@/types';

interface ParticipantSummary {
  id: string;
  name: string;
  isYou: boolean;
  selectedActivities: Activity[];
  activityQuantities: Record<string, number>;
  selectedYogaPackages: Record<string, '1-class' | '3-classes' | '10-classes'>;
  selectedSurfClasses: Record<string, number>;
}

interface OverviewSummaryProps {
  participants: ParticipantSummary[];
  onClose: () => void;
  onContinue: () => void;
  locale: 'es' | 'en';
}

const OverviewSummary = ({
  participants,
  onClose,
  onContinue,
  locale
}: OverviewSummaryProps) => {
  const t = {
    es: {
      title: 'Resumen de selecciones',
      subtitle: 'Revisa las actividades seleccionadas por cada participante',
      you: 'Tú',
      noActivities: 'Sin actividades seleccionadas',
      activities: 'actividades',
      activity: 'actividad',
      classes: 'clases',
      class: 'clase',
      close: 'Cerrar',
      continue: 'Continuar',
      totalParticipants: 'Total de participantes'
    },
    en: {
      title: 'Selections Overview',
      subtitle: 'Review the activities selected by each participant',
      you: 'You',
      noActivities: 'No activities selected',
      activities: 'activities',
      activity: 'activity',
      classes: 'classes',
      class: 'class',
      close: 'Close',
      continue: 'Continue',
      totalParticipants: 'Total participants'
    }
  };

  const copy = t[locale];

  const getActivityDetails = (
    activity: Activity,
    participant: ParticipantSummary
  ): string => {
    if (activity.category === 'yoga') {
      const pkg = participant.selectedYogaPackages[activity.id];
      if (pkg) {
        const count = pkg === '1-class' ? 1 : pkg === '3-classes' ? 3 : 10;
        return `(${count} ${count === 1 ? copy.class : copy.classes})`;
      }
    } else if (activity.category === 'surf') {
      const classes = participant.selectedSurfClasses[activity.id];
      if (classes) {
        return `(${classes} ${classes === 1 ? copy.class : copy.classes})`;
      }
    } else if (participant.activityQuantities[activity.id]) {
      const qty = participant.activityQuantities[activity.id];
      return `(${qty}x)`;
    }
    return '';
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl max-h-[85vh] overflow-hidden rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-b border-slate-700 px-6 md:px-8 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-1">
                {copy.title}
              </h2>
              <p className="text-sm md:text-base text-slate-400">
                {copy.subtitle}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-slate-800 transition-colors text-slate-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(85vh-180px)] px-6 md:px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {participants.map((participant, index) => (
              <motion.div
                key={participant.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5 md:p-6"
              >
                {/* Participant Header */}
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-700/50">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-400/30">
                    <User className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {participant.name}
                      {participant.isYou && (
                        <span className="ml-2 text-sm text-cyan-400">
                          ({copy.you})
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {participant.selectedActivities.length}{' '}
                      {participant.selectedActivities.length === 1
                        ? copy.activity
                        : copy.activities}
                    </p>
                  </div>
                </div>

                {/* Activities List */}
                <div className="space-y-2">
                  {participant.selectedActivities.length === 0 ? (
                    <p className="text-sm text-slate-500 italic text-center py-4">
                      {copy.noActivities}
                    </p>
                  ) : (
                    participant.selectedActivities.map((activity) => (
                      <div
                        key={activity.id}
                        className="flex items-start gap-2 p-3 rounded-xl bg-slate-900/50 border border-slate-700/30"
                      >
                        <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white">
                            {activity.name}
                          </p>
                          {getActivityDetails(activity, participant) && (
                            <p className="text-xs text-slate-400 mt-0.5">
                              {getActivityDetails(activity, participant)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-slate-900 border-t border-slate-700 px-6 md:px-8 py-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-slate-400">
              <span className="font-semibold text-white">
                {participants.length}
              </span>{' '}
              {copy.totalParticipants}
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
              <button
                onClick={onClose}
                className="flex-1 sm:flex-none px-6 py-3 rounded-xl border border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white transition-all font-medium"
              >
                {copy.close}
              </button>
              <button
                onClick={onContinue}
                className="flex-1 sm:flex-none px-8 py-3 rounded-xl bg-gradient-to-r from-amber-300 to-amber-400 text-slate-900 hover:from-amber-200 hover:to-amber-300 transition-all font-semibold shadow-lg shadow-amber-300/40"
              >
                {copy.continue}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default OverviewSummary;
