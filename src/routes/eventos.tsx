import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays, MapPin } from "lucide-react";

import { PageHeader, SiteLayout } from "@/components/site/SiteLayout";
import { formatDateTime } from "@/lib/domain";
import { useEvents } from "@/lib/queries";

export const Route = createFileRoute("/eventos")({
  head: () => ({
    meta: [
      { title: "Eventos — Colegio San Andrés de Bogotá" },
      {
        name: "description",
        content: "Calendario de reuniones, entregas de boletines y actividades institucionales.",
      },
      { property: "og:title", content: "Eventos institucionales" },
      { property: "og:description", content: "Calendario de actividades del colegio." },
    ],
  }),
  component: EventsPage,
});

function EventsPage() {
  const { data: events = [], isLoading } = useEvents(50);

  return (
    <SiteLayout>
      <PageHeader
        eyebrow="Eventos"
        title="Calendario institucional"
        description="Reuniones de padres, entregas de boletines y actividades culturales y deportivas."
      />
      <section className="mx-auto w-full max-w-4xl space-y-4 px-4 py-16">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Cargando eventos…</p>
        ) : events.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay eventos programados.</p>
        ) : (
          events.map((item) => (
            <article key={item.id} className="flex gap-4 rounded-lg border border-border bg-card p-6">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-md bg-accent/20 text-accent-foreground">
                <CalendarDays className="size-5" />
              </span>
              <div>
                <h2 className="font-display text-lg">{item.title}</h2>
                <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(item.starts_at)}</p>
                {item.location ? (
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="size-3.5" /> {item.location}
                  </p>
                ) : null}
                {item.description ? (
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                ) : null}
              </div>
            </article>
          ))
        )}
      </section>
    </SiteLayout>
  );
}
