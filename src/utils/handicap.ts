import { Round } from '../types';

export function computeHandicapIndex(rounds: Round[]): number | null {
  if (!rounds?.length) return null;
  const last20 = [...rounds].sort((a,b) =>
    new Date(b.played_at).getTime() - new Date(a.played_at).getTime()
  ).slice(0, 20);

  const sds = last20.map(r => r.score_differential).filter(x => Number.isFinite(x));
  if (sds.length < 3) return null;
  const k = Math.min(8, sds.length);
  const best = sds.sort((a,b)=>a-b).slice(0, k);
  const avg = best.reduce((s,x)=>s+x,0)/k;
  return Math.round(avg*10)/10; // 0.1
}
