"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const ERROR_MESSAGES = {
  EMAIL_REQUIRED: "Informe seu e-mail.",
  EMAIL_INVALID: "Informe um endereço de e-mail válido.",
  PASSWORD_REQUIRED: "Informe sua senha.",
  INVALID_CREDENTIALS: "E-mail ou senha incorretos.",
  ADMIN_ACCESS_REQUIRED: "Esta conta não tem autorização para acessar a área administrativa.",
  SIGN_IN_TEMPORARILY_UNAVAILABLE: "Muitas tentativas. Aguarde um pouco e tente novamente.",
  AUTH_UNAVAILABLE: "Não foi possível acessar o serviço de autenticação. Tente novamente mais tarde.",
};

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      setError(ERROR_MESSAGES.EMAIL_REQUIRED);
      return;
    }
    if (event.currentTarget.elements.namedItem("email").validity.typeMismatch) {
      setError(ERROR_MESSAGES.EMAIL_INVALID);
      return;
    }
    if (!password) {
      setError(ERROR_MESSAGES.PASSWORD_REQUIRED);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/auth/login", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail, password }),
      });

      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        setError(ERROR_MESSAGES[result.error] || ERROR_MESSAGES.AUTH_UNAVAILABLE);
        return;
      }

      setPassword("");
      router.replace("/admin");
      router.refresh();
    } catch {
      setError(ERROR_MESSAGES.AUTH_UNAVAILABLE);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="mt-7 space-y-5" noValidate onSubmit={handleSubmit}>
      <div>
        <label className="mb-2 block text-sm font-semibold" htmlFor="admin-email">
          E-mail
        </label>
        <input
          autoComplete="username"
          className="h-12 w-full rounded-xl border border-[#DCE5D8] bg-white px-4 text-base outline-none transition focus:border-[#6F8C6C] focus:ring-4 focus:ring-[#6F8C6C]/15"
          disabled={isSubmitting}
          id="admin-email"
          name="email"
          onChange={(event) => setEmail(event.target.value)}
          required
          type="email"
          value={email}
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-semibold" htmlFor="admin-password">
          Senha
        </label>
        <input
          autoComplete="current-password"
          className="h-12 w-full rounded-xl border border-[#DCE5D8] bg-white px-4 text-base outline-none transition focus:border-[#6F8C6C] focus:ring-4 focus:ring-[#6F8C6C]/15"
          disabled={isSubmitting}
          id="admin-password"
          name="password"
          onChange={(event) => setPassword(event.target.value)}
          required
          type="password"
          value={password}
        />
      </div>
      {error && (
        <p aria-live="polite" className="rounded-xl bg-[#F8EAE4] px-4 py-3 text-sm font-medium text-[#8D432D]" role="alert">
          {error}
        </p>
      )}
      <button
        className="inline-flex h-12 w-full items-center justify-center rounded-full bg-[#254936] px-5 text-sm font-bold text-white transition hover:bg-[#1E3C2C] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#D86F46]/30 disabled:cursor-wait disabled:opacity-65"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "Entrando…" : "Entrar"}
      </button>
      <p className="text-center text-sm">
        <Link className="font-semibold text-[#254936] underline decoration-[#B8C9B5] underline-offset-4 hover:text-[#D86F46]" href="/admin/esqueci-senha">
          Esqueci minha senha
        </Link>
      </p>
    </form>
  );
}
