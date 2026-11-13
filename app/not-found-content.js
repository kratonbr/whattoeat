"use client";

import Link from "next/link";
import { usePublicLocale } from "./error-locale";

const COPY = {
  "pt-BR": {
    title: "Ops! Essa receita sumiu do cardápio.",
    description: "A página que você procurou não existe ou não está mais disponível.",
    home: "Voltar ao início",
    explore: "Explorar receitas",
    illustration: "Ilustração de um prato vazio com talheres",
  },
  en: {
    title: "Oops! This recipe has disappeared from the menu.",
    description: "The page you requested does not exist or is no longer available.",
    home: "Back to home",
    explore: "Explore recipes",
    illustration: "Illustration of an empty plate and cutlery",
  },
};

export default function NotFoundContent() {
  const locale = usePublicLocale();
  const copy = COPY[locale];
  const homeHref = locale === "en" ? "/?locale=en" : "/";
  const exploreHref = locale === "en" ? "/?locale=en#recipes" : "/#recipes";

  return (
    <main lang={locale} className="grid min-h-screen place-items-center overflow-hidden bg-[#F7F5EF] px-5 py-12 text-[#20352A] sm:px-8">
      <div aria-hidden="true" className="pointer-events-none fixed -right-28 -top-28 size-96 rounded-full bg-[#E4EBDD] opacity-70 blur-3xl" />
      <section className="relative w-full max-w-2xl rounded-[2rem] border border-white/80 bg-[#FFFEFA] px-6 py-10 text-center shadow-[0_28px_80px_-36px_rgba(32,53,42,0.28)] sm:px-12 sm:py-14" aria-labelledby="not-found-title">
        <div className="mx-auto grid size-32 place-items-center rounded-[2rem] bg-[#E8EEE2] text-[#547050] sm:size-40" role="img" aria-label={copy.illustration}>
          <svg aria-hidden="true" viewBox="0 0 100 100" fill="none" className="size-24 sm:size-28">
            <path d="M15 51h70a31 31 0 0 1-31 28h-8a31 31 0 0 1-31-28Z" fill="#FFFEFA" stroke="currentColor" strokeWidth="3" />
            <path d="M20 51c7-8 17-12 30-12s23 4 30 12" stroke="#C88057" strokeLinecap="round" strokeWidth="3" />
            <path d="M50 18v15m-6-9v9m12-9v9M12 27v31m-5-14h10m-5-17v17M88 27v31m-5-14h10m-5-17v17" stroke="#315B42" strokeLinecap="round" strokeWidth="3" />
            <path d="M37 64h26" stroke="#D9E4D3" strokeLinecap="round" strokeWidth="4" />
          </svg>
        </div>
        <p className="mt-7 text-sm font-extrabold uppercase tracking-[0.18em] text-[#D86F46]">404</p>
        <h1 id="not-found-title" className="mt-2 font-serif text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">{copy.title}</h1>
        <p className="mx-auto mt-4 max-w-lg text-base leading-7 text-[#68756A]">{copy.description}</p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href={homeHref} className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#254936] px-6 text-sm font-bold text-white shadow-sm transition hover:bg-[#1E3C2C] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#D86F46]/30">{copy.home}</Link>
          <Link href={exploreHref} className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#C9D6C5] bg-[#F7F8F3] px-6 text-sm font-bold text-[#315B42] transition hover:bg-[#E9F0E5] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#D86F46]/20">{copy.explore}</Link>
        </div>
      </section>
    </main>
  );
}
