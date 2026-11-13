"use client";

import { useState } from "react";

export default function CookingMode({ instructions, labels }) {
  const [isOpen, setIsOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  if (!instructions.length) return null;

  const stepNumber = stepIndex + 1;

  return (
    <div className="mt-6 sm:mt-7">
      {!isOpen ? (
        <button
          className="flex min-h-14 w-full items-center justify-between gap-4 rounded-2xl bg-[#254936] px-5 py-3.5 text-left text-sm font-extrabold text-white shadow-[0_14px_28px_-18px_rgba(37,73,54,0.8)] transition hover:bg-[#1E3C2C] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#D86F46]/30 sm:px-6 sm:text-base"
          onClick={() => setIsOpen(true)}
          type="button"
        >
          <span className="flex min-w-0 items-center gap-3">
            <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-full bg-white/15">
              <svg className="ml-0.5 size-4" fill="currentColor" viewBox="0 0 20 20"><path d="M6.25 4.73c0-.72.79-1.17 1.42-.81l8.15 4.72a.94.94 0 0 1 0 1.62l-8.15 4.72a.94.94 0 0 1-1.42-.81V4.73Z" /></svg>
            </span>
            <span className="min-w-0">{labels.startCookingMode}</span>
          </span>
          <span aria-hidden="true" className="shrink-0 text-xl">→</span>
        </button>
      ) : (
        <section aria-label={labels.cookingMode} className="rounded-3xl border border-[#DCE5D8] bg-[#F5F7F1] p-4 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#B45F3E]">{labels.cookingMode}</p>
              <h3 className="mt-1 font-serif text-xl font-semibold text-[#20352A]">
                {labels.stepProgress.replace("{step}", String(stepNumber)).replace("{total}", String(instructions.length))}
              </h3>
            </div>
            <button
              className="min-h-10 rounded-full px-3 text-sm font-bold text-[#68766A] underline decoration-[#C9D6C5] underline-offset-4 hover:text-[#254936] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D86F46]"
              onClick={() => setIsOpen(false)}
              type="button"
            >
              {labels.exitCookingMode}
            </button>
          </div>

          <progress aria-label={labels.cookingProgress} className="mt-4 h-2 w-full accent-[#315B42]" max={instructions.length} value={stepNumber} />
          <p aria-live="polite" aria-atomic="true" className="mt-6 min-h-28 break-words rounded-2xl bg-white px-4 py-5 text-lg leading-8 text-[#405447] shadow-sm sm:px-6 sm:py-6 sm:text-xl">
            {instructions[stepIndex]}
          </p>

          <div className="mt-5 flex items-center justify-between gap-3">
            <button
              className="min-h-12 flex-1 rounded-full border border-[#C9D6C5] bg-white px-4 text-sm font-bold text-[#315B42] transition hover:bg-[#E9F0E5] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#D86F46]/20 disabled:cursor-not-allowed disabled:opacity-45 sm:flex-none sm:px-5"
              disabled={stepIndex === 0}
              onClick={() => setStepIndex((current) => Math.max(0, current - 1))}
              type="button"
            >
              {labels.previousStep}
            </button>
            <button
              className="min-h-12 flex-1 rounded-full bg-[#254936] px-4 text-sm font-bold text-white transition hover:bg-[#1E3C2C] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#D86F46]/25 disabled:cursor-not-allowed disabled:opacity-45 sm:flex-none sm:px-5"
              disabled={stepIndex === instructions.length - 1}
              onClick={() => setStepIndex((current) => Math.min(instructions.length - 1, current + 1))}
              type="button"
            >
              {labels.nextStep}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
