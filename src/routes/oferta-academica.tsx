import { createFileRoute } from "@tanstack/react-router";

import { PageHeader, SiteLayout } from "@/components/site/SiteLayout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGradeLevels, useSubjects } from "@/lib/queries";

export const Route = createFileRoute("/oferta-academica")({
  head: () => ({
    meta: [
      { title: "Oferta académica — Colegio San Andrés de Bogotá" },
      {
        name: "description",
        content:
          "Niveles desde preescolar hasta grado once y áreas fundamentales que ofrece la institución.",
      },
      { property: "og:title", content: "Oferta académica" },
      {
        property: "og:description",
        content: "Niveles de preescolar a grado once y áreas fundamentales.",
      },
    ],
  }),
  component: OfferPage,
});

const CYCLES = [
  { title: "Preescolar", range: [0, 0], text: "Primeros aprendizajes a través del juego y la exploración." },
  { title: "Básica primaria", range: [1, 5], text: "Fundamentos en lectura, escritura, matemáticas y ciencias." },
  { title: "Básica secundaria", range: [6, 9], text: "Profundización disciplinar y desarrollo del pensamiento crítico." },
  { title: "Media académica", range: [10, 11], text: "Preparación para pruebas de estado y proyecto de vida." },
];

function OfferPage() {
  const { data: levels = [] } = useGradeLevels();
  const { data: subjects = [] } = useSubjects();

  return (
    <SiteLayout>
      <PageHeader
        eyebrow="Oferta académica"
        title="De preescolar a grado once"
        description="Organizamos el plan de estudios en cuatro ciclos, con áreas fundamentales definidas para cada nivel."
      />

      <section className="mx-auto grid w-full max-w-6xl gap-4 px-4 py-16 sm:grid-cols-2">
        {CYCLES.map((cycle) => {
          const included = levels.filter(
            (l) => l.level >= cycle.range[0]! && l.level <= cycle.range[1]!,
          );
          return (
            <Card key={cycle.title}>
              <CardHeader>
                <CardTitle className="font-display text-lg">{cycle.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{cycle.text}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {included.map((l) => (
                    <Badge key={l.id} variant="secondary">
                      {l.name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="surface-muted border-t border-border">
        <div className="mx-auto w-full max-w-6xl px-4 py-16">
          <h2 className="text-2xl">Áreas y materias</h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {subjects
              .filter((s) => s.is_active)
              .map((s) => (
                <div key={s.id} className="rounded-lg border border-border bg-card p-4">
                  <p className="font-display text-base">{s.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{s.description ?? ""}</p>
                </div>
              ))}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
