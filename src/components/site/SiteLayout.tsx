import { Link } from "@tanstack/react-router";
import { GraduationCap, Mail, MapPin, Menu, Phone } from "lucide-react";
import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import { useInstitution } from "@/lib/queries";

const NAV = [
  { to: "/", label: "Inicio" },
  { to: "/nosotros", label: "Nosotros" },
  { to: "/oferta-academica", label: "Oferta académica" },
  { to: "/noticias", label: "Noticias" },
  { to: "/eventos", label: "Eventos" },
  { to: "/contacto", label: "Contacto" },
] as const;

export function SiteLayout({ children }: { children: ReactNode }) {
  const { data: institution } = useInstitution();
  const { session } = useAuth();
  const [open, setOpen] = useState(false);
  const name = institution?.name ?? "Institución Educativa";

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4">
          <Link to="/" className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <GraduationCap className="size-5" />
            </span>
            <span className="min-w-0">
              <span className="block truncate font-display text-base leading-tight text-foreground">
                {name}
              </span>
              <span className="hidden text-xs text-muted-foreground sm:block">
                {institution?.slogan ?? "Educación con propósito"}
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                activeProps={{ className: "bg-secondary text-foreground" }}
                activeOptions={{ exact: item.to === "/" }}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Button asChild size="sm" className="hidden sm:inline-flex">
              <Link to={session ? "/panel" : "/auth"}>
                {session ? "Ir al panel" : "Acceso al sistema"}
              </Link>
            </Button>
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="lg:hidden" aria-label="Abrir menú">
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <nav className="mt-8 flex flex-col gap-1">
                  {NAV.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setOpen(false)}
                      className="rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                      activeProps={{ className: "bg-secondary text-foreground" }}
                      activeOptions={{ exact: item.to === "/" }}
                    >
                      {item.label}
                    </Link>
                  ))}
                  <Button asChild className="mt-4">
                    <Link to={session ? "/panel" : "/auth"} onClick={() => setOpen(false)}>
                      {session ? "Ir al panel" : "Acceso al sistema"}
                    </Link>
                  </Button>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border bg-primary text-primary-foreground">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <h2 className="font-display text-lg">{name}</h2>
            <p className="mt-2 text-sm text-primary-foreground/75">
              {institution?.slogan ?? "Formación integral con excelencia académica"}
            </p>
          </div>
          <div className="space-y-2 text-sm text-primary-foreground/85">
            <p className="flex items-start gap-2">
              <MapPin className="mt-0.5 size-4 shrink-0" />
              {institution?.address ?? "Bogotá D.C., Colombia"}
            </p>
            <p className="flex items-center gap-2">
              <Phone className="size-4 shrink-0" />
              {institution?.phone ?? "—"}
            </p>
            <p className="flex items-center gap-2">
              <Mail className="size-4 shrink-0" />
              {institution?.email ?? "—"}
            </p>
          </div>
          <div className="space-y-2 text-sm">
            <p className="text-eyebrow text-accent">Enlaces</p>
            {NAV.slice(1).map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="block text-primary-foreground/85 transition-colors hover:text-accent"
              >
                {item.label}
              </Link>
            ))}
            <Link to="/auth" className="block text-accent">
              Acceso al sistema
            </Link>
          </div>
        </div>
        <div className="border-t border-primary-foreground/15 px-4 py-4 text-center text-xs text-primary-foreground/60">
          © {new Date().getFullYear()} {name}. Todos los derechos reservados.
        </div>
      </footer>
    </div>
  );
}

export function PageHeader({ eyebrow, title, description }: { eyebrow?: string; title: string; description?: string }) {
  return (
    <section className="surface-hero text-primary-foreground">
      <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:py-20">
        {eyebrow ? <p className="text-eyebrow text-accent">{eyebrow}</p> : null}
        <h1 className="mt-3 max-w-3xl text-3xl leading-tight sm:text-4xl">{title}</h1>
        {description ? (
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-primary-foreground/80 sm:text-base">
            {description}
          </p>
        ) : null}
      </div>
    </section>
  );
}
