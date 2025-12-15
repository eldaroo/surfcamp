"use client";

import { ChangeEvent, useMemo, useState } from "react";
import ActivitiesList from "../ActivitiesList";
import DateSelector from "../DateSelector";
import { useBookingStore } from "@/lib/store";
import { Sparkles } from "lucide-react";

interface HeaderPersonalizationProps {
  name: string;
  participants: number;
  locale: "es" | "en";
  onNameChange: (value: string) => void;
  onParticipantsChange: (value: number) => void;
}

const translations = {
  es: {
    activitiesTitle: "Personaliza tu experiencia",
    activitiesSubtitle: "Personaliza la experiencia antes de continuar.",
    datesTitle: "Selecciona tus fechas",
    datesSubtitle: "Elige fechas de check-in y check-out",
    participantLabel: "Participantes",
    participantSuffix: (count: number) => (count === 1 ? "huésped" : "huéspedes"),
    helper: "Elegí un programa de surf para habilitar el alojamiento.",
    chooseAccommodation: "Choose accommodation",
    backToActivities: "Volver a actividades",
  },
  en: {
    activitiesTitle: "Personalize your experience",
    activitiesSubtitle: "Personalize your experience before you continue.",
    datesTitle: "Select your dates",
    datesSubtitle: "Choose check-in and check-out dates",
    participantLabel: "Participants",
    participantSuffix: (count: number) => (count === 1 ? "guest" : "guests"),
    helper: "Choose a surf program to unlock accommodation.",
    chooseAccommodation: "Choose accommodation",
    backToActivities: "Back to activities",
  },
};

const HeaderPersonalization = ({
  locale,
}: HeaderPersonalizationProps) => {
  const t = translations[locale] ?? translations.en;
  const [showDates, setShowDates] = useState(false);
  const { selectedActivities, setLandingSectionsHidden } = useBookingStore();
  const hasSurfSelected = selectedActivities.some((a) => a.category === "surf");

  const displayTitle = showDates ? t.datesTitle : t.activitiesTitle;
  const displaySubtitle = showDates ? t.datesSubtitle : t.activitiesSubtitle;

  return (
    <div
      id="personalize-experience"
      className="mb-3 md:mb-4 rounded-3xl border border-amber-200 bg-white shadow-[0_4px_16px_rgba(0,0,0,0.25)] overflow-hidden"
    >
      <div className="bg-gradient-to-r from-amber-300/20 to-amber-500/20 border-b border-amber-400/30 px-5 md:px-8 py-5 flex flex-col gap-2 md:flex-row md:flex-wrap md:items-center md:justify-center md:text-center md:gap-4">
        <div className="hidden md:flex items-center justify-center w-12 h-12 rounded-full bg-amber-400/30 border border-amber-500/40 order-1">
          <Sparkles className="h-6 w-6 text-amber-700" />
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-black font-heading order-2 md:order-2 text-center md:text-center w-full">
          {displayTitle}
        </h2>
        <div className="flex items-center gap-3 order-3 md:order-3 w-full md:w-auto md:justify-center">
          <p className="text-sm md:text-base text-gray-700 mt-0 md:mt-1 text-center md:text-center w-full">
            You <strong>choose the rhythm</strong>, the intensity, and everything you want to live.
          </p>
        </div>
      </div>

      <div className="px-0 py-4 md:p-6 text-center bg-white">
        <div className="mt-6 text-left space-y-4">
          {!showDates ? (
            <>
              <ActivitiesList
                onChooseAccommodation={() => {
                  setLandingSectionsHidden(true);
                  setShowDates(true);
                }}
                hasSurfSelected={hasSurfSelected}
                helperText={t.helper}
              />
            </>
          ) : (
            <>
              <DateSelector />
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => setShowDates(false)}
                  className="inline-flex items-center justify-center rounded-2xl border border-black/10 bg-white text-black px-5 py-3 font-semibold shadow-md hover:bg-gray-50 transition"
                >
                  {t.backToActivities}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default HeaderPersonalization;
