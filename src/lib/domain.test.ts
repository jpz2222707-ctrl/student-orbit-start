import { describe, expect, it } from "vitest";

import { parseScore, performanceLabel, weightedFinal } from "./domain";

describe("escala de desempeño", () => {
  it("4.6 o más es Superior", () => expect(performanceLabel(4.6)).toBe("Superior"));
  it("4.0 a 4.59 es Alto", () => expect(performanceLabel(4.59)).toBe("Alto"));
  it("3.0 a 3.99 es Básico", () => expect(performanceLabel(3.0)).toBe("Básico"));
  it("menos de 3.0 es Bajo", () => expect(performanceLabel(2.99)).toBe("Bajo"));
});

describe("validación de notas (0.0 a 5.0)", () => {
  it("rechaza valores mayores a 5", () => expect(parseScore("5.1").ok).toBe(false));
  it("rechaza valores menores a 0", () => expect(parseScore("-0.1").ok).toBe(false));
  it("rechaza texto no numérico", () => expect(parseScore("abc").ok).toBe(false));
  it("acepta coma decimal", () => expect(parseScore("4,2")).toEqual({ ok: true, value: 4.2 }));
  it("acepta 0 como nota válida", () => expect(parseScore("0")).toEqual({ ok: true, value: 0 }));
});

describe("definitiva ponderada", () => {
  it("pondera por porcentaje", () =>
    expect(
      weightedFinal([
        { score: 4, weight: 30 },
        { score: 3, weight: 30 },
        { score: 5, weight: 40 },
      ]),
    ).toBe(4.1));
});
