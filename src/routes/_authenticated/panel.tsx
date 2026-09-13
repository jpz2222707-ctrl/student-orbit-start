import { Outlet, createFileRoute } from "@tanstack/react-router";

import { PanelLayout } from "@/components/panel/PanelLayout";

export const Route = createFileRoute("/_authenticated/panel")({
  head: () => ({
    meta: [
      { title: "Panel académico — Plataforma institucional" },
      { name: "description", content: "Panel de gestión académica institucional." },
      { property: "og:title", content: "Panel académico" },
      { property: "og:description", content: "Panel de gestión académica institucional." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <PanelLayout>
      <Outlet />
    </PanelLayout>
  ),
});
