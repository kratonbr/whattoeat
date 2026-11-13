import Link from "next/link";

export const metadata = {
  title: "Página não encontrada | WhatToEat",
  robots: { index: false, follow: false },
};

export default function AdminNotFound() {
  return (
    <main lang="pt-BR" className="grid min-h-screen place-items-center bg-[#F7F5EF] px-5 text-center text-[#20352A]">
      <section className="rounded-3xl border border-[#E1E7DC] bg-[#FFFEFA] p-8 shadow-lg shadow-[#20352A]/5">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#D86F46]">WhatToEat</p>
        <p className="mt-5 text-sm font-extrabold uppercase tracking-[0.18em] text-[#D86F46]">404</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight">Página administrativa não encontrada</h1>
        <p className="mt-3 text-sm leading-6 text-[#667469]">Este registro ou endereço não está disponível.</p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/admin/recipes" className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#254936] px-5 text-sm font-bold text-white hover:bg-[#1E3C2C] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#D86F46]/30">Voltar às receitas</Link>
          <Link href="/admin" className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#C9D6C5] px-5 text-sm font-bold text-[#315B42] hover:bg-[#E9F0E5] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#D86F46]/20">Voltar ao painel</Link>
        </div>
      </section>
    </main>
  );
}
