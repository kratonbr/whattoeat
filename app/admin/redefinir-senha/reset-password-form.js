"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const ERROR_MESSAGES = {
  PASSWORD_INVALID: "A senha deve ter entre 12 e 128 caracteres.",
  PASSWORD_MISMATCH: "As senhas não são iguais.",
  PASSWORD_UPDATE_FAILED: "Não foi possível atualizar a senha. Confira os requisitos e tente novamente.",
  UNAUTHENTICATED: "A sessão de recuperação expirou. Solicite um novo link.",
  ADMIN_REQUIRED: "Esta conta não tem autorização para redefinir a senha administrativa.",
  AUTH_UNAVAILABLE: "O serviço de autenticação está temporariamente indisponível. Tente novamente mais tarde.",
  INVALID_ORIGIN: "A solicitação não pôde ser validada. Atualize a página e tente novamente.",
};

export default function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    if (password.length < 12 || password.length > 128) {
      setError(ERROR_MESSAGES.PASSWORD_INVALID);
      return;
    }
    if (password !== confirmation) {
      setError(ERROR_MESSAGES.PASSWORD_MISMATCH);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/admin/auth/password", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, confirmation }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(ERROR_MESSAGES[result.error] || ERROR_MESSAGES.AUTH_UNAVAILABLE);
        return;
      }

      setPassword("");
      setConfirmation("");
      router.replace("/admin");
      router.refresh();
    } catch {
      setError(ERROR_MESSAGES.AUTH_UNAVAILABLE);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
      <div>
        <label className="mb-2 block text-sm font-semibold" htmlFor="new-admin-password">Nova senha</label>
        <input
          autoComplete="new-password"
          className="h-12 w-full rounded-xl border border-[#DCE5D8] bg-white px-4 text-base outline-none transition focus:border-[#6F8C6C] focus:ring-4 focus:ring-[#6F8C6C]/15"
          disabled={isSubmitting}
          id="new-admin-password"
          maxLength={128}
          minLength={12}
          onChange={(event) => setPassword(event.target.value)}
          required
          type="password"
          value={password}
        />
        <p className="mt-2 text-xs leading-5 text-[#667469]">Use pelo menos 12 caracteres.</p>
      </div>
      <div>
        <label className="mb-2 block text-sm font-semibold" htmlFor="confirm-admin-password">Confirme a nova senha</label>
        <input
          autoComplete="new-password"
          className="h-12 w-full rounded-xl border border-[#DCE5D8] bg-white px-4 text-base outline-none transition focus:border-[#6F8C6C] focus:ring-4 focus:ring-[#6F8C6C]/15"
          disabled={isSubmitting}
          id="confirm-admin-password"
          maxLength={128}
          minLength={12}
          onChange={(event) => setConfirmation(event.target.value)}
          required
          type="password"
          value={confirmation}
        />
      </div>
      {error && <p aria-live="assertive" className="rounded-xl bg-[#F8EAE4] px-4 py-3 text-sm font-medium leading-6 text-[#8D432D]" role="alert">{error}</p>}
      <button
        className="inline-flex h-12 w-full items-center justify-center rounded-full bg-[#254936] px-5 text-sm font-bold text-white transition hover:bg-[#1E3C2C] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#D86F46]/30 disabled:cursor-wait disabled:opacity-65"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "Salvando…" : "Salvar nova senha"}
      </button>
    </form>
  );
}
