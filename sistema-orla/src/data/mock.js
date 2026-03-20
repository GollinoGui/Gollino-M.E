export const produtos = [
  { id: '00000089', codigo: '00000089', descricao: 'Rufo simples 0,43mm', preco_vista: 28.50, preco_prazo: 31.00, un: 'm²', estoque: 42, condicional: 0 },
  { id: '00000090', codigo: '00000090', descricao: 'Rufo duplo 0,43mm', preco_vista: 34.00, preco_prazo: 37.00, un: 'm²', estoque: 29, condicional: 0 },
  { id: '00000215', codigo: '00000215', descricao: 'Calha alumínio 3m', preco_vista: 45.00, preco_prazo: 49.00, un: 'pc', estoque: 18, condicional: 2 },
  { id: '00000216', codigo: '00000216', descricao: 'Calha PVC 4m branca', preco_vista: 32.00, preco_prazo: 35.50, un: 'pc', estoque: 3, condicional: 0 },
  { id: '00000312', codigo: '00000312', descricao: 'Chapa galvanizada 26 1,20×3m', preco_vista: 187.00, preco_prazo: 198.00, un: 'pc', estoque: 7, condicional: 1 },
  { id: '00000313', codigo: '00000313', descricao: 'Chapa aço 18 1,00×2m', preco_vista: 145.00, preco_prazo: 158.00, un: 'pc', estoque: 0, condicional: 0 },
  { id: '00000314', codigo: '00000314', descricao: 'Chapa lisa zincada 0,50mm', preco_vista: 98.00, preco_prazo: 107.00, un: 'pc', estoque: 12, condicional: 0 },
  { id: '00000401', codigo: '00000401', descricao: 'Conector calha PVC', preco_vista: 4.50, preco_prazo: 5.00, un: 'pc', estoque: 150, condicional: 0 },
  { id: '00000402', codigo: '00000402', descricao: 'Suporte calha alumínio', preco_vista: 6.80, preco_prazo: 7.50, un: 'pc', estoque: 80, condicional: 0 },
  { id: '00000623', codigo: '00000623', descricao: 'Parafuso zinco c/ borracha 1/4', preco_vista: 0.45, preco_prazo: 0.50, un: 'pc', estoque: 500, condicional: 0 },
  { id: '00000624', codigo: '00000624', descricao: 'Parafuso auto-brocante 5/16', preco_vista: 0.60, preco_prazo: 0.70, un: 'pc', estoque: 300, condicional: 0 },
  { id: '00000700', codigo: '00000700', descricao: 'Manta asfáltica 1m', preco_vista: 22.00, preco_prazo: 24.00, un: 'm²', estoque: 0, condicional: 0 },
]

export const clientes = [
  { id: '000001', codigo: '000001', nome: 'Consumidor a vista', cpf_cnpj: '', telefone: '', email: '', cidade: '' },
  { id: '000066', codigo: '000066', nome: 'Arnaldo Leonidas', cpf_cnpj: '123.456.789-00', telefone: '(16) 99876-5432', email: 'arnaldo@email.com', cidade: 'Ribeirão Preto - SP' },
  { id: '000112', codigo: '000112', nome: 'Construtora Viver Ltda', cpf_cnpj: '12.345.678/0001-90', telefone: '(16) 3344-5566', email: 'compras@viver.com.br', cidade: 'Ribeirão Preto - SP' },
  { id: '000150', codigo: '000150', nome: 'João Carlos Ferreira', cpf_cnpj: '987.654.321-00', telefone: '(16) 98765-4321', email: '', cidade: 'Sertãozinho - SP' },
  { id: '000201', codigo: '000201', nome: 'Obras Rápidas ME', cpf_cnpj: '98.765.432/0001-10', telefone: '(16) 3212-4455', email: 'obrasr@email.com', cidade: 'Ribeirão Preto - SP' },
  { id: '000235', codigo: '000235', nome: 'Maria Aparecida Santos', cpf_cnpj: '111.222.333-44', telefone: '(16) 99111-2233', email: '', cidade: 'Batatais - SP' },
]

export const contasReceber = [
  { id: '1', documento: '00001492', tipo: 'OR', seq: 'A', cliente_id: '000066', cliente_nome: 'Arnaldo Leonidas', data_docto: '2024-01-15', vencimento: '2024-02-14', valor_docto: 43.10, em_aberto: 43.10, valor_pago: 0, situacao: 'ABERTO' },
  { id: '2', documento: '00001492', tipo: 'OR', seq: 'B', cliente_id: '000066', cliente_nome: 'Arnaldo Leonidas', data_docto: '2024-01-15', vencimento: '2024-03-15', valor_docto: 43.10, em_aberto: 43.10, valor_pago: 0, situacao: 'ABERTO' },
  { id: '3', documento: '00001492', tipo: 'OR', seq: 'C', cliente_id: '000066', cliente_nome: 'Arnaldo Leonidas', data_docto: '2024-01-15', vencimento: '2024-04-14', valor_docto: 43.10, em_aberto: 43.10, valor_pago: 0, situacao: 'ABERTO' },
  { id: '4', documento: '00001510', tipo: 'OR', seq: 'A', cliente_id: '000112', cliente_nome: 'Construtora Viver Ltda', data_docto: '2024-01-20', vencimento: '2024-02-19', valor_docto: 520.00, em_aberto: 520.00, valor_pago: 0, situacao: 'ABERTO' },
  { id: '5', documento: '00001498', tipo: 'OR', seq: 'A', cliente_id: '000150', cliente_nome: 'João Carlos Ferreira', data_docto: '2024-01-10', vencimento: '2024-01-25', valor_docto: 87.50, em_aberto: 0, valor_pago: 87.50, situacao: 'BAIXADO' },
]