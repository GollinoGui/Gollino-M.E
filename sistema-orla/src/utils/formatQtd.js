// Formata quantidade + unidade de medida do produto (UN, KG, M, L, etc.)
// de forma consistente em toda a tela — evita repetir a lógica de
// arredondamento/concatenação em cada lugar que exibe estoque/quantidade.
export function fmtQtd(qtd, unidade) {
  const num = (qtd || 0).toLocaleString('pt-BR', { maximumFractionDigits: 3 })
  return unidade ? `${num} ${unidade}` : num
}
