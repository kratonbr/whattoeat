import { Suspense } from "react";
import ForgotPasswordForm from "./forgot-password-form";

export const metadata = {
  title: "Recuperar senha | WhatToEat",
  robots: { index: false, follow: false },
};

async function ForgotPasswordContent({ searchParams }) {
  const params = await searchParams;
  const notice = params?.estado === "link-invalido"
    ? "O link de recuperação é inválido, expirou ou já foi utilizado. Solicite um novo link."
    : params?.estado === "indisponivel"
      ? "Não foi possível validar o link agora. Tente solicitar outro em alguns minutos."
      : "";

  return (
    <main lang="pt-BR" className="flex min-h-screen items-center justify-center bg-[#F7F5EF] px-5 py-12 text-[#20352A]">
      <section className="w-full max-w-md rounded-3xl border border-[#E1E7DC] bg-[#FFFEFA] p-7 shadow-xl shadow-[#20352A]/5 sm:p-9">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#D86F46]">WhatToEat</p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight">Recuperar senha</h1>
        <p className="mt-2 text-sm leading-6 text-[#667469]">Informe o e-mail da sua conta administrativa. Se ele estiver cadastrado, enviaremos um link para definir uma nova senha.</p>
        {notice && <p className="mt-5 rounded-xl bg-[#FFF9E8] px-4 py-3 text-sm leading-6 text-[#66552D]" role="status">{notice}</p>}
        <ForgotPasswordForm />
      </section>
    </main>
  );
}

function ForgotPasswordLoading() {
  return (
    <main lang="pt-BR" className="grid min-h-screen place-items-center bg-[#F7F5EF] px-5 text-[#667469]">
      <p>Carregando…</p>
    </main>
  );
}

export default function ForgotPasswordPage({ searchParams }) {
  return (
    <Suspense fallback={<ForgotPasswordLoading />}>
      <ForgotPasswordContent searchParams={searchParams} />
    </Suspense>
  );
}
