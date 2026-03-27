'use client';

import { useSearchParams, useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';

type PageStatus = 'loading' | 'success' | 'timeout' | 'error';

interface BookingData {
  contactInfo?: { firstName?: string; lastName?: string; email?: string };
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  roomTypeId?: string;
  locale?: string;
}

interface PaymentStatusResponse {
  found: boolean;
  show_success?: boolean;
  payment?: { status: string };
  order?: { booking_data?: BookingData; lobbypms_reservation_id?: string };
}

const POLL_INTERVAL_MS = 3000;
// After 2 minutes of polling, switch to timeout state and tell user to check email
const MAX_POLL_MS = 2 * 60 * 1000;

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const params = useParams();
  const router = useRouter();

  const locale = (params?.locale as string) ?? 'es';
  const orderId = searchParams?.get('order_id');

  const [status, setStatus] = useState<PageStatus>('loading');
  const [bookingData, setBookingData] = useState<BookingData | null>(null);
  const [reservationId, setReservationId] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const confirmedRef = useRef(false);

  const isEs = locale === 'es';

  const stopPolling = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
  };

  const checkStatus = async () => {
    if (confirmedRef.current || !orderId) return;

    try {
      const res = await fetch(`/api/payment-status?order_id=${encodeURIComponent(orderId)}`);
      if (!res.ok) return;
      const data: PaymentStatusResponse = await res.json();

      if (data.show_success) {
        confirmedRef.current = true;
        stopPolling();
        setBookingData(data.order?.booking_data ?? null);
        setReservationId(data.order?.lobbypms_reservation_id ?? null);
        setStatus('success');
      } else {
        setRetryCount(c => c + 1);
      }
    } catch {
      // network error — keep polling
    }
  };

  useEffect(() => {
    if (!orderId) {
      setStatus('error');
      return;
    }

    // Immediate check, then poll every 3 s
    checkStatus();
    pollRef.current = setInterval(checkStatus, POLL_INTERVAL_MS);

    // After MAX_POLL_MS without success, stop and show timeout state
    timeoutRef.current = setTimeout(() => {
      if (!confirmedRef.current) {
        stopPolling();
        setStatus('timeout');
      }
    }, MAX_POLL_MS);

    // Re-check immediately when the tab becomes visible again (in case of focus recovery)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && !confirmedRef.current) checkStatus();
    };
    const handleFocus = () => { if (!confirmedRef.current) checkStatus(); };
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleFocus);

    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const formatDate = (d?: string) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString(isEs ? 'es-CR' : 'en-US', {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
    });
  };

  // ── Loading state ──────────────────────────────────────────────────────────
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-amber-400/30 border-t-amber-400 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-white mb-2">
            {isEs ? 'Verificando tu pago…' : 'Verifying your payment…'}
          </h1>
          <p className="text-slate-400 text-sm">
            {isEs
              ? 'Esto solo toma unos segundos. No cierres esta página.'
              : 'This only takes a few seconds. Please keep this page open.'}
          </p>
          {retryCount > 5 && (
            <p className="text-slate-500 text-xs mt-4 animate-pulse">
              {isEs
                ? 'Tu pago está siendo procesado por el banco…'
                : 'Your payment is being processed by the bank…'}
            </p>
          )}
        </div>
      </div>
    );
  }

  // ── Success state ──────────────────────────────────────────────────────────
  if (status === 'success') {
    const name = bookingData?.contactInfo
      ? `${bookingData.contactInfo.firstName ?? ''} ${bookingData.contactInfo.lastName ?? ''}`.trim()
      : '';

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="max-w-lg w-full">
          {/* Check icon */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-green-400/40">
              <svg className="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {isEs ? '¡Reserva Confirmada!' : 'Booking Confirmed!'}
            </h1>
            <p className="text-green-400 font-medium">
              {isEs ? 'Tu pago fue procesado exitosamente.' : 'Your payment was processed successfully.'}
            </p>
          </div>

          {/* Booking summary card */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 mb-6 space-y-4">
            {name && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">{isEs ? 'Nombre' : 'Name'}</span>
                <span className="text-white font-medium">{name}</span>
              </div>
            )}
            {bookingData?.checkIn && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">{isEs ? 'Check-in' : 'Check-in'}</span>
                <span className="text-white font-medium">{formatDate(bookingData.checkIn)}</span>
              </div>
            )}
            {bookingData?.checkOut && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">{isEs ? 'Check-out' : 'Check-out'}</span>
                <span className="text-white font-medium">{formatDate(bookingData.checkOut)}</span>
              </div>
            )}
            {bookingData?.guests && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">{isEs ? 'Huéspedes' : 'Guests'}</span>
                <span className="text-white font-medium">{bookingData.guests}</span>
              </div>
            )}
            {reservationId && !reservationId.startsWith('CREATING_') && (
              <div className="flex justify-between text-sm border-t border-white/10 pt-3">
                <span className="text-slate-400">{isEs ? 'Nº de Reserva' : 'Reservation #'}</span>
                <span className="text-amber-400 font-mono font-medium">{reservationId}</span>
              </div>
            )}
          </div>

          <p className="text-center text-slate-400 text-sm mb-6">
            {isEs
              ? 'Recibirás un correo de confirmación en breve. ¡Nos vemos en Zeneidas!'
              : "You'll receive a confirmation email shortly. See you at Zeneidas!"}
          </p>

          <button
            onClick={() => router.push(`/${locale}`)}
            className="w-full py-3 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 rounded-xl font-bold hover:from-amber-300 hover:to-amber-400 transition-all"
          >
            {isEs ? 'Volver al inicio' : 'Back to home'}
          </button>
        </div>
      </div>
    );
  }

  // ── Timeout state ─────────────────────────────────────────────────────────
  if (status === 'timeout') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-amber-400/40">
            <svg className="w-8 h-8 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">
            {isEs ? 'Pago en proceso…' : 'Payment processing…'}
          </h1>
          <p className="text-slate-400 text-sm mb-6">
            {isEs
              ? 'Tu pago fue recibido pero la confirmación está tardando un poco. Recibirás un correo en cuanto se confirme tu reserva.'
              : 'Your payment was received but confirmation is taking longer than expected. You\'ll get an email as soon as your booking is confirmed.'}
          </p>
          <button
            onClick={() => {
              confirmedRef.current = false;
              setStatus('loading');
              setRetryCount(0);
              checkStatus();
              pollRef.current = setInterval(checkStatus, POLL_INTERVAL_MS);
              timeoutRef.current = setTimeout(() => {
                if (!confirmedRef.current) { stopPolling(); setStatus('timeout'); }
              }, MAX_POLL_MS);
            }}
            className="w-full py-3 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 rounded-xl font-bold hover:from-amber-300 hover:to-amber-400 transition-all mb-3"
          >
            {isEs ? 'Verificar de nuevo' : 'Check again'}
          </button>
          <button
            onClick={() => router.push(`/${locale}`)}
            className="w-full py-3 bg-white/10 text-white rounded-xl font-semibold hover:bg-white/20 transition-all"
          >
            {isEs ? 'Volver al inicio' : 'Back to home'}
          </button>
        </div>
      </div>
    );
  }

  // ── Error state (no order_id) ──────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-red-400/40">
          <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-white mb-3">
          {isEs ? 'No se pudo verificar el pago' : 'Could not verify payment'}
        </h1>
        <p className="text-slate-400 text-sm mb-6">
          {isEs
            ? 'No encontramos información de tu pago. Si realizaste un pago, revisa tu correo o contáctanos.'
            : "We couldn't find your payment information. If you completed a payment, check your email or contact us."}
        </p>
        <button
          onClick={() => router.push(`/${locale}`)}
          className="w-full py-3 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 rounded-xl font-bold hover:from-amber-300 hover:to-amber-400 transition-all"
        >
          {isEs ? 'Volver al inicio' : 'Back to home'}
        </button>
      </div>
    </div>
  );
}
