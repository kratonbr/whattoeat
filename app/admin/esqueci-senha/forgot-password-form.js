"use client";

import Link from "next/link";
import { useState } from "react";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/auth/recovery", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (!response.ok) throw new Error("REQUEST_FAILED");
      setMessage("Se houver uma conta administrativa associada a esse e-mail, enviaremos instruções para redefinir a senha. Confira também sua caixa de spam.");
      setEmail("");
    } catch {
      setError("Não foi possível solicitar a recuperação agora. Tente novamente mais tarde.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
      <div>
        <label className="mb-2 block text-sm font-semibold" htmlFor="recovery-email">E-mail</label>
        <input
          autoComplete="email"
          className="h-12 w-full rounded-xl border border-[#DCE5D8] bg-white px-4 text-base outline-none transition focus:border-[#6F8C6C] focus:ring-4 focus:ring-[#6F8C6C]/15"
          disabled={isSubmitting}
          id="recovery-email"
          maxLength={254}
          onChange={(event) => setEmail(event.target.value)}
          required
          type="email"
          value={email}
        />
      </div>
      {message && <p aria-live="polite" className="rounded-xl bg-[#F1F7EE] px-4 py-3 text-sm leading-6 text-[#254936]" role="status">{message}</p>}
      {error && <p aria-live="assertive" className="rounded-xl bg-[#F8EAE4] px-4 py-3 text-sm font-medium text-[#8D432D]" role="alert">{error}</p>}
      <button
        className="inline-flex h-12 w-full items-center justify-center rounded-full bg-[#254936] px-5 text-sm font-bold text-white transition hover:bg-[#1E3C2C] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#D86F46]/30 disabled:cursor-wait disabled:opacity-65"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "Enviando…" : "Enviar instruções"}
      </button>
      <p className="text-center text-sm">
        <Link className="font-semibold text-[#254936] underline decoration-[#B8C9B5] underline-offset-4 hover:text-[#D86F46]" href="/admin/login">Voltar ao login</Link>
      </p>
    </form>
  );
}
