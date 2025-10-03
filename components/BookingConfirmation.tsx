'use client';

import React, { useState } from 'react';
import { useI18n } from '@/lib/i18n';

interface BookingConfirmationProps {
  amount: number;
  order_id: string;
  order_description: string;
  summary?: React.ReactNode;
}

const BookingConfirmation: React.FC<BookingConfirmationProps> = ({ amount, order_id, order_description, summary }) => {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [orderId, setOrderId] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Log para depuración
  console.log('BookingConfirmation props:', { amount, order_id, order_description });

  // Mostrar advertencia si falta algún prop
  if (!amount || !order_id || !order_description) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded shadow">
        <h2 className="text-2xl font-bold mb-4 font-heading">{t('payment.bookingConfirmation')}</h2>
        <div className="mb-4 text-red-600 font-semibold">{t('payment.missingPaymentData')}</div>
        <div className="mb-2"><b>Monto:</b> {amount ? amount + ' USD' : <span className="text-red-600">(no definido)</span>}</div>
        <div className="mb-2"><b>Descripción:</b> {order_description || <span className="text-red-600">(no definida)</span>}</div>
        <div className="mb-2"><b>ID de pedido:</b> {order_id || <span className="text-red-600">(no definido)</span>}</div>
      </div>
    );
  }

  const handlePay = async () => {
    setLoading(true);
    setOrderId(order_id);
    setError(null); // Limpiar errores anteriores

    // Consultar el mínimo permitido para usd -> usdcsol
    const minRes = await fetch('https://api.nowpayments.io/v1/min-amount?currency_from=usd&currency_to=usdcsol', {
      headers: { 'x-api-key': 'SF2615P-YQ04ZCY-GF4ECGV-XFZPW1X' }
    });
    const minData = await minRes.json();
    const minAmount = minData.min_amount || 0;
    if (amount < minAmount) {
      setError(`${t('payment.minimumAmount')} ${minAmount} USD.`);
      setLoading(false);
      return;
    }

    const res = await fetch('/api/payment/nowpayments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, order_id, order_description }),
    });
    const data = await res.json();
    if (data.invoice_url) {
      window.location.href = data.invoice_url;
    } else {
      setStatus(data.error ? `Error: ${data.error}` : t('payment.errorCreatingPayment'));
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (!orderId) return;
    let interval: NodeJS.Timeout;
    let tries = 0;
    const poll = async () => {
      tries++;
      const res = await fetch(`/api/payment/nowpayments/status?order_id=${orderId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.payment_status === 'finished' || data.payment_status === 'confirmed') {
          setStatus(t('payment.paymentSuccessful'));
          clearInterval(interval);
        } else if (data.payment_status === 'failed' || data.payment_status === 'expired') {
          setStatus(t('payment.paymentFailed'));
          clearInterval(interval);
        }
      }
      if (tries > 30) clearInterval(interval);
    };
    interval = setInterval(poll, 10000);
    return () => clearInterval(interval);
  }, [orderId]);

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-4 font-heading">{t('payment.bookingConfirmation')}</h2>
      {summary}
      <div className="mb-4">
        <p><b>Monto:</b> {amount} USD</p>
        <p><b>Descripción:</b> {order_description}</p>
        <p><b>ID de pedido:</b> {order_id}</p>
      </div>
      {error && <div className="mb-4 text-warm-600 font-semibold">{error}</div>}
      <button onClick={handlePay} disabled={loading} className="btn-primary w-full">
        {loading ? t('payment.redirectingToPayment') : t('payment.payWithCard')}
      </button>
      {status && <div className="mt-4 text-lg font-semibold">{status}</div>}
    </div>
  );
};

export default BookingConfirmation; 