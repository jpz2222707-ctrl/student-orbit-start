import { createFileRoute } from "@tanstack/react-router";
import { Mail, MapPin, Phone } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { PageHeader, SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useInstitution } from "@/lib/queries";

export const Route = createFileRoute("/contacto")({
  head: () => ({
    meta: [
      { title: "Contacto — Colegio San Andrés de Bogotá" },
      {
        name: "description",
        content:
          "Escríbanos para solicitar información sobre admisiones, cupos disponibles o temas académicos.",
      },
      { property: "og:title", content: "Contacto" },
      { property: "og:description", content: "Solicite información sobre admisiones y cupos." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const { data: institution } = useInstitution();
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", message: "" });
  const [sending, setSending] = useState(false);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (form.full_name.trim().length < 3) {
      toast.error("Escriba su nombre completo.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      toast.error("Escriba un correo válido.");
      return;
    }
    if (form.message.trim().length < 10) {
      toast.error("El mensaje debe tener al menos 10 caracteres.");
      return;
    }
    setSending(true);
    const { error } = await supabase.from("contact_messages").insert({
      full_name: form.full_name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || null,
      message: form.message.trim(),
    });
    setSending(false);
    if (error) {
      toast.error("No fue posible enviar el mensaje. Intente de nuevo.");
      return;
    }
    toast.success("Mensaje enviado. Le responderemos pronto.");
    setForm({ full_name: "", email: "", phone: "", message: "" });
  };

  return (
    <SiteLayout>
      <PageHeader
        eyebrow="Contacto"
        title="Estamos para atenderle"
        description="Complete el formulario y el equipo de admisiones se pondrá en contacto con usted."
      />

      <section className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-16 lg:grid-cols-[1.2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg">Envíenos un mensaje</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre completo</Label>
                  <Input
                    id="nombre"
                    value={form.full_name}
                    onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                    required
                    maxLength={120}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="correo">Correo</Label>
                  <Input
                    id="correo"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono (opcional)</Label>
                <Input
                  id="telefono"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  maxLength={30}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mensaje">Mensaje</Label>
                <Textarea
                  id="mensaje"
                  rows={5}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  required
                  maxLength={1500}
                />
              </div>
              <Button type="submit" disabled={sending}>
                {sending ? "Enviando…" : "Enviar mensaje"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardContent className="space-y-3 pt-6 text-sm text-muted-foreground">
              <p className="flex items-start gap-2">
                <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
                {institution?.address ?? "Bogotá D.C., Colombia"}
              </p>
              <p className="flex items-center gap-2">
                <Phone className="size-4 shrink-0 text-primary" />
                {institution?.phone ?? "—"}
              </p>
              <p className="flex items-center gap-2">
                <Mail className="size-4 shrink-0 text-primary" />
                {institution?.email ?? "—"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-base">Horario de atención</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Lunes a viernes de 7:00 a.m. a 4:00 p.m. Este horario es de referencia: confírmelo con
              la secretaría antes de su visita.
            </CardContent>
          </Card>
        </div>
      </section>
    </SiteLayout>
  );
}
