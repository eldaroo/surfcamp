"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Check } from "lucide-react";

interface PrivateCoachingUpsellModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
  locale: "es" | "en";
  upgradePrice: number;
}

const getContent = (upgradePrice: number) => ({
  title: {
    es: "Mejora a Coaching de Surf 1:1",
    en: "Upgrade to 1:1 Surf Coaching"
  },
  subtitle: {
    es: "Obtén la atención completa de un coach de surf de alto rendimiento en cada sesión. Progresa más rápido, corrige detalles al instante y disfruta de una experiencia completamente personalizada.",
    en: "Get the full attention of a high-performance surf coach in every session. Progress faster, correct details instantly and enjoy a completely personalized experience."
  },
  bullets: {
    es: [
      "Mejora más rápida: corrección técnica inmediata en cada ola.",
      "Coaching completamente personalizado: adaptamos cada sesión momento a momento.",
      "Enfoque exclusivo: sin clases compartidas (de lo contrario, podrías entrenar con 2–3 estudiantes por sesión)."
    ],
    en: [
      "Faster improvement: immediate technical correction on every wave.",
      "Fully personalized coaching: we adapt every session moment-to-moment.",
      "Exclusive focus: no shared classes (otherwise you might train with 2–3 students per session)."
    ]
  },
  priceText: {
    es: `Agrega coaching 1:1 a todo tu programa por +$${upgradePrice}`,
    en: `Add 1:1 coaching to your whole program for +$${upgradePrice}`
  },
  acceptButton: {
    es: `Agregar Coaching 1:1 (+$${upgradePrice})`,
    en: `Add 1:1 Coaching (+$${upgradePrice})`
  },
  declineButton: {
    es: "No gracias, continuar con mi plan",
    en: "No thanks, continue with my plan"
  }
});

export default function PrivateCoachingUpsellModal({
  isOpen,
  onClose,
  onAccept,
  locale,
  upgradePrice
}: PrivateCoachingUpsellModalProps) {
  const CONTENT = getContent(upgradePrice);

  const handleAccept = () => {
    onAccept();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 md:p-8 pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>

              {/* Content */}
              <div className="space-y-5">
                {/* Title */}
                <h2 className="text-2xl md:text-3xl font-bold text-black font-heading pr-8">
                  {CONTENT.title[locale]}
                </h2>

                {/* Subtitle */}
                <p className="text-sm md:text-base text-gray-700 leading-relaxed">
                  {CONTENT.subtitle[locale]}
                </p>

                {/* Value Bullets */}
                <div className="space-y-3 py-2">
                  {CONTENT.bullets[locale].map((bullet, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        <div className="w-5 h-5 rounded-full bg-amber-400/20 flex items-center justify-center">
                          <Check className="w-3 h-3 text-amber-600" />
                        </div>
                      </div>
                      <p className="text-sm md:text-base text-gray-800 flex-1">
                        {bullet}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Price Highlight */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <p className="text-base md:text-lg font-bold text-black text-center">
                    {CONTENT.priceText[locale]}
                  </p>
                </div>

                {/* Buttons */}
                <div className="space-y-3 pt-2">
                  {/* Primary CTA */}
                  <motion.button
                    onClick={handleAccept}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full bg-amber-400 hover:bg-amber-500 text-black font-bold py-4 px-6 rounded-xl transition-colors text-base md:text-lg"
                  >
                    {CONTENT.acceptButton[locale]}
                  </motion.button>

                  {/* Secondary link */}
                  <button
                    onClick={onClose}
                    className="w-full text-sm md:text-base text-gray-600 hover:text-gray-800 transition-colors py-2"
                  >
                    {CONTENT.declineButton[locale]}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
