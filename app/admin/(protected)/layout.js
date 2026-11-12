import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { getAdminAccess } from "@/modules/admin/infrastructure/supabase/authorization";
import AdminShell from "../admin-shell";

function AdminLoading() {
  return (
    <main lang="pt-BR" className="grid min-h-screen place-items-center bg-[#F7F5EF] px-5 text-[#667469]">
      <p>Verificando acesso administrativo…</p>
    </main>
  );
}

async function AdminAuthorizationBoundary({ children }) {
  const access = await getAdminAccess();

  if (access.status === 401) redirect("/admin/login");
  if (access.status === 403) notFound();
  if (!access.allowed) {
    return (
      <main lang="pt-BR" className="grid min-h-screen place-items-center bg-[#F7F5EF] px-5 text-[#20352A]">
        <p role="alert">O serviço de autenticação está temporariamente indisponível. Tente novamente mais tarde.</p>
      </main>
    );
  }

  return <AdminShell>{children}</AdminShell>;
}

export default function ProtectedAdminLayout({ children }) {
  return (
    <Suspense fallback={<AdminLoading />}>
      <AdminAuthorizationBoundary>{children}</AdminAuthorizationBoundary>
    </Suspense>
  );
}
