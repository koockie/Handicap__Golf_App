// src/utils/handicap.ts
import { Round } from '../types';

/** SD de una vuelta (redondeado a 0.1) */
export function computeScoreDifferential(adjusted: number, CR: number, SR: number, PCC = 0): number {
  const sd = (adjusted - CR - PCC) * (113 / SR);
  return Math.round(sd * 10) / 10;
}

/** Course Handicap */
export function computeCourseHandicap(HI: number, CR: number, SR: number, PAR: number): number {
  return Math.round((HI * SR) / 113 + (CR - PAR));
}

/**este calculo tambien ser ealiza en base de  datos con view player_handicap para mostrar en ranking,
 *  este calculo se realiza para ser mostrado en playerDetailScreen y playersScreen */

export function computeHandicapIndex(rounds: Round[]): number | null {
  if (!rounds?.length) return null;
  
  // 1. Ordenar por fecha (más reciente primero)
  // Aseguramos que 'played_at' sea tratado como fecha correctamente
  const last20 = [...rounds]
    .sort((a, b) => new Date(b.played_at).getTime() - new Date(a.played_at).getTime())
    .slice(0, 20);

  // 2. Extraer Score Differentials válidos
  const sds = last20
    .map(r => r.score_differential)
    .filter(x => x !== null && x !== undefined && Number.isFinite(x)) as number[];

  const n = sds.length;
  if (n < 3) return null; // Se requieren al menos 3 tarjetas


  const rule = getWhsRule(n);
  
  // 4. Seleccionar las mejores (más bajas) según la regla
  const best = [...sds].sort((a, b) => a - b).slice(0, rule.use);
  
  // 5. Promediar
  let avg = best.reduce((s, x) => s + x, 0) / rule.use;
  
  // 6. Aplicar ajuste (si aplica, ej: -1.0 o -2.0)
  if (rule.minus) avg -= rule.minus;

  // 7. Redondear a un decimal
  return Math.round(avg * 10) / 10;
}

/**
 * Tabla de reglas WHS oficial
 */
function getWhsRule(n: number): { use: number; minus?: number } {
  if (n <= 3) return { use: 1, minus: 2.0 };
  if (n === 4) return { use: 1, minus: 1.0 };
  if (n === 5) return { use: 1 };
  if (n === 6) return { use: 2, minus: 1.0 };
  if (n === 7 || n === 8) return { use: 2 };
  if (n >= 9 && n <= 11) return { use: 3 };
  if (n >= 12 && n <= 14) return { use: 4 };
  if (n >= 15 && n <= 16) return { use: 5 };
  if (n >= 17 && n <= 18) return { use: 6 };
  if (n === 19) return { use: 7 };
  return { use: 8 }; // 20 tarjetas
}

export const computeHandicapIndexWHS = computeHandicapIndex;