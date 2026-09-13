import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { GraduationCap, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { bootstrapDemoAccounts } from "@/lib/admin.functions";
import { useInstitution } from "@/lib/queries";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Acceso al sistema — Colegio San Andrés de Bogotá" },
      {
        name: "description",
        content:
          "Ingreso para administradores, docentes, estudiantes y acudientes de la plataforma académica.",
      },
      { property: "og:title", content: "Acceso al sistema académico" },
      { property: "og:description", content: "Ingreso a la plataforma académica institucional." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const { data: institution } = useInstitution();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [bootstrapping, setBootstrapping] = useState(false);

  useEffect(() => {
    if (session) void navigate({ to: "/panel", replace: true });
  }, [session, navigate]);

  const onSignIn = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email || password.length < 6) {
      toast.error("Escriba su correo y contraseña.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (error) {
      toast.error("Correo o contraseña incorrectos.");
      return;
    }
    toast.success("Bienvenido");
    void navigate({ to: "/panel", replace: true });
  };

  const onReset = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!resetEmail) return;
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.trim(), {
      redirectTo: `${window.location.origin}/restablecer-contrasena`,
    });
    if (error) {
      toast.error("No fue posible enviar el correo de recuperación.");
      return;
    }
    toast.success("Le enviamos un correo con las instrucciones.");
  };

  const onBootstrap = async () => {
    setBootstrapping(true);
    try {
      const result = await bootstrapDemoAccounts();
      toast.success(`Cuentas creadas. Contraseña: ${result.password}`);
      setEmail("admin@demo.edu.co");
      setPassword(result.password);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No fue posible crear las cuentas.");
    } finally {
      setBootstrapping(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="surface-hero hidden flex-col justify-between p-12 text-primary-foreground lg:flex">
        <Link to="/" className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-md bg-primary-foreground/15">
            <GraduationCap className="size-5" />
          </span>
          <span className="font-display text-lg">{institution?.name ?? "Plataforma académica"}</span>
        </Link>
        <div>
          <p className="text-eyebrow text-accent">Plataforma académica</p>
          <h1 className="mt-3 max-w-md text-3xl leading-tight">
            Gestione estudiantes, cursos y calificaciones en un solo lugar
          </h1>
          <p className="mt-4 max-w-sm text-sm text-primary-foreground/80">
            Cada persona ingresa con su cuenta y ve únicamente la información que le corresponde.
          </p>
        </div>
        <p className="text-xs text-primary-foreground/60">
          © {new Date().getFullYear()} {institution?.name ?? "Institución educativa"}
        </p>
      </div>

      <div className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <Link to="/" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground lg:hidden">
            ← Volver al sitio
          </Link>
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-xl">Acceso al sistema</CardTitle>
              <CardDescription>Ingrese con la cuenta entregada por la institución.</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="ingresar">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="ingresar">Ingresar</TabsTrigger>
                  <TabsTrigger value="recuperar">Recuperar</TabsTrigger>
                </TabsList>

                <TabsContent value="ingresar" className="mt-4">
                  <form onSubmit={onSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Correo institucional</Label>
                      <Input
                        id="email"
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Contraseña</Label>
                      <Input
                        id="password"
                        type="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? <Loader2 className="size-4 animate-spin" /> : "Ingresar"}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="recuperar" className="mt-4">
                  <form onSubmit={onReset} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="reset-email">Correo registrado</Label>
                      <Input
                        id="reset-email"
                        type="email"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        required
                      />
                    </div>
                    <Button type="submit" variant="secondary" className="w-full">
                      Enviar instrucciones
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Si no recibe el correo, solicite el restablecimiento a la secretaría académica.
                    </p>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <div className="mt-6 rounded-lg border border-dashed border-border bg-secondary/50 p-4">
            <p className="text-sm font-medium">Primera vez en el sistema</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Si aún no existe ningún administrador, cree las cuentas de prueba (administrador,
              docente, estudiante y acudiente). Esta opción se bloquea automáticamente en cuanto
              exista un administrador.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={onBootstrap}
              disabled={bootstrapping}
            >
              {bootstrapping ? "Creando…" : "Crear cuentas iniciales"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
