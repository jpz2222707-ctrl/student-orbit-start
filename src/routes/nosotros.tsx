import { createFileRoute } from "@tanstack/react-router";

import { PageHeader, SiteLayout } from "@/components/site/SiteLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useInstitution } from "@/lib/queries";

export const Route = createFileRoute("/nosotros")({
  head: () => ({
    meta: [
      { title: "Nosotros — Colegio San Andrés de Bogotá" },
      {
        name: "description",
        content:
          "Conozca la misión, visión, historia e información institucional del Colegio San Andrés de Bogotá.",
      },
      { property: "og:title", content: "Nosotros — Colegio San Andrés de Bogotá" },
      {
        property: "og:description",
        content: "Misión, visión, historia e información institucional.",
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  const { data: institution } = useInstitution();

  return (
    <SiteLayout>
      <PageHeader
        eyebrow="Nosotros"
        title="Una comunidad educativa con propósito"
        description="Somos una institución de carácter académico y humano, comprometida con la formación de ciudadanos responsables."
      />

      <section className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-16 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-xl">Misión</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-relaxed text-muted-foreground">
            {institution?.mission ?? "Información en actualización."}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-xl">Visión</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-relaxed text-muted-foreground">
            {institution?.vision ?? "Información en actualización."}
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-display text-xl">Historia</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-relaxed text-muted-foreground">
            {institution?.history ?? "Información en actualización."}
          </CardContent>
        </Card>
      </section>

      <section className="surface-muted border-t border-border">
        <div className="mx-auto w-full max-w-6xl px-4 py-16">
          <h2 className="text-2xl">Información institucional</h2>
          <dl className="mt-6 grid gap-6 sm:grid-cols-3">
            <div>
              <dt className="text-eyebrow text-primary">Dirección</dt>
              <dd className="mt-1 text-sm text-muted-foreground">{institution?.address ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-eyebrow text-primary">Teléfono</dt>
              <dd className="mt-1 text-sm text-muted-foreground">{institution?.phone ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-eyebrow text-primary">Correo</dt>
              <dd className="mt-1 text-sm text-muted-foreground">{institution?.email ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-eyebrow text-primary">Escala de valoración</dt>
              <dd className="mt-1 text-sm text-muted-foreground">
                De {Number(institution?.min_grade ?? 1).toFixed(1)} a{" "}
                {Number(institution?.max_grade ?? 5).toFixed(1)}
              </dd>
            </div>
            <div>
              <dt className="text-eyebrow text-primary">Nota aprobatoria</dt>
              <dd className="mt-1 text-sm text-muted-foreground">
                {Number(institution?.passing_grade ?? 3).toFixed(1)}
              </dd>
            </div>
          </dl>
        </div>
      </section>
    </SiteLayout>
  );
}
