// Status derivado de uma conta a receber/pagar (situacao_docto + valor_pagamento
// + data_vencimento). Compartilhado entre ContasReceber.jsx, Relatorios.jsx e
// DetalhesCliente.jsx para não haver 3 implementações divergindo com o tempo.

export const STATUS_CFG = {
  ABERTO: { bg: '#EBF3FC', color: '#185FA5', label: 'Aberto' },
  PARCIAL: { bg: '#FFF7E6', color: '#B7791F', label: 'Parcial' },
  BAIXADO: { bg: '#EAF6EE', color: '#22863A', label: 'Baixado' },
  VENCIDO: { bg: '#FFF0F0', color: '#C53030', label: 'Vencido' },
  CANCELADO: { bg: '#F7F7F7', color: 'var(--text-muted)', label: 'Cancelado' },
  CARTAO: { bg: '#F3EEFC', color: '#6B3FA0', label: 'Cartão (auto)' },
  PREJUIZO: { bg: '#3A3A3A', color: '#fff', label: 'Prejuízo' },
}

// Conta gerada automaticamente por venda no cartão de crédito: o repasse é
// automático da operadora, então não precisa (nem pode) ser confirmada na mão.
export function isCartaoAutomatico(c) {
  return c.tipo_docto === 'CC' && c.situacao_docto === 'A'
}

// Calcula a situação real de uma conta a receber, incluindo pagamento parcial.
// Vencido tem prioridade sobre Parcial (é o sinal mais acionável: precisa
// cobrar) — o valor já pago continua visível na coluna "Pago" ao lado.
export function getSituacao(c) {
  if (c.situacao_docto === 'P') return 'BAIXADO'
  if (c.situacao_docto === 'C') return 'CANCELADO'
  if (c.situacao_docto === 'X') return 'PREJUIZO'
  if (isCartaoAutomatico(c)) return 'CARTAO'
  const hoje = new Date().toISOString().slice(0, 10)
  if (c.data_vencimento && c.data_vencimento < hoje) return 'VENCIDO'
  if ((c.valor_pagamento || 0) > 0) return 'PARCIAL'
  return 'ABERTO'
}
