import DashboardClient from "../dashboard-client";

export const metadata = {
  title: "Painel administrativo | WhatToEat",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <DashboardClient />;
}
