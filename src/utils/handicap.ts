// src/utils/handicap.ts
import { Round } from '../types';

/** SD de una vuelta (redondeado a 0.1) */
export function computeScoreDifferential(adjusted: number, CR: number, SR: number, PCC = 0): number {
  const sd = (adjusted - CR - PCC) * (113 / SR);
  return Math.round(sd * 10) / 10;
}

/** (Opcional) Course Handicap, útil si luego calculas NDB por hoyo en la app */
export function computeCourseHandicap(HI: number, CR: number, SR: number, PAR: number): number {
  return Math.round((HI * SR) / 113 + (CR - PAR));
}

/** Tu HI actual (promedio de las k mejores, k = min(8, n)) */
export function computeHandicapIndex(rounds: Round[]): number | null {
  if (!rounds?.length) return null;
  const last20 = [...rounds]
    .sort((a, b) => new Date(b.played_at).getTime() - new Date(a.played_at).getTime())
    .slice(0, 20);

  const sds = last20
    .map(r => r.score_differential)
    .filter(x => Number.isFinite(x)) as number[];
  if (sds.length < 3) return null;

  const k = Math.min(8, sds.length);
  const best = [...sds].sort((a, b) => a - b).slice(0, k);
  const avg = best.reduce((s, x) => s + x, 0) / k;
  return Math.round(avg * 10) / 10;
}

/** (Opcional) WHS exacto 3..20 tarjetas */
export function computeHandicapIndexWHS(rounds: Round[]): number | null {
  if (!rounds?.length) return null;
  const last20 = [...rounds]
    .sort((a, b) => new Date(b.played_at).getTime() - new Date(a.played_at).getTime())
    .slice(0, 20);

  const sds = last20
    .map(r => r.score_differential)
    .filter(x => Number.isFinite(x)) as number[];

  const rule = whsRule(sds.length);
  if (!rule) return null;

  const best = [...sds].sort((a, b) => a - b).slice(0, rule.use);
  let avg = best.reduce((s, x) => s + x, 0) / rule.use;
  if (rule.minus) avg -= rule.minus;
  return Math.round(avg * 10) / 10;
}

function whsRule(n: number): { use: number; minus?: number } | null {
  if (n < 3) return null;
  if (n === 3) return { use: 1, minus: 2 };
  if (n === 4) return { use: 1, minus: 1 };
  if (n === 5) return { use: 1 };
  if (n === 6) return { use: 2, minus: 1 };
  if (n === 7) return { use: 2 };
  if (n >= 8 && n <= 11) return { use: 3 };
  if (n >= 12 && n <= 14) return { use: 4 };
  if (n >= 15 && n <= 16) return { use: 5 };
  if (n >= 17 && n <= 18) return { use: 6 };
  if (n === 19) return { use: 7 };
  return { use: 8 };
}
