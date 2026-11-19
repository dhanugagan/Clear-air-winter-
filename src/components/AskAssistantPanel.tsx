/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FormEvent, useState } from 'react';
import { MessageSquare, Send } from 'lucide-react';
import { motion } from 'motion/react';
import {
  AirQualitySnapshot,
  AskQuestionResponse,
  HouseholdProfile,
} from '../shared/airQuality';

const SAMPLE_QUESTIONS = [
  'Is it safe for children to walk to school this morning?',
  'How do I vent cooking fumes without pulling winter smog inside?',
  'How effective is a DIY box-fan filter in our main living room?',
  'What single habit swap cuts our household winter emissions most?',
];

interface AskAssistantPanelProps {
  snapshot: AirQualitySnapshot | null;
  profile: HouseholdProfile;
}

export function AskAssistantPanel({ snapshot, profile }: AskAssistantPanelProps) {
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState<AskQuestionResponse | null>(null);
  const [isAsking, setIsAsking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitQuestion = async (rawText: string) => {
    const trimmed = rawText.trim();
    if (trimmed.length < 4) {
      setError('Please type a question of at least 4 characters.');
      return;
    }

    setIsAsking(true);
    setError(null);

    try {
      const res = await fetch('/api/assistant/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: trimmed,
          profile,
          airQuality: snapshot,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Could not retrieve an answer.');
      }
      setResponse(data as AskQuestionResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to contact advisor.');
    } finally {
      setIsAsking(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    void submitQuestion(question);
  };

  return (
    <section
      id="ask-assistant"
      aria-labelledby="ask-heading"
      className="mx-auto max-w-7xl px-4 py-6 pb-12 sm:px-6 lg:px-8"
    >
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
        <div className="flex flex-col gap-2 border-b border-slate-100 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="ask-heading" className="font-display text-2xl font-bold text-slate-900">
              Ask the Clean-Air Advisor
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Get immediate answers grounded in {snapshot ? `${snapshot.locationName}'s` : 'your city'} live
              PM2.5 ({snapshot ? `${snapshot.pm25} µg/m³` : '—'}) and your home profile.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
            <MessageSquare className="h-3.5 w-3.5 text-teal-700" aria-hidden="true" />
            Context-aware guidance
          </span>
        </div>

        {/* Starter Question Buttons */}
        <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="Suggested questions">
          {SAMPLE_QUESTIONS.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => {
                setQuestion(q);
                void submitQuestion(q);
              }}
              disabled={isAsking}
              className="min-h-[36px] rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-left text-xs font-medium text-slate-700 transition-colors hover:border-teal-300 hover:bg-teal-50 hover:text-teal-900 disabled:opacity-60"
            >
              {q}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3 sm:flex-row">
          <label htmlFor="ask-question-input" className="sr-only">
            Ask a question about winter air quality or indoor protection
          </label>
          <input
            id="ask-question-input"
            type="text"
            maxLength={400}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask about outdoor exercise timing, stove ventilation, mask fit, or commuting..."
            className="min-h-[44px] flex-1 rounded-lg border border-slate-300 bg-white px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-700 focus:outline-none"
          />
          <button
            type="submit"
            disabled={isAsking}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:opacity-60 whitespace-nowrap shrink-0"
          >
            <Send className="h-4 w-4" aria-hidden="true" />
            <span>{isAsking ? 'Thinking...' : 'Ask Advisor'}</span>
          </button>
        </form>

        <div aria-live="polite" className="mt-5">
          {error && (
            <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
              {error}
            </div>
          )}

          {isAsking && (
            <div className="h-28 animate-pulse rounded-xl bg-slate-100" />
          )}

          {!isAsking && response && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-4"
            >
              <p className="text-sm leading-relaxed text-slate-800">{response.answer}</p>

              {response.keyTakeaways.length > 0 && (
                <ul className="list-disc space-y-1.5 pl-5 text-sm text-slate-700">
                  {response.keyTakeaways.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              )}

              <div className="grid grid-cols-1 gap-4 border-t border-slate-200 pt-3.5 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold text-slate-900">Direct impact</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-slate-600">
                    {response.directImpactNote}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-teal-900">Immediate next step</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-teal-800">
                    {response.safeNextStep}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}
