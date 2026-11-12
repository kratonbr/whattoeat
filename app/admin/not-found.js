export const metadata = {
  title: "Página não encontrada | WhatToEat",
  robots: { index: false, follow: false },
};

export default function AdminNotFound() {
  return (
    <main lang="pt-BR" className="grid min-h-screen place-items-center bg-[#F7F5EF] px-5 text-center text-[#20352A]">
      <section className="rounded-3xl border border-[#E1E7DC] bg-[#FFFEFA] p-8 shadow-lg shadow-[#20352A]/5">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#D86F46]">WhatToEat</p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight">Página não encontrada</h1>
        <p className="mt-3 text-sm leading-6 text-[#667469]">Esta página não está disponível.</p>
      </section>
    </main>
  );
}
