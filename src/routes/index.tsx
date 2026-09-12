import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight, BookOpen, CalendarDays, LineChart, ShieldCheck, Users } from "lucide-react";

import heroImage from "@/assets/campus-hero.jpg";
import aulaImage from "@/assets/aula.jpg";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/domain";
import { useEvents, useInstitution, useNews } from "@/lib/queries";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Colegio San Andrés de Bogotá — Formación integral" },
      {
        name: "description",
        content:
          "Institución educativa en Bogotá con formación desde preescolar hasta grado once. Consulte noticias, eventos y acceda a la plataforma académica.",
      },
      { property: "og:title", content: "Colegio San Andrés de Bogotá" },
      {
        property: "og:description",
        content:
          "Formación integral con excelencia académica desde preescolar hasta grado once en Bogotá.",
      },
    ],
  }),
  component: HomePage,
});

const HIGHLIGHTS = [
  {
    icon: BookOpen,
    title: "Plan de estudios completo",
    text: "Áreas obligatorias y fundamentales organizadas por grado y período académico.",
  },
  {
    icon: Users,
    title: "Acompañamiento cercano",
    text: "Directores de grupo y docentes con seguimiento permanente a cada estudiante.",
  },
  {
    icon: LineChart,
    title: "Notas en línea",
    text: "Estudiantes y familias consultan calificaciones y boletines cuando lo necesiten.",
  },
  {
    icon: ShieldCheck,
    title: "Información protegida",
    text: "Cada persona accede únicamente a la información que le corresponde.",
  },
];

function HomePage() {
  const { data: institution } = useInstitution();
  const { data: news = [] } = useNews(3);
  const { data: events = [] } = useEvents(3);

  return (
    <SiteLayout>
      <section className="relative isolate overflow-hidden">
        <img
          src={heroImage}
          alt="Estudiantes caminando por el campus de la institución"
          width={1920}
          height={1088}
          className="absolute inset-0 size-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/85 to-primary/45" />
        <div className="relative mx-auto w-full max-w-6xl px-4 py-20 sm:py-28">
          <p className="text-eyebrow text-accent">Bogotá D.C. · Colombia</p>
          <h1 className="mt-4 max-w-2xl text-3xl leading-tight text-primary-foreground sm:text-5xl">
            {institution?.slogan ?? "Formación integral con excelencia académica"}
          </h1>
          <p className="mt-5 max-w-xl text-sm leading-relaxed text-primary-foreground/85 sm:text-base">
            {institution?.name ?? "Nuestra institución"} acompaña a niñas, niños y jóvenes desde
            preescolar hasta grado once con una propuesta académica exigente y humana.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/auth">
                Acceso al sistema <ArrowRight className="ml-1 size-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
            >
              <Link to="/oferta-academica">Ver oferta académica</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-16">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {HIGHLIGHTS.map((item) => (
            <Card key={item.title} className="border-border/70 shadow-none">
              <CardHeader className="pb-2">
                <span className="flex size-10 items-center justify-center rounded-md bg-secondary text-primary">
                  <item.icon className="size-5" />
                </span>
                <CardTitle className="mt-3 font-display text-base">{item.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">{item.text}</CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="surface-muted border-y border-border">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 py-16 lg:grid-cols-2">
          <img
            src={aulaImage}
            alt="Docente acompañando a estudiantes en el aula"
            width={1200}
            height={900}
            loading="lazy"
            className="rounded-lg object-cover shadow-[var(--shadow-card)]"
          />
          <div>
            <p className="text-eyebrow text-primary">Nuestra propuesta</p>
            <h2 className="mt-3 text-2xl sm:text-3xl">Educación que forma personas, no solo notas</h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
              {institution?.mission ??
                "Formamos estudiantes íntegros, críticos y solidarios mediante una educación de calidad."}
            </p>
            <Button asChild variant="secondary" className="mt-6">
              <Link to="/nosotros">Conocer la institución</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-16 lg:grid-cols-2">
        <div>
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-2xl">Noticias recientes</h2>
            <Link to="/noticias" className="text-sm font-medium text-primary hover:underline">
              Ver todas
            </Link>
          </div>
          <div className="mt-6 space-y-4">
            {news.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aún no hay noticias publicadas.</p>
            ) : (
              news.map((item) => (
                <article key={item.id} className="rounded-lg border border-border bg-card p-5">
                  <p className="text-xs text-muted-foreground">{formatDate(item.published_at)}</p>
                  <h3 className="mt-1 font-display text-base">{item.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{item.summary}</p>
                </article>
              ))
            )}
          </div>
        </div>
        <div>
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-2xl">Próximos eventos</h2>
            <Link to="/eventos" className="text-sm font-medium text-primary hover:underline">
              Ver todos
            </Link>
          </div>
          <div className="mt-6 space-y-4">
            {events.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay eventos programados.</p>
            ) : (
              events.map((item) => (
                <article
                  key={item.id}
                  className="flex gap-4 rounded-lg border border-border bg-card p-5"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-accent/20 text-accent-foreground">
                    <CalendarDays className="size-5" />
                  </span>
                  <div>
                    <h3 className="font-display text-base">{item.title}</h3>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(item.starts_at)}
                      {item.location ? ` · ${item.location}` : ""}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
