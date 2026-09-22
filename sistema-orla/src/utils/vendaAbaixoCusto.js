// Compara o preço efetivo pós-desconto (total/qtd) com o custo atual do
// produto — usado tanto pra decidir se uma venda precisa de aprovação
// (Vendas.jsx) quanto pra montar o texto do pedido pendente (Assistente.jsx).
// Aceita os dois formatos de item em uso no app: o do carrinho (qty/total/
// preco_custo_atual) e o já mapeado pro payload de vendas.salvar
// (quantidade/valor_total/preco_custo).
export function itemAbaixoDoCusto(item) {
  const custo = item.preco_custo ?? item.preco_custo_atual ?? 0
  const qtd = item.quantidade ?? item.qty ?? 0
  const totalItem = item.valor_total ?? item.total ?? 0
  if (custo <= 0 || qtd <= 0) return false
  return totalItem / qtd < custo - 0.001
}

export function itensAbaixoDoCusto(itens) {
  return (itens || []).filter(itemAbaixoDoCusto)
}
