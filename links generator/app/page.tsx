'use client';

import { FormEvent, useMemo, useState } from 'react';
import type { SurfProgram } from '@/lib/wetravel';

type MinimalForm = {
  fullName: string;
  surfProgram: SurfProgram | '';
  checkIn: string;
  checkOut: string;
  totalPrice: number;
};

type ApiResult = {
  success?: boolean;
  error?: string;
  paymentUrl?: string | null;
  tripId?: string | null;
  tripTitle?: string;
  tripDescription?: string;
  tripDates?: {
    startDate: string;
    endDate: string;
  };
  paymentBreakdown?: {
    depositAmount: number;
    remainingBalance: number;
    accommodationDeposit: number;
    programDifference: number;
    coachingCost: number;
    detectedPrograms: SurfProgram[];
    coachingPrograms: SurfProgram[];
  };
  payloadSent?: unknown;
};

export default function HomePage() {
  const [form, setForm] = useState<MinimalForm>({
    fullName: '',
    surfProgram: '',
    checkIn: '',
    checkOut: '',
    totalPrice: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<ApiResult | null>(null);

  const participantSummary = useMemo(() => {
    if (!form.surfProgram) {
      return 'Without a surf program selected, the deposit falls back to 10% of the total price.';
    }

    return 'With a surf program selected, the tool estimates accommodation as total minus the program price for one participant.';
  }, [form.surfProgram]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setResult(null);

    try {
      const response = await fetch('/api/generate-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      });

      const data = (await response.json()) as ApiResult;
      setResult(data);
    } catch (error) {
      setResult({
        error: error instanceof Error ? error.message : 'Unknown request error',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  function updateField<K extends keyof typeof form>(field: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  return (
    <main className="page-shell">
      <section className="hero">
        <span className="eyebrow">Independent WeTravel tool</span>
        <h1>Links Generator</h1>
        <p>
          Carga los datos mínimos, calcula el depósito con la lógica extraída del proyecto principal
          y genera el payment link directo en WeTravel.
        </p>
      </section>

      <div className="layout">
        <form className="card form-card" onSubmit={handleSubmit}>
          <section className="section">
            <h2 className="section-title">Simple input</h2>
            <div className="grid">
              <label className="field full">
                <span className="label">Name</span>
                <input
                  className="input"
                  value={form.fullName}
                  onChange={(event) => updateField('fullName', event.target.value)}
                  placeholder="John Doe"
                />
              </label>
              <label className="field">
                <span className="label">Surf program</span>
                <select
                  className="select"
                  value={form.surfProgram}
                  onChange={(event) =>
                    updateField('surfProgram', event.target.value as SurfProgram | '')
                  }
                >
                  <option value="">No surf program</option>
                  <option value="fundamental">Fundamental</option>
                  <option value="progressionPlus">Progression Plus</option>
                  <option value="highPerformance">High Performance</option>
                </select>
              </label>
              <label className="field">
                <span className="label">Check-in</span>
                <input
                  className="input"
                  type="date"
                  value={form.checkIn}
                  onChange={(event) => updateField('checkIn', event.target.value)}
                />
              </label>
              <label className="field">
                <span className="label">Check-out</span>
                <input
                  className="input"
                  type="date"
                  value={form.checkOut}
                  onChange={(event) => updateField('checkOut', event.target.value)}
                />
              </label>
              <label className="field full">
                <span className="label">Total price</span>
                <input
                  className="input"
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.totalPrice}
                  onChange={(event) => updateField('totalPrice', Number(event.target.value))}
                />
              </label>
            </div>
            <p className="hint">{participantSummary}</p>
            <p className="hint">
              Email, guest count and room label are generated internally to keep the form minimal.
            </p>
          </section>

          <div className="toolbar">
            <button className="button primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Generating link...' : 'Generate WeTravel link'}
            </button>
          </div>

          {result?.error && (
            <div className="status-box error">
              <strong>Error</strong>
              <div className="small">{result.error}</div>
            </div>
          )}
        </form>

        <aside className="card result-card">
          <h2 className="section-title">Result</h2>
          <p className="small">
            El backend devuelve el link, el breakdown aplicado y el payload enviado a WeTravel.
          </p>

          {result?.paymentBreakdown ? (
            <dl className="result-list">
              <div className="result-item">
                <dt>Deposit amount</dt>
                <dd>${result.paymentBreakdown.depositAmount}</dd>
              </div>
              <div className="result-item">
                <dt>Remaining balance</dt>
                <dd>${result.paymentBreakdown.remainingBalance}</dd>
              </div>
              <div className="result-item">
                <dt>Accommodation deposit</dt>
                <dd>${result.paymentBreakdown.accommodationDeposit}</dd>
              </div>
              <div className="result-item">
                <dt>Program difference</dt>
                <dd>${result.paymentBreakdown.programDifference}</dd>
              </div>
              <div className="result-item">
                <dt>Coaching cost</dt>
                <dd>${result.paymentBreakdown.coachingCost}</dd>
              </div>
              <div className="result-item">
                <dt>Trip title</dt>
                <dd>{result.tripTitle}</dd>
              </div>
              <div className="result-item">
                <dt>Trip description</dt>
                <dd style={{ whiteSpace: 'pre-wrap' }}>{result.tripDescription}</dd>
              </div>
              <div className="result-item">
                <dt>Trip dates sent</dt>
                <dd>
                  {result.tripDates?.startDate} to {result.tripDates?.endDate}
                </dd>
              </div>
              <div className="result-item">
                <dt>Trip ID</dt>
                <dd>{result.tripId || 'Not returned yet'}</dd>
              </div>
            </dl>
          ) : (
            <div className="result-item">
              <dt>Waiting</dt>
              <dd>Generate a link to see the calculated output.</dd>
            </div>
          )}

          {result?.paymentUrl && (
            <div className="link-box">
              <strong>Payment link ready</strong>
              <div className="small" style={{ marginTop: 8 }}>
                <a href={result.paymentUrl} target="_blank" rel="noreferrer">
                  {result.paymentUrl}
                </a>
              </div>
            </div>
          )}

          {result?.payloadSent && (
            <div className="result-item" style={{ marginTop: 18 }}>
              <dt>Payload sent to WeTravel</dt>
              <dd>
                <pre
                  style={{
                    margin: 0,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    fontSize: 12,
                    lineHeight: 1.45,
                  }}
                >
                  {JSON.stringify(result.payloadSent, null, 2)}
                </pre>
              </dd>
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}
