import { Link, useNavigate } from "@tanstack/react-router";
import {
  BookMarked,
  CalendarRange,
  ClipboardList,
  FileText,
  GraduationCap,
  History,
  Home,
  LogOut,
  Menu,
  ScrollText,
  Users,
  UserSquare2,
} from "lucide-react";
import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import { ROLE_LABELS } from "@/lib/domain";
import { useInstitution } from "@/lib/queries";

type NavItem = { to: string; label: string; icon: typeof Home };

function navFor(flags: { isAdmin: boolean; isTeacher: boolean; isStudent: boolean; isGuardian: boolean }) {
  const items: NavItem[] = [{ to: "/panel", label: "Inicio", icon: Home }];
  if (flags.isAdmin) {
    items.push(
      { to: "/panel/estudiantes", label: "Estudiantes", icon: Users },
      { to: "/panel/docentes", label: "Docentes", icon: UserSquare2 },
      { to: "/panel/academico", label: "Grados y asignaturas", icon: CalendarRange },
      { to: "/panel/cursos", label: "Cursos y matrículas", icon: BookMarked },
      { to: "/panel/periodos", label: "Períodos académicos", icon: CalendarRange },
    );
  }
  if (flags.isAdmin || flags.isTeacher) {
    items.push({ to: "/panel/calificaciones", label: "Calificaciones", icon: ClipboardList });
  }
  items.push({ to: "/panel/boletines", label: "Boletines", icon: FileText });
  if (flags.isStudent || flags.isGuardian) {
    items.push({ to: "/panel/mis-notas", label: "Mis notas", icon: ClipboardList });
  }
  items.push({ to: "/panel/historial", label: "Historial académico", icon: History });
  if (flags.isAdmin) {
    items.push(
      { to: "/panel/usuarios", label: "Cuentas de acceso", icon: Users },
      { to: "/panel/auditoria", label: "Auditoría", icon: ScrollText },
    );
  }
  return items;
}

export function PanelLayout({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const navigate = useNavigate();
  const { data: institution } = useInstitution();
  const [open, setOpen] = useState(false);
  const items = navFor(auth);

  const handleSignOut = async () => {
    await auth.signOut();
    void navigate({ to: "/auth", replace: true });
  };

  const nav = (onNavigate?: () => void) => (
    <nav className="flex flex-col gap-1">
      {items.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          activeProps={{ className: "bg-sidebar-accent text-sidebar-accent-foreground" }}
          activeOptions={{ exact: item.to === "/panel" }}
        >
          <item.icon className="size-4 shrink-0" />
          {item.label}
        </Link>
      ))}
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar p-4 lg:flex">
        <Link to="/" className="flex items-center gap-3 px-1 pb-6">
          <span className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <GraduationCap className="size-5" />
          </span>
          <span className="min-w-0 truncate font-display text-sm text-sidebar-foreground">
            {institution?.name ?? "Plataforma académica"}
          </span>
        </Link>
        {nav()}
        <div className="mt-auto border-t border-sidebar-border pt-4">
          <p className="truncate px-1 text-sm font-medium text-sidebar-foreground">{auth.fullName}</p>
          <p className="px-1 text-xs text-sidebar-foreground/60">
            {auth.primaryRole ? ROLE_LABELS[auth.primaryRole] : "Sin rol asignado"}
          </p>
          <Button variant="outline" size="sm" className="mt-3 w-full" onClick={handleSignOut}>
            <LogOut className="size-4" /> Salir
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-border bg-background/95 px-4 backdrop-blur lg:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Abrir menú">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 bg-sidebar p-4">
              <div className="mt-8">{nav(() => setOpen(false))}</div>
              <Button
                variant="outline"
                size="sm"
                className="mt-6 w-full"
                onClick={() => {
                  setOpen(false);
                  void handleSignOut();
                }}
              >
                <LogOut className="size-4" /> Salir
              </Button>
            </SheetContent>
          </Sheet>
          <span className="truncate font-display text-sm">{auth.fullName}</span>
        </header>

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>
    </div>
  );
}

export function PanelHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl">{title}</h1>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
