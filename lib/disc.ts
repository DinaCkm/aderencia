/**
 * Cálculo da correlação DISC (perfil do candidato vs. perfil ideal do cargo/área).
 *
 * Para cada indicador (D, I, S, C):
 *   base = MAIOR entre (candidato, ideal)
 *   proximidade = 100 - (|candidato - ideal| / base × 100)
 *
 * A base do cálculo é sempre o MAIOR dos dois valores — assim a diferença nunca
 * ultrapassa a base e o resultado nunca fica negativo. Direção (acima ou abaixo
 * do ideal) não importa, só a distância absoluta entre os dois.
 *
 * Correlação DISC (%) = média da proximidade dos 4 indicadores.
 */
export function calcProximity(candidato: number, ideal: number): number {
  const base = Math.max(candidato, ideal);
  if (base === 0) return 100; // ambos zero — considerados idênticos
  const diff = Math.abs(candidato - ideal);
  return 100 - (diff / base) * 100;
}

export function calcDiscCorrelation(
  pD: number, pI: number, pS: number, pC: number,
  jD: number, jI: number, jS: number, jC: number
): number {
  const proxD = calcProximity(pD, jD);
  const proxI = calcProximity(pI, jI);
  const proxS = calcProximity(pS, jS);
  const proxC = calcProximity(pC, jC);
  return Math.round(((proxD + proxI + proxS + proxC) / 4) * 10) / 10;
}
