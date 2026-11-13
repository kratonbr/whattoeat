"use client";

import Link from "next/link";
import { usePublicLocale } from "./error-locale";

const COPY = {
  "pt-BR": {
    eyebrow: "WhatToEat",
    title: "Não conseguimos carregar esta página agora.",
    description: "Ocorreu um problema inesperado. Tente novamente ou volte ao início.",
    retry: "Tentar novamente",
    home: "Voltar ao início",
  },
  en: {
    eyebrow: "WhatToEat",
    title: "We couldn’t load this page right now.",
    description: "Something unexpected happened. Try again or return to the home page.",
    retry: "Try again",
    home: "Back to home",
  },
};

export default function ErrorPage({ retry }) {
  const locale = usePublicLocale();
  const copy = COPY[locale];
  const homeHref = locale === "en" ? "/?locale=en" : "/";

  return (
    <main lang={locale} className="grid min-h-screen place-items-center bg-[#F7F5EF] px-5 py-12 text-[#20352A] sm:px-8">
      <section className="w-full max-w-xl rounded-[2rem] border border-white/80 bg-[#FFFEFA] p-7 text-center shadow-[0_28px_80px_-36px_rgba(32,53,42,0.28)] sm:p-11" aria-labelledby="error-title">
        <div aria-hidden="true" className="mx-auto grid size-16 place-items-center rounded-2xl bg-[#FFF1E8] text-[#C66A45]">
          <svg viewBox="0 0 24 24" fill="none" className="size-8" stroke="currentColor" strokeWidth="1.8">
            <path d="M12 3 2.8 19h18.4L12 3Z" strokeLinejoin="round" />
            <path d="M12 9v4m0 3h.01" strokeLinecap="round" />
          </svg>
        </div>
        <p className="mt-6 text-xs font-extrabold uppercase tracking-[0.18em] text-[#D86F46]">{copy.eyebrow}</p>
        <h1 id="error-title" className="mt-3 font-serif text-3xl font-semibold leading-tight sm:text-4xl">{copy.title}</h1>
        <p className="mt-4 text-sm leading-6 text-[#68756A] sm:text-base">{copy.description}</p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <button type="button" onClick={() => retry()} className="min-h-12 rounded-full bg-[#254936] px-6 text-sm font-bold text-white shadow-sm transition hover:bg-[#1E3C2C] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#D86F46]/30">{copy.retry}</button>
          <Link href={homeHref} className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#C9D6C5] bg-[#F7F8F3] px-6 text-sm font-bold text-[#315B42] transition hover:bg-[#E9F0E5] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#D86F46]/20">{copy.home}</Link>
        </div>
      </section>
    </main>
  );
}
