import { Suspense } from "react";
import Link from "next/link";
import ResetPasswordForm from "./reset-password-form";
import { requireAdminRecoverySession } from "@/modules/admin/infrastructure/supabase/recovery-authorization";

export const metadata = {
  title: "Definir nova senha | WhatToEat",
  robots: { index: false, follow: false },
};

function RecoveryUnavailable({ temporary = false }) {
  return (
    <main lang="pt-BR" className="flex min-h-screen items-center justify-center bg-[#F7F5EF] px-5 py-12 text-[#20352A]">
      <section className="w-full max-w-md rounded-3xl border border-[#E1E7DC] bg-[#FFFEFA] p-7 shadow-xl shadow-[#20352A]/5 sm:p-9">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#D86F46]">WhatToEat</p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight">Link indisponível</h1>
        <p className="mt-3 text-sm leading-6 text-[#667469]">
          {temporary
            ? "Não foi possível validar o link agora. Tente novamente em alguns minutos ou solicite outro link."
            : "Este link é inválido, expirou ou já foi utilizado. Solicite um novo link para redefinir sua senha."}
        </p>
        <div className="mt-7 flex flex-col gap-3">
          <Link className="inline-flex h-12 items-center justify-center rounded-full bg-[#254936] px-5 text-sm font-bold text-white transition hover:bg-[#1E3C2C] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#D86F46]/30" href="/admin/esqueci-senha">Solicitar novo link</Link>
          <Link className="text-center text-sm font-semibold text-[#254936] underline decoration-[#B8C9B5] underline-offset-4" href="/admin/login">Voltar para o acesso</Link>
        </div>
      </section>
    </main>
  );
}

async function ResetPasswordContent() {
  let recoveryAuthorized = false;
  let temporaryFailure = false;
  try {
    await requireAdminRecoverySession();
    recoveryAuthorized = true;
  } catch (error) {
    temporaryFailure = error?.status === 503;
  }

  if (!recoveryAuthorized) return <RecoveryUnavailable temporary={temporaryFailure} />;

  return (
    <main lang="pt-BR" className="flex min-h-screen items-center justify-center bg-[#F7F5EF] px-5 py-12 text-[#20352A]">
      <section className="w-full max-w-md rounded-3xl border border-[#E1E7DC] bg-[#FFFEFA] p-7 shadow-xl shadow-[#20352A]/5 sm:p-9">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#D86F46]">WhatToEat</p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight">Definir nova senha</h1>
        <p className="mt-2 text-sm leading-6 text-[#667469]">Escolha uma senha nova para sua conta administrativa.</p>
        <ResetPasswordForm />
      </section>
    </main>
  );
}

function ResetPasswordLoading() {
  return (
    <main lang="pt-BR" className="grid min-h-screen place-items-center bg-[#F7F5EF] px-5 text-[#667469]">
      <p>Validando link de recuperação…</p>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordLoading />}>
      <ResetPasswordContent />
    </Suspense>
  );
}
