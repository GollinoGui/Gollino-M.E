import {
  FolderOpen,
  TrendingUp,
  ArrowDownCircle,
  ArrowUpCircle,
  Receipt,
  Wallet,
  AlertTriangle,
} from 'lucide-react'

// Total efetivamente recebido no caixa de uma sessão — soma só as formas de
// pagamento imediatas (dinheiro/cartão/cheque/PIX). Difere de `valor_total`
// da sessão, que é o faturamento (inclui a parcela "A Receber" de vendas
// fiado e vendas em Convênio, que ainda não entraram no caixa).
export function totalRecebidoSessao(sessao) {
  return (
    (sessao?.valor_dinheiro || 0) +
    (sessao?.valor_cartao_credito || 0) +
    (sessao?.valor_cartao_debito || 0) +
    (sessao?.valor_cheque || 0) +
    (sessao?.valor_pix || 0)
  )
}

// Rótulos e ícones de cada tipo de movimento de uma sessão de caixa —
// compartilhado entre a tela de Caixa, o relatório de fechamento
// (ModalRelatorioCaixa) e o fechamento de caixa atrasado (AvisoCaixaAtrasado).
export const TIPO_LABEL = {
  venda: 'Venda',
  abertura: 'Abertura',
  sangria: 'Sangria',
  reforco: 'Reforço',
  despesa: 'Despesa',
  vale: 'Vale',
  receita: 'Receita',
  recebimento_cr: 'Recebimento (CR)',
  prejuizo_cr: 'Baixa por prejuízo (CR)',
}

export const ICONE_POR_TIPO = {
  venda: { icon: TrendingUp, bg: '#EBF3FC', color: '#185FA5' },
  abertura: { icon: FolderOpen, bg: '#EAF6EE', color: '#22863A' },
  sangria: { icon: ArrowDownCircle, bg: '#FEF2F2', color: '#C53030' },
  reforco: { icon: ArrowUpCircle, bg: '#EAF6EE', color: '#22863A' },
  despesa: { icon: ArrowDownCircle, bg: '#FEF2F2', color: '#C53030' },
  vale: { icon: Wallet, bg: '#EFF6FF', color: '#1E40AF' },
  receita: { icon: ArrowUpCircle, bg: '#F0FDF4', color: '#15803D' },
  recebimento_cr: { icon: Receipt, bg: '#F0FDF4', color: '#15803D' },
  prejuizo_cr: { icon: AlertTriangle, bg: '#FEF2F2', color: '#991B1B' },
}

// Linha do tempo de uma sessão de caixa: abertura + vendas + sangria/reforço/
// despesas/vales/receitas/recebimentos/baixas por prejuízo.
export function montarHistoricoSessao(resumo, vendas) {
  return [
    resumo
      ? {
          tipo: 'abertura',
          hora: resumo.horaAbertura || '--:--',
          descricao: `Abertura de caixa (${resumo.dataAbertura?.split('-').reverse().join('/') || ''})`,
          valor: 0,
        }
      : null,
    ...(vendas || []).map((v) => ({
      tipo: 'venda',
      hora: v.hora_cadastro || '--:--',
      descricao: `Venda #${v.orcamento} — ${v.nome_cliente ? `${v.nome_cliente} (#${v.codigo_cliente})` : 'Consumidor'}`,
      valor: v.valor_total || 0,
    })),
    ...(resumo?.movimentosExtras || []).map((m) => ({
      tipo: m.tipo.toLowerCase(),
      hora: m.hora || '--:--',
      descricao: m.descricao || m.tipo,
      valor: m.valor || 0,
    })),
  ]
    .filter(Boolean)
    .sort((a, b) => (a.hora > b.hora ? 1 : -1))
}
