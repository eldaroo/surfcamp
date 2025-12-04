'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, ArrowLeft, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useBookingStore } from '@/lib/store';
import PriceSummary from './PriceSummary';

export default function FindReservation() {
  const { t, locale } = useI18n();
  const { setBookingData, setCurrentStep } = useBookingStore();

  const [document, setDocument] = useState('');
  const [nationality, setNationality] = useState('ES'); // Default España
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');
  const [reservation, setReservation] = useState<any>(null);

  const handleSearch = async () => {
    if (!document.trim()) {
      setError(t('activities.enterDocument'));
      return;
    }

    setIsSearching(true);
    setError('');

    try {
      const response = await fetch('/api/find-reservation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          document: document.trim(),
          nationality: nationality
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || t('activities.reservationNotFound'));
        setReservation(null);
        return;
      }

      // Encontramos la reserva
      setReservation(data.reservation);
      setError('');
    } catch (err) {
      console.error('Error searching reservation:', err);
      setError(t('common.error'));
      setReservation(null);
    } finally {
      setIsSearching(false);
    }
  };

  const handleContinueWithReservation = () => {
    if (reservation) {
      // Guardar todos los datos necesarios de la reserva en el booking data
      setBookingData({
        existingReservationId: reservation.id,
        dni: document.trim(),
        // Datos de la reserva existente necesarios para el payment API
        checkIn: reservation.checkIn,
        checkOut: reservation.checkOut,
        guests: reservation.guests || 1,
        // Información de contacto del huésped
        contactInfo: {
          firstName: reservation.guestName?.split(' ')[0] || '',
          lastName: reservation.guestName?.split(' ').slice(1).join(' ') || '',
          email: reservation.email || '',
          phone: reservation.phone || '',
          dni: document.trim(),
          nationality,
        },
      });
      // Ir directamente a la página de pago
      setCurrentStep('payment');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        {/* Back Button */}
        <motion.button
          onClick={() => setCurrentStep('activities')}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.15 }}
          className="mb-6 flex items-center gap-2 text-sm font-semibold text-black bg-white px-4 py-2 rounded-xl shadow-md border border-black/10 hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4 text-black" />
          <span className="text-black">{t('common.back')}</span>
        </motion.button>

        {/* Payment Summary */}
        <div className="mb-6">
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl border border-white/50 shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-amber-300/20 to-amber-500/20 border-b border-amber-400/30 px-4 md:px-5 py-3">
              <h3 className="text-lg font-bold text-black font-heading">
                {t('prices.summary')}
              </h3>
            </div>
            <div className="p-4 md:p-5">
              <PriceSummary showContainer={false} hideTitle tone="neutral" />
            </div>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl border border-white/50 shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-amber-300/20 to-amber-500/20 border-b border-amber-400/30 px-6 md:px-8 py-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-amber-400/30 border border-amber-500/40">
                <Search className="w-6 h-6 text-amber-700" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-black font-heading">
                  {t('activities.findReservation')}
                </h2>
                <p className="text-sm md:text-base text-gray-700 mt-1">
                  {t('activities.enterDocument')}
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 md:px-8 py-8">
            {!reservation ? (
              <div className="space-y-6">
                {/* Nationality Selector */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {locale === 'es' ? 'Nacionalidad' : 'Nationality'}
                  </label>
                  <select
                    value={nationality}
                    onChange={(e) => {
                      setNationality(e.target.value);
                      setError('');
                    }}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-earth-400 focus:ring-2 focus:ring-earth-400/20 outline-none transition-all text-gray-900 bg-white"
                    disabled={isSearching}
                  >
                    {/* América */}
                    <optgroup label={locale === 'es' ? '🌎 América' : '🌎 Americas'}>
                      <option value="AR">🇦🇷 Argentina</option>
                      <option value="BO">🇧🇴 Bolivia</option>
                      <option value="BR">🇧🇷 Brasil</option>
                      <option value="CA">🇨🇦 {locale === 'es' ? 'Canadá' : 'Canada'}</option>
                      <option value="CL">🇨🇱 Chile</option>
                      <option value="CO">🇨🇴 Colombia</option>
                      <option value="CR">🇨🇷 Costa Rica</option>
                      <option value="CU">🇨🇺 Cuba</option>
                      <option value="EC">🇪🇨 Ecuador</option>
                      <option value="SV">🇸🇻 El Salvador</option>
                      <option value="GT">🇬🇹 Guatemala</option>
                      <option value="HT">🇭🇹 {locale === 'es' ? 'Haití' : 'Haiti'}</option>
                      <option value="HN">🇭🇳 Honduras</option>
                      <option value="JM">🇯🇲 Jamaica</option>
                      <option value="MX">🇲🇽 {locale === 'es' ? 'México' : 'Mexico'}</option>
                      <option value="NI">🇳🇮 Nicaragua</option>
                      <option value="PA">🇵🇦 {locale === 'es' ? 'Panamá' : 'Panama'}</option>
                      <option value="PY">🇵🇾 Paraguay</option>
                      <option value="PE">🇵🇪 {locale === 'es' ? 'Perú' : 'Peru'}</option>
                      <option value="DO">🇩🇴 {locale === 'es' ? 'República Dominicana' : 'Dominican Republic'}</option>
                      <option value="UY">🇺🇾 Uruguay</option>
                      <option value="US">🇺🇸 {locale === 'es' ? 'Estados Unidos' : 'United States'}</option>
                      <option value="VE">🇻🇪 Venezuela</option>
                    </optgroup>

                    {/* Europa */}
                    <optgroup label={locale === 'es' ? '🇪🇺 Europa' : '🇪🇺 Europe'}>
                      <option value="DE">🇩🇪 {locale === 'es' ? 'Alemania' : 'Germany'}</option>
                      <option value="AT">🇦🇹 Austria</option>
                      <option value="BE">🇧🇪 {locale === 'es' ? 'Bélgica' : 'Belgium'}</option>
                      <option value="BG">🇧🇬 Bulgaria</option>
                      <option value="HR">🇭🇷 {locale === 'es' ? 'Croacia' : 'Croatia'}</option>
                      <option value="DK">🇩🇰 {locale === 'es' ? 'Dinamarca' : 'Denmark'}</option>
                      <option value="SK">🇸🇰 {locale === 'es' ? 'Eslovaquia' : 'Slovakia'}</option>
                      <option value="SI">🇸🇮 {locale === 'es' ? 'Eslovenia' : 'Slovenia'}</option>
                      <option value="ES">🇪🇸 {locale === 'es' ? 'España' : 'Spain'}</option>
                      <option value="EE">🇪🇪 Estonia</option>
                      <option value="FI">🇫🇮 {locale === 'es' ? 'Finlandia' : 'Finland'}</option>
                      <option value="FR">🇫🇷 {locale === 'es' ? 'Francia' : 'France'}</option>
                      <option value="GR">🇬🇷 {locale === 'es' ? 'Grecia' : 'Greece'}</option>
                      <option value="NL">🇳🇱 {locale === 'es' ? 'Países Bajos' : 'Netherlands'}</option>
                      <option value="HU">🇭🇺 {locale === 'es' ? 'Hungría' : 'Hungary'}</option>
                      <option value="IE">🇮🇪 {locale === 'es' ? 'Irlanda' : 'Ireland'}</option>
                      <option value="IS">🇮🇸 {locale === 'es' ? 'Islandia' : 'Iceland'}</option>
                      <option value="IT">🇮🇹 Italia</option>
                      <option value="LV">🇱🇻 {locale === 'es' ? 'Letonia' : 'Latvia'}</option>
                      <option value="LT">🇱🇹 {locale === 'es' ? 'Lituania' : 'Lithuania'}</option>
                      <option value="LU">🇱🇺 {locale === 'es' ? 'Luxemburgo' : 'Luxembourg'}</option>
                      <option value="NO">🇳🇴 {locale === 'es' ? 'Noruega' : 'Norway'}</option>
                      <option value="PL">🇵🇱 {locale === 'es' ? 'Polonia' : 'Poland'}</option>
                      <option value="PT">🇵🇹 Portugal</option>
                      <option value="GB">🇬🇧 {locale === 'es' ? 'Reino Unido' : 'United Kingdom'}</option>
                      <option value="CZ">🇨🇿 {locale === 'es' ? 'República Checa' : 'Czech Republic'}</option>
                      <option value="RO">🇷🇴 {locale === 'es' ? 'Rumania' : 'Romania'}</option>
                      <option value="RU">🇷🇺 {locale === 'es' ? 'Rusia' : 'Russia'}</option>
                      <option value="SE">🇸🇪 {locale === 'es' ? 'Suecia' : 'Sweden'}</option>
                      <option value="CH">🇨🇭 Suiza</option>
                      <option value="UA">🇺🇦 {locale === 'es' ? 'Ucrania' : 'Ukraine'}</option>
                    </optgroup>

                    {/* Asia */}
                    <optgroup label={locale === 'es' ? '🌏 Asia' : '🌏 Asia'}>
                      <option value="SA">🇸🇦 {locale === 'es' ? 'Arabia Saudita' : 'Saudi Arabia'}</option>
                      <option value="CN">🇨🇳 {locale === 'es' ? 'China' : 'China'}</option>
                      <option value="KR">🇰🇷 {locale === 'es' ? 'Corea del Sur' : 'South Korea'}</option>
                      <option value="AE">🇦🇪 {locale === 'es' ? 'Emiratos Árabes' : 'UAE'}</option>
                      <option value="PH">🇵🇭 {locale === 'es' ? 'Filipinas' : 'Philippines'}</option>
                      <option value="IN">🇮🇳 India</option>
                      <option value="ID">🇮🇩 Indonesia</option>
                      <option value="IL">🇮🇱 Israel</option>
                      <option value="JP">🇯🇵 {locale === 'es' ? 'Japón' : 'Japan'}</option>
                      <option value="MY">🇲🇾 {locale === 'es' ? 'Malasia' : 'Malaysia'}</option>
                      <option value="PK">🇵🇰 {locale === 'es' ? 'Pakistán' : 'Pakistan'}</option>
                      <option value="SG">🇸🇬 Singapur</option>
                      <option value="TH">🇹🇭 {locale === 'es' ? 'Tailandia' : 'Thailand'}</option>
                      <option value="TW">🇹🇼 {locale === 'es' ? 'Taiwán' : 'Taiwan'}</option>
                      <option value="TR">🇹🇷 {locale === 'es' ? 'Turquía' : 'Turkey'}</option>
                      <option value="VN">🇻🇳 Vietnam</option>
                    </optgroup>

                    {/* África */}
                    <optgroup label={locale === 'es' ? '🌍 África' : '🌍 Africa'}>
                      <option value="DZ">🇩🇿 {locale === 'es' ? 'Argelia' : 'Algeria'}</option>
                      <option value="EG">🇪🇬 {locale === 'es' ? 'Egipto' : 'Egypt'}</option>
                      <option value="ET">🇪🇹 {locale === 'es' ? 'Etiopía' : 'Ethiopia'}</option>
                      <option value="KE">🇰🇪 {locale === 'es' ? 'Kenia' : 'Kenya'}</option>
                      <option value="MA">🇲🇦 {locale === 'es' ? 'Marruecos' : 'Morocco'}</option>
                      <option value="NG">🇳🇬 Nigeria</option>
                      <option value="ZA">🇿🇦 {locale === 'es' ? 'Sudáfrica' : 'South Africa'}</option>
                      <option value="TZ">🇹🇿 Tanzania</option>
                      <option value="TN">🇹🇳 {locale === 'es' ? 'Túnez' : 'Tunisia'}</option>
                    </optgroup>

                    {/* Oceanía */}
                    <optgroup label={locale === 'es' ? '🌏 Oceanía' : '🌏 Oceania'}>
                      <option value="AU">🇦🇺 Australia</option>
                      <option value="NZ">🇳🇿 {locale === 'es' ? 'Nueva Zelanda' : 'New Zealand'}</option>
                      <option value="FJ">🇫🇯 Fiji</option>
                    </optgroup>
                  </select>
                </div>

                {/* Document Input */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {locale === 'es' ? 'Número de documento' : 'ID Number'}
                  </label>
                  <input
                    type="text"
                    value={document}
                    onChange={(e) => {
                      setDocument(e.target.value);
                      setError('');
                    }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleSearch();
                      }
                    }}
                    placeholder={t('activities.documentPlaceholder')}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-earth-400 focus:ring-2 focus:ring-earth-400/20 outline-none transition-all text-gray-900 placeholder-gray-400"
                    disabled={isSearching}
                  />
                </div>

                {/* Loading Message */}
                {isSearching && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 border border-blue-200"
                  >
                    <Loader2 className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5 animate-spin" />
                    <p className="text-sm text-blue-700">
                      {locale === 'es'
                        ? 'Por favor tenga paciencia, la búsqueda puede demorar hasta 1 minuto...'
                        : 'Please be patient, the search may take up to 1 minute...'}
                    </p>
                  </motion.div>
                )}

                {/* Error Message */}
                {error && !isSearching && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col gap-3 p-4 rounded-xl bg-red-50 border border-red-200"
                  >
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                    {error.includes('No') && (
                      <div className="pl-8 text-sm text-gray-700 border-t border-red-200 pt-3">
                        <p className="font-semibold mb-2">
                          {locale === 'es' ? 'ℹ️ Nota importante:' : 'ℹ️ Important note:'}
                        </p>
                        <p>
                          {locale === 'es'
                            ? 'Si realizó su reserva mediante un motor de búsqueda (Booking, Expedia, etc.), es posible que su documento no esté asociado a la reserva en nuestro sistema. Por favor contáctenos al '
                            : 'If you made your reservation through a search engine (Booking, Expedia, etc.), your ID may not be associated with the reservation in our system. Please contact us at '}
                          <a
                            href="https://wa.me/541153695627"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-blue-600 hover:text-blue-700 underline"
                          >
                            +54 11 5369-5627
                          </a>
                          {locale === 'es' ? ' y lo asociaremos.' : ' and we will associate it.'}
                        </p>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Search Button */}
                <button
                  onClick={handleSearch}
                  disabled={isSearching || !document.trim()}
                  className="w-full px-6 py-4 bg-gradient-to-r from-earth-300 to-earth-400 text-white rounded-xl font-bold text-base shadow-lg hover:from-earth-200 hover:to-earth-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSearching ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {t('activities.searching')}
                    </>
                  ) : (
                    <>
                      <Search className="w-5 h-5" />
                      {t('activities.searchReservation')}
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Success Message */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-start gap-3 p-4 rounded-xl bg-green-50 border border-green-200"
                >
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-green-700">
                      {t('activities.reservationFound')}
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      {locale === 'es'
                        ? 'Se adjuntarán las actividades a tu reserva existente'
                        : 'Activities will be added to your existing reservation'}
                    </p>
                  </div>
                </motion.div>

                {/* Reservation Details */}
                <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                  <h3 className="text-lg font-bold text-gray-900">
                    {locale === 'es' ? 'Detalles de la reserva' : 'Reservation Details'}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {reservation.guestName && (
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">
                          {locale === 'es' ? 'Nombre' : 'Name'}
                        </p>
                        <p className="text-sm font-semibold text-gray-900 mt-1">
                          {reservation.guestName}
                        </p>
                      </div>
                    )}

                    {reservation.checkIn && reservation.checkOut && (
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">
                          {locale === 'es' ? 'Fechas' : 'Dates'}
                        </p>
                        <p className="text-sm font-semibold text-gray-900 mt-1">
                          {new Date(reservation.checkIn).toLocaleDateString(locale)} - {new Date(reservation.checkOut).toLocaleDateString(locale)}
                        </p>
                      </div>
                    )}

                    {reservation.roomType && (
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">
                          {locale === 'es' ? 'Alojamiento' : 'Accommodation'}
                        </p>
                        <p className="text-sm font-semibold text-gray-900 mt-1">
                          {reservation.roomType}
                        </p>
                      </div>
                    )}

                    {reservation.guests && (
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">
                          {locale === 'es' ? 'Huéspedes' : 'Guests'}
                        </p>
                        <p className="text-sm font-semibold text-gray-900 mt-1">
                          {reservation.guests}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => {
                      setReservation(null);
                      setDocument('');
                      setNationality('ES');
                      setError('');
                    }}
                    className="flex-1 px-6 py-3 rounded-xl border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-all font-semibold"
                  >
                    {locale === 'es' ? 'Buscar otra reserva' : 'Search another reservation'}
                  </button>
                  <button
                    onClick={handleContinueWithReservation}
                    className="flex-1 px-6 py-4 bg-gradient-to-r from-yellow-400 to-yellow-500 text-slate-900 rounded-xl font-bold text-base shadow-lg hover:from-yellow-300 hover:to-yellow-400 transition-all"
                  >
                    {t('activities.addToExistingReservation')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
