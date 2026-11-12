"use client";

import { useState } from "react";
export default function LogoutButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  async function handleLogout() {
    setIsLoading(true);
    setHasError(false);

    try {
      const response = await fetch("/api/admin/auth/logout", {
        method: "POST",
        credentials: "same-origin",
      });
      if (!response.ok) throw new Error("Falha ao sair");
      window.location.replace("/admin/login");
    } catch {
      setHasError(true);
      setIsLoading(false);
    }
  }

  return (
    <div>
      <button
        className="rounded-full border border-[#DCE5D8] px-4 py-2 text-sm font-bold text-[#365541] transition hover:bg-white disabled:opacity-60"
        disabled={isLoading}
        onClick={handleLogout}
        type="button"
      >
        {isLoading ? "Saindo…" : "Sair"}
      </button>
      {hasError && <p className="mt-2 text-sm text-[#8D432D]" role="alert">Não foi possível sair. Tente novamente.</p>}
    </div>
  );
}
