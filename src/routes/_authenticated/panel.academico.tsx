import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { PanelHeader } from "@/components/panel/PanelLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { PERIOD_STATUS_LABELS, formatDate, type PeriodStatus } from "@/lib/domain";
import { useAcademicYears, useGradeLevels, usePeriods, useSubjects } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/panel/academico")({
  component: AcademicPage,
});

function AcademicPage() {
  const auth = useAuth();
  if (!auth.isAdmin) {
    return <p className="text-sm text-muted-foreground">Esta sección es solo para administradores.</p>;
  }

  return (
    <>
      <PanelHeader
        title="Estructura académica"
        description="Grados, materias, años escolares y períodos de calificación."
      />
      <Tabs defaultValue="grados">
        <TabsList>
          <TabsTrigger value="grados">Grados</TabsTrigger>
          <TabsTrigger value="materias">Materias</TabsTrigger>
          <TabsTrigger value="anios">Años y períodos</TabsTrigger>
        </TabsList>
        <TabsContent value="grados" className="mt-6">
          <GradeLevels />
        </TabsContent>
        <TabsContent value="materias" className="mt-6">
          <Subjects />
        </TabsContent>
        <TabsContent value="anios" className="mt-6">
          <YearsAndPeriods />
        </TabsContent>
      </Tabs>
    </>
  );
}

function GradeLevels() {
  const queryClient = useQueryClient();
  const { data: levels = [] } = useGradeLevels();
  const [name, setName] = useState("");
  const [level, setLevel] = useState("");

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("grade_levels")
        .insert({ name: name.trim(), level: Number(level) });
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Grado creado");
      setName("");
      setLevel("");
      await queryClient.invalidateQueries({ queryKey: ["grade_levels"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg">Grados</CardTitle>
          <CardDescription>Niveles ofrecidos por la institución.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {levels.map((l) => (
            <Badge key={l.id} variant="secondary" className="text-sm">
              {l.name}
            </Badge>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-base">Nuevo grado</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="gname">Nombre</Label>
            <Input id="gname" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="glevel">Nivel numérico</Label>
            <Input
              id="glevel"
              type="number"
              min={0}
              max={11}
              value={level}
              onChange={(e) => setLevel(e.target.value)}
            />
          </div>
          <Button
            className="w-full"
            onClick={() => create.mutate()}
            disabled={name.trim().length < 2 || level === "" || create.isPending}
          >
            <Plus className="size-4" /> Agregar grado
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function Subjects() {
  const queryClient = useQueryClient();
  const { data: subjects = [] } = useSubjects();
  const [form, setForm] = useState({ code: "", name: "", description: "" });

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("subjects").insert({
        code: form.code.trim().toUpperCase(),
        name: form.name.trim(),
        description: form.description.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Materia creada");
      setForm({ code: "", name: "", description: "" });
      await queryClient.invalidateQueries({ queryKey: ["subjects"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg">Materias</CardTitle>
          <CardDescription>Áreas fundamentales del plan de estudios.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {subjects.map((s) => (
            <div key={s.id} className="rounded-md border border-border p-3">
              <p className="text-sm font-medium">{s.name}</p>
              <p className="text-xs text-muted-foreground">{s.code}</p>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-base">Nueva materia</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="scode">Código</Label>
            <Input
              id="scode"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sname">Nombre</Label>
            <Input
              id="sname"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sdesc">Descripción</Label>
            <Input
              id="sdesc"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <Button
            className="w-full"
            onClick={() => create.mutate()}
            disabled={form.code.trim().length < 2 || form.name.trim().length < 3 || create.isPending}
          >
            <Plus className="size-4" /> Agregar materia
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function YearsAndPeriods() {
  const queryClient = useQueryClient();
  const { data: years = [] } = useAcademicYears();
  const [yearId, setYearId] = useState<string>("");
  const selectedYear = yearId || years.find((y) => y.is_active)?.id || years[0]?.id || "";
  const { data: periods = [] } = usePeriods(selectedYear || null);

  const [period, setPeriod] = useState({
    name: "",
    order_index: "",
    start_date: "",
    end_date: "",
    status: "proximo" as PeriodStatus,
  });

  const createPeriod = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("academic_periods").insert({
        academic_year_id: selectedYear,
        name: period.name.trim(),
        order_index: Number(period.order_index),
        start_date: period.start_date,
        end_date: period.end_date,
        status: period.status,
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Período creado");
      setPeriod({ name: "", order_index: "", start_date: "", end_date: "", status: "proximo" });
      await queryClient.invalidateQueries({ queryKey: ["academic_periods"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const changeStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: PeriodStatus }) => {
      const { error } = await supabase.from("academic_periods").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Período actualizado");
      await queryClient.invalidateQueries({ queryKey: ["academic_periods"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg">Períodos</CardTitle>
          <CardDescription>
            Los docentes solo pueden registrar notas en períodos con estado activo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-w-xs space-y-2">
            <Label>Año escolar</Label>
            <Select value={selectedYear} onValueChange={setYearId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccione un año" />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y.id} value={y.id}>
                    {y.name} {y.is_active ? "(activo)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            {periods.map((p) => (
              <div
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border p-3"
              >
                <div>
                  <p className="text-sm font-medium">{p.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(p.start_date)} — {formatDate(p.end_date)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={p.status === "activo" ? "default" : "secondary"}>
                    {PERIOD_STATUS_LABELS[p.status as PeriodStatus]}
                  </Badge>
                  <Select
                    value={p.status}
                    onValueChange={(v) =>
                      changeStatus.mutate({ id: p.id, status: v as PeriodStatus })
                    }
                  >
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="proximo">Próximo</SelectItem>
                      <SelectItem value="activo">Activo</SelectItem>
                      <SelectItem value="cerrado">Cerrado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
            {periods.length === 0 ? (
              <p className="text-sm text-muted-foreground">Este año no tiene períodos definidos.</p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-base">Nuevo período</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="pname">Nombre</Label>
            <Input
              id="pname"
              value={period.name}
              onChange={(e) => setPeriod({ ...period, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="porder">Orden</Label>
            <Input
              id="porder"
              type="number"
              min={1}
              value={period.order_index}
              onChange={(e) => setPeriod({ ...period, order_index: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pstart">Inicio</Label>
            <Input
              id="pstart"
              type="date"
              value={period.start_date}
              onChange={(e) => setPeriod({ ...period, start_date: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pend">Fin</Label>
            <Input
              id="pend"
              type="date"
              value={period.end_date}
              onChange={(e) => setPeriod({ ...period, end_date: e.target.value })}
            />
          </div>
          <Button
            className="w-full"
            onClick={() => createPeriod.mutate()}
            disabled={
              !selectedYear ||
              period.name.trim().length < 3 ||
              !period.order_index ||
              !period.start_date ||
              !period.end_date ||
              createPeriod.isPending
            }
          >
            <Plus className="size-4" /> Agregar período
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
