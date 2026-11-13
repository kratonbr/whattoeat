import Link from "next/link";
import LogoutButton from "./logout-button";
import AdminToastProvider from "./admin-toast-provider";

function AdminNavigation({ mobile = false }) {
  const linkClass = mobile
    ? "shrink-0 rounded-full bg-[#254936] px-4 py-2 text-sm font-semibold text-white"
    : "block rounded-xl bg-[#E9F0E5] px-4 py-3 text-sm font-bold text-[#254936]";
  const itemClass = mobile
    ? "shrink-0 rounded-full border border-[#E1E7DC] px-4 py-2 text-sm font-semibold text-[#667469] transition hover:border-[#B8C9B5] hover:bg-[#E9F0E5] hover:text-[#254936]"
    : "block rounded-xl px-4 py-3 text-sm font-semibold text-[#667469] transition hover:bg-[#F2F5EF] hover:text-[#254936]";

  return (
    <nav aria-label="Navegação administrativa" className={mobile ? "flex gap-2 overflow-x-auto pb-1" : "space-y-2"}>
      <Link aria-current="page" className={linkClass} href="/admin">
        Dashboard
      </Link>
      <Link className={itemClass} href="/admin/recipes">Receitas</Link>
    </nav>
  );
}

export default function AdminShell({ children }) {
  return (
    <AdminToastProvider><div lang="pt-BR" className="min-h-screen bg-[#F7F5EF] text-[#20352A]">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-[#E1E7DC] bg-[#FFFEFA] px-5 py-7 md:block">
        <Link className="text-lg font-extrabold tracking-tight text-[#254936]" href="/admin">
          WhatToEat
          <span className="mt-1 block text-xs font-semibold uppercase tracking-[0.16em] text-[#D86F46]">
            Administração
          </span>
        </Link>
        <div className="mt-10">
          <p className="mb-3 px-4 text-xs font-bold uppercase tracking-[0.14em] text-[#8A938A]">
            Menu
          </p>
          <AdminNavigation />
        </div>
        <p className="absolute bottom-7 left-5 right-5 text-xs leading-5 text-[#8A938A]">
          Área restrita para administração do catálogo.
        </p>
      </aside>

      <div className="md:pl-64">
        <header className="sticky top-0 z-10 border-b border-[#E1E7DC] bg-[#FFFEFA]/95 px-4 py-4 backdrop-blur sm:px-7">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8A938A] md:hidden">
                WhatToEat · Administração
              </p>
              <p className="text-sm font-bold text-[#254936]">Painel administrativo</p>
            </div>
            <LogoutButton />
          </div>
          <div className="mt-4 md:hidden">
            <AdminNavigation mobile />
          </div>
        </header>
        <div className="mx-auto max-w-7xl px-4 py-7 sm:px-7 sm:py-9">{children}</div>
      </div>
    </div></AdminToastProvider>
  );
}
