"use client";

import Link from "next/link";

export default function AdminError({ retry }) {
  return (
    <main lang="pt-BR" className="grid min-h-screen place-items-center bg-[#F7F5EF] px-5 py-12 text-[#20352A] sm:px-8">
      <section className="w-full max-w-xl rounded-[2rem] border border-white/80 bg-[#FFFEFA] p-7 text-center shadow-[0_28px_80px_-36px_rgba(32,53,42,0.28)] sm:p-11" aria-labelledby="admin-error-title">
        <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#D86F46]">WhatToEat · Administração</p>
        <h1 id="admin-error-title" className="mt-4 font-serif text-3xl font-semibold leading-tight sm:text-4xl">Não foi possível carregar esta área agora.</h1>
        <p className="mt-4 text-sm leading-6 text-[#68756A] sm:text-base">Ocorreu um problema inesperado. Tente novamente ou volte ao painel administrativo.</p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <button type="button" onClick={() => retry()} className="min-h-12 rounded-full bg-[#254936] px-6 text-sm font-bold text-white shadow-sm transition hover:bg-[#1E3C2C] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#D86F46]/30">Tentar novamente</button>
          <Link href="/admin" className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#C9D6C5] bg-[#F7F8F3] px-6 text-sm font-bold text-[#315B42] transition hover:bg-[#E9F0E5] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#D86F46]/20">Voltar ao painel</Link>
        </div>
      </section>
    </main>
  );
}
