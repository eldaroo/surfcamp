'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBookingStore } from '@/lib/store';
import { User, Users, Plus, ChevronDown, Check } from 'lucide-react';

export default function ActiveParticipantBanner() {
  const {
    participants,
    activeParticipantId,
    setActiveParticipant,
    addParticipant,
    updateParticipantName,
  } = useBookingStore();

  const [showDropdown, setShowDropdown] = useState(false);
  const [showTransition, setShowTransition] = useState(false);
  const [transitionName, setTransitionName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');

  const activeParticipant = participants.find(p => p.id === activeParticipantId);
  const activitiesCount = activeParticipant?.selectedActivities.length || 0;

  const handleSwitchParticipant = (participantId: string) => {
    const newParticipant = participants.find(p => p.id === participantId);
    if (!newParticipant || participantId === activeParticipantId) {
      setShowDropdown(false);
      return;
    }

    // Show transition animation
    setTransitionName(newParticipant.name);
    setShowTransition(true);

    // Switch participant
    setTimeout(() => {
      setActiveParticipant(participantId);
      setShowDropdown(false);
    }, 300);

    // Hide transition
    setTimeout(() => {
      setShowTransition(false);
    }, 2000);
  };

  const handleAddParticipant = () => {
    addParticipant();
    setShowDropdown(false);

    // Show transition for new participant
    const newCount = participants.length + 1;
    setTransitionName(`Participant ${newCount}`);
    setShowTransition(true);
    setTimeout(() => setShowTransition(false), 2000);
  };

  const handleNameEdit = () => {
    if (!activeParticipant) return;
    setEditedName(activeParticipant.name);
    setIsEditingName(true);
  };

  const handleNameSave = () => {
    if (activeParticipant && editedName.trim()) {
      updateParticipantName(activeParticipant.id, editedName.trim());
    }
    setIsEditingName(false);
  };

  const handleNameCancel = () => {
    setIsEditingName(false);
    setEditedName('');
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setShowDropdown(false);
    if (showDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showDropdown]);

  if (!activeParticipant) return null;

  return (
    <>
      {/* Main Banner - Desktop: floating top-right, Mobile: full-width top */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-0 left-0 right-0 md:top-4 md:left-auto md:right-4 z-40 md:max-w-sm"
      >
        <div
          className="relative backdrop-blur-md bg-[rgba(12,25,45,0.85)] border-b md:border border-blue-400/20 rounded-b-2xl md:rounded-2xl shadow-2xl overflow-hidden"
          style={{
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(59, 130, 246, 0.1)',
          }}
        >
          {/* Decorative gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 pointer-events-none" />

          <div className="relative p-4 space-y-3">
            {/* Header with participant info */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-blue-300 font-medium tracking-wide uppercase">
                    Active Participant
                  </p>
                  {isEditingName ? (
                    <div className="flex items-center space-x-2 mt-1">
                      <input
                        type="text"
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleNameSave();
                          if (e.key === 'Escape') handleNameCancel();
                        }}
                        className="bg-blue-950/50 border border-blue-400/30 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-blue-400"
                        autoFocus
                      />
                      <button
                        onClick={handleNameSave}
                        className="text-green-400 hover:text-green-300"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <h3
                      className="text-white font-serif text-lg font-semibold truncate cursor-pointer hover:text-blue-300 transition-colors"
                      onClick={handleNameEdit}
                      title="Click to edit name"
                    >
                      {activeParticipant.name}
                      {activeParticipant.isYou && (
                        <span className="ml-2 text-sm text-yellow-400">(You)</span>
                      )}
                    </h3>
                  )}
                </div>
              </div>
            </div>

            {/* Progress indicator */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-300">
                <span className="text-blue-400 font-semibold">{activitiesCount}</span>
                {' '}
                {activitiesCount === 1 ? 'activity' : 'activities'} selected
              </span>
            </div>

            {/* Action buttons */}
            <div className="flex items-center space-x-2">
              {/* Switch participant dropdown */}
              <div className="relative flex-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDropdown(!showDropdown);
                  }}
                  className="w-full flex items-center justify-between px-4 py-2.5 bg-blue-950/50 hover:bg-blue-900/50 border border-blue-400/30 rounded-xl text-white transition-all duration-200 group"
                >
                  <span className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-medium">Switch</span>
                  </span>
                  <ChevronDown className={`w-4 h-4 text-blue-400 transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown menu */}
                <AnimatePresence>
                  {showDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-[rgba(12,25,45,0.95)] backdrop-blur-md border border-blue-400/20 rounded-xl shadow-2xl overflow-hidden z-50"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="max-h-64 overflow-y-auto">
                        {participants.map((participant) => (
                          <button
                            key={participant.id}
                            onClick={() => handleSwitchParticipant(participant.id)}
                            className={`w-full px-4 py-3 flex items-center justify-between text-left hover:bg-blue-900/30 transition-colors ${
                              participant.id === activeParticipantId ? 'bg-blue-900/20' : ''
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                participant.id === activeParticipantId
                                  ? 'bg-blue-500'
                                  : 'bg-gray-700'
                              }`}>
                                <User className="w-4 h-4 text-white" />
                              </div>
                              <div>
                                <p className="text-white font-medium">
                                  {participant.name}
                                  {participant.isYou && (
                                    <span className="ml-2 text-xs text-yellow-400">(You)</span>
                                  )}
                                </p>
                                <p className="text-xs text-gray-400">
                                  {participant.selectedActivities.length} activities
                                </p>
                              </div>
                            </div>
                            {participant.id === activeParticipantId && (
                              <Check className="w-5 h-5 text-blue-400" />
                            )}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Add participant button */}
              <button
                onClick={handleAddParticipant}
                className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 rounded-xl text-gray-900 font-semibold transition-all duration-200 shadow-lg hover:shadow-yellow-500/25"
                title="Add new participant"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm hidden sm:inline">Add</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Transition overlay */}
      <AnimatePresence>
        {showTransition && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.2, opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-3xl px-12 py-8 shadow-2xl"
            >
              <div className="text-center">
                <motion.div
                  initial={{ rotate: 0 }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                  className="inline-block mb-4"
                >
                  <User className="w-16 h-16 text-white" />
                </motion.div>
                <h2 className="text-3xl font-serif font-bold text-white mb-2">
                  Now booking for:
                </h2>
                <p className="text-5xl font-serif font-bold text-yellow-300">
                  {transitionName} 🌊
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
