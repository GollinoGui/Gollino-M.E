// Cor fixa por gasto operacional (Ponto de Equilíbrio) derivada do id — a
// mesma cor aparece na linha do gasto fixo em Lucro Real e na linha
// correspondente em Contas a Pagar, pra ligar visualmente as duas telas sem
// precisar de nenhum cadastro manual de cor.
const PALETA = ['#2563EB', '#7C3AED', '#DB2777', '#D97706', '#059669', '#0891B2', '#DC2626', '#4338CA']

export function corGastoFixo(gastoId) {
  return PALETA[gastoId % PALETA.length]
}
