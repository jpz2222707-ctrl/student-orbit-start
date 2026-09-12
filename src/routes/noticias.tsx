import { createFileRoute } from "@tanstack/react-router";

import { PageHeader, SiteLayout } from "@/components/site/SiteLayout";
import { formatDate } from "@/lib/domain";
import { useNews } from "@/lib/queries";

export const Route = createFileRoute("/noticias")({
  head: () => ({
    meta: [
      { title: "Noticias — Colegio San Andrés de Bogotá" },
      {
        name: "description",
        content: "Comunicados, novedades y logros de la comunidad educativa.",
      },
      { property: "og:title", content: "Noticias institucionales" },
      { property: "og:description", content: "Comunicados y novedades de la comunidad educativa." },
    ],
  }),
  component: NewsPage,
});

function NewsPage() {
  const { data: news = [], isLoading } = useNews(50);

  return (
    <SiteLayout>
      <PageHeader
        eyebrow="Noticias"
        title="Lo que pasa en el colegio"
        description="Comunicados oficiales, logros de nuestros estudiantes y novedades académicas."
      />
      <section className="mx-auto w-full max-w-4xl space-y-6 px-4 py-16">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Cargando noticias…</p>
        ) : news.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aún no hay noticias publicadas.</p>
        ) : (
          news.map((item) => (
            <article key={item.id} className="rounded-lg border border-border bg-card p-6">
              <p className="text-xs text-muted-foreground">{formatDate(item.published_at)}</p>
              <h2 className="mt-1 font-display text-xl">{item.title}</h2>
              {item.summary ? (
                <p className="mt-2 text-sm font-medium text-foreground">{item.summary}</p>
              ) : null}
              {item.body ? (
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
              ) : null}
            </article>
          ))
        )}
      </section>
    </SiteLayout>
  );
}
