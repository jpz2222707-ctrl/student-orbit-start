import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/restablecer-contrasena")({
  head: () => ({
    meta: [
      { title: "Restablecer contraseña — Plataforma académica" },
      { name: "description", content: "Defina una nueva contraseña para su cuenta." },
      { property: "og:title", content: "Restablecer contraseña" },
      { property: "og:description", content: "Defina una nueva contraseña para su cuenta." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password.length < 8) {
      toast.error("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== confirm) {
      toast.error("Las contraseñas no coinciden.");
      return;
    }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (error) {
      toast.error("El enlace expiró o no es válido. Solicite uno nuevo.");
      return;
    }
    toast.success("Contraseña actualizada.");
    void navigate({ to: "/panel", replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/40 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="font-display text-xl">Nueva contraseña</CardTitle>
          <CardDescription>Defina una contraseña de al menos 8 caracteres.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">Nueva contraseña</Label>
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar contraseña</Label>
              <Input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? "Guardando…" : "Guardar contraseña"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
