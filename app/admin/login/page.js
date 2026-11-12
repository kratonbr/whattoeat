import { Suspense } from "react";
import { redirect } from "next/navigation";
import LoginForm from "./login-form";
import { getAdminAccess } from "@/modules/admin/infrastructure/supabase/authorization";
import { shouldRedirectAdminLoginToPanel } from "@/lib/auth/admin-routing.mjs";

export const metadata = {
  title: "Acesso administrativo | WhatToEat",
  robots: { index: false, follow: false },
};

function LoginLoading() {
  return (
    <main lang="pt-BR" className="grid min-h-screen place-items-center bg-[#F7F5EF] px-5 text-[#667469]">
      <p>Verificando sessão administrativa…</p>
    </main>
  );
}

async function AdminLoginContent() {
  const access = await getAdminAccess();

  if (shouldRedirectAdminLoginToPanel(access)) redirect("/admin");

  return (
    <main lang="pt-BR" className="flex min-h-screen items-center justify-center bg-[#F7F5EF] px-5 py-12 text-[#20352A]">
      <section className="w-full max-w-md rounded-3xl border border-[#E1E7DC] bg-[#FFFEFA] p-7 shadow-xl shadow-[#20352A]/5 sm:p-9">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#D86F46]">
          WhatToEat
        </p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight">Acesso administrativo</h1>
        <p className="mt-2 text-sm leading-6 text-[#667469]">
          Entre com sua conta de administrador.
        </p>
        <LoginForm />
      </section>
    </main>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<LoginLoading />}>
      <AdminLoginContent />
    </Suspense>
  );
}
