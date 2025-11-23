'use client';

import { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { motion } from 'framer-motion';

interface SurfProgram {
  id: 'fundamental' | 'progression' | 'highPerformance';
  name: string;
  level: string;
  tagline: string;
  price: string;
  includes: {
    title: string;
    items: string[];
  };
  sessions: {
    title: string;
    items: string[];
  };
}

interface SurfProgramSelectorProps {
  onSelectProgram?: (programId: string, price: number) => void;
  selectedProgramId?: string;
}

export default function SurfProgramSelector({
  onSelectProgram,
  selectedProgramId
}: SurfProgramSelectorProps) {
  const { t, raw } = useI18n();
  const [selectedProgram, setSelectedProgram] = useState<string | null>(selectedProgramId || null);

  // Get program data from translations
  const fundamentalData = raw<SurfProgram['includes']>('surfPrograms.programs.fundamental.includes');
  const fundamentalSessions = raw<SurfProgram['sessions']>('surfPrograms.programs.fundamental.sessions');
  const progressionData = raw<SurfProgram['includes']>('surfPrograms.programs.progression.includes');
  const progressionSessions = raw<SurfProgram['sessions']>('surfPrograms.programs.progression.sessions');
  const highPerformanceData = raw<SurfProgram['includes']>('surfPrograms.programs.highPerformance.includes');
  const highPerformanceSessions = raw<SurfProgram['sessions']>('surfPrograms.programs.highPerformance.sessions');

  const programs: SurfProgram[] = [
    {
      id: 'fundamental',
      name: t('surfPrograms.programs.fundamental.name'),
      level: t('surfPrograms.programs.fundamental.level'),
      tagline: t('surfPrograms.programs.fundamental.tagline'),
      price: t('surfPrograms.programs.fundamental.price'),
      includes: fundamentalData || { title: '', items: [] },
      sessions: fundamentalSessions || { title: '', items: [] },
    },
    {
      id: 'progression',
      name: t('surfPrograms.programs.progression.name'),
      level: t('surfPrograms.programs.progression.level'),
      tagline: t('surfPrograms.programs.progression.tagline'),
      price: t('surfPrograms.programs.progression.price'),
      includes: progressionData || { title: '', items: [] },
      sessions: progressionSessions || { title: '', items: [] },
    },
    {
      id: 'highPerformance',
      name: t('surfPrograms.programs.highPerformance.name'),
      level: t('surfPrograms.programs.highPerformance.level'),
      tagline: t('surfPrograms.programs.highPerformance.tagline'),
      price: t('surfPrograms.programs.highPerformance.price'),
      includes: highPerformanceData || { title: '', items: [] },
      sessions: highPerformanceSessions || { title: '', items: [] },
    },
  ];

  const handleSelectProgram = (program: SurfProgram) => {
    setSelectedProgram(program.id);
    if (onSelectProgram) {
      onSelectProgram(program.id, parseFloat(program.price));
    }
  };

  // Get method pillars
  const pillars = [
    {
      title: t('surfPrograms.method.pillars.biomechanics.title'),
      description: t('surfPrograms.method.pillars.biomechanics.description'),
    },
    {
      title: t('surfPrograms.method.pillars.coaching.title'),
      description: t('surfPrograms.method.pillars.coaching.description'),
    },
    {
      title: t('surfPrograms.method.pillars.feedback.title'),
      description: t('surfPrograms.method.pillars.feedback.description'),
    },
    {
      title: t('surfPrograms.method.pillars.mindset.title'),
      description: t('surfPrograms.method.pillars.mindset.description'),
    },
  ];

  return (
    <div className="w-full">
      {/* Header */}
      <div className="text-center mb-8 md:mb-12">
        <h1
          className="text-3xl md:text-4xl font-bold mb-3 font-heading"
          style={{ color: 'var(--brand-text)' }}
        >
          {t('surfPrograms.title')}
        </h1>
        <p
          className="text-base md:text-lg"
          style={{ color: 'var(--brand-text-dim)' }}
        >
          {t('surfPrograms.subtitle')}
        </p>
      </div>

      {/* Our Integrated Surf Coaching Method */}
      <div
        className="rounded-2xl p-6 md:p-8 mb-8 md:mb-12 border"
        style={{
          backgroundColor: 'var(--brand-surface)',
          borderColor: 'var(--brand-border)',
        }}
      >
        <h2
          className="text-2xl md:text-3xl font-bold mb-2 font-heading text-center"
          style={{ color: 'var(--brand-text)' }}
        >
          {t('surfPrograms.method.title')}
        </h2>
        <p
          className="text-center mb-6 md:mb-8 text-base"
          style={{ color: 'var(--brand-text-dim)' }}
        >
          {t('surfPrograms.method.subtitle')}
        </p>

        {/* Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {pillars.map((pillar, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 md:p-5 rounded-xl border"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--brand-surface) 50%, transparent)',
                borderColor: 'color-mix(in srgb, var(--brand-aqua) 30%, transparent)',
              }}
            >
              <h3
                className="text-base md:text-lg font-semibold mb-2"
                style={{ color: 'var(--brand-aqua)' }}
              >
                {pillar.title}
              </h3>
              <p
                className="text-sm md:text-base"
                style={{ color: 'var(--brand-text-dim)' }}
              >
                {pillar.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Programs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {programs.map((program, index) => (
          <motion.div
            key={program.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + index * 0.1 }}
            className={`rounded-2xl p-6 md:p-8 border-2 transition-all cursor-pointer ${
              selectedProgram === program.id ? 'ring-2 ring-offset-2' : ''
            }`}
            style={{
              backgroundColor: 'var(--brand-surface)',
              borderColor: selectedProgram === program.id ? 'var(--brand-gold)' : 'var(--brand-border)',
              ringColor: selectedProgram === program.id ? 'var(--brand-gold)' : undefined,
            }}
            onClick={() => handleSelectProgram(program)}
          >
            {/* Header */}
            <div className="mb-6">
              <h3
                className="text-2xl md:text-3xl font-bold mb-2 font-heading"
                style={{ color: 'var(--brand-text)' }}
              >
                {program.name}
              </h3>
              <p
                className="text-xs md:text-sm mb-3"
                style={{ color: 'var(--brand-text-dim)' }}
              >
                {program.level}
              </p>
              <p
                className="text-sm md:text-base mb-4 italic"
                style={{ color: 'var(--brand-text)' }}
              >
                &ldquo;{program.tagline}&rdquo;
              </p>
              <div className="flex items-baseline gap-2">
                <span
                  className="text-4xl md:text-5xl font-bold"
                  style={{ color: '#8c8179' }}
                >
                  ${program.price}
                </span>
              </div>
            </div>

            {/* Includes */}
            <div className="mb-6">
              <h4
                className="text-base md:text-lg font-semibold mb-3"
                style={{ color: 'var(--brand-text)' }}
              >
                {program.includes.title}
              </h4>
              <ul className="space-y-2">
                {program.includes.items.map((item, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 text-sm md:text-base"
                    style={{ color: 'var(--brand-text-dim)' }}
                  >
                    <span style={{ color: 'var(--brand-aqua)' }}>✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Divider */}
            <div
              className="h-px my-6"
              style={{ backgroundColor: 'var(--brand-border)' }}
            />

            {/* Sessions */}
            <div>
              <h4
                className="text-base md:text-lg font-semibold mb-3"
                style={{ color: 'var(--brand-text)' }}
              >
                {program.sessions.title}
              </h4>
              <ul className="space-y-3">
                {program.sessions.items.map((item, idx) => {
                  const [category, ...details] = item.split(':');
                  return (
                    <li key={idx} className="text-sm md:text-base">
                      <span
                        className="font-semibold"
                        style={{ color: 'var(--brand-text)' }}
                      >
                        {category}:
                      </span>
                      <span
                        className="ml-1"
                        style={{ color: 'var(--brand-text-dim)' }}
                      >
                        {details.join(':')}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Select Button */}
            <button
              className="w-full mt-6 py-3 px-6 rounded-xl font-semibold transition-all text-base md:text-lg"
              style={{
                backgroundColor: selectedProgram === program.id ? 'var(--brand-gold)' : 'transparent',
                color: selectedProgram === program.id ? 'var(--brand-dark)' : 'var(--brand-gold)',
                border: `2px solid var(--brand-gold)`,
              }}
              onClick={(e) => {
                e.stopPropagation();
                handleSelectProgram(program);
              }}
            >
              {selectedProgram === program.id ? 'Selected' : 'Select Program'}
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
