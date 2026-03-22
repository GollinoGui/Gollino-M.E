# Documentação do Sistema — Gollino M.E

**Versão:** 1.0.0
**Data:** Março 2026
**Tecnologia:** Electron + React + SQLite (better-sqlite3)
**Plataforma:** Windows (instalador NSIS)

---

## Índice

1. [Visão Geral](#1-visão-geral)
2. [Arquitetura Técnica](#2-arquitetura-técnica)
3. [Banco de Dados](#3-banco-de-dados)
4. [Módulos Implementados](#4-módulos-implementados)
5. [API Interna (IPC)](#5-api-interna-ipc)
6. [Segurança](#6-segurança)
7. [Histórico de Desenvolvimento](#7-histórico-de-desenvolvimento)
8. [⚠️ Dados Pendentes — Clientes e Produtos](#8-️-dados-pendentes--clientes-e-produtos)
9. [O que falta / Em construção](#9-o-que-falta--em-construção)
10. [Como Executar](#10-como-executar)

---

## 1. Visão Geral

O **Gollino M.E** é um sistema de gestão comercial (ERP) desktop voltado para pequenas empresas de varejo/comércio. Foi desenvolvido sob medida para a empresa **ELTER GOLLINO — GOLLINO M.E**, CNPJ 01.748.720/0001-00, localizada em Orlândia/SP.

**Funcionalidades centrais:**

- Frente de caixa (PDV) com múltiplas formas de pagamento
- Gestão de clientes, produtos e fornecedores
- Pré-vendas / orçamentos / condicionais
- Devolução de mercadoria com crédito automático em haver
- Contas a receber e a pagar
- Controle de caixa (abertura/fechamento de turno)
- Gestão de estoque com movimentos de entrada e saída
- Relatórios financeiros e exportação CSV
- Backup manual do banco de dados
- Dashboard com KPIs em tempo real
- Assistente inteligente integrado
- Controle de acesso por nível de usuário

---

## 2. Arquitetura Técnica

```
sistema-orla/
├── electron/
│   ├── main.js          # Processo principal — IPC handlers, janela, PDF, backup
│   ├── preload.js       # Bridge segura (contextBridge) — expõe window.api
│   └── database.js      # Toda a lógica de banco de dados (SQLite)
├── src/
│   ├── App.jsx          # Raiz: roteamento, autenticação, permissões
│   ├── main.jsx         # Entry point React
│   ├── pages/           # Páginas da aplicação
│   ├── components/      # Componentes reutilizáveis
│   └── styles/
│       └── global.css   # Variáveis CSS, temas, responsividade
├── banco/
│   └── gollino.db       # Banco de dados SQLite (WAL mode)
├── schema.sql           # Definição completa do banco
└── package.json
```

### Stack Tecnológica

| Camada | Tecnologia | Versão |
|---|---|---|
| Desktop | Electron | 41.0.3 |
| Frontend | React | 19.2.4 |
| Banco de dados | SQLite via better-sqlite3 | 12.8.0 |
| Ícones | lucide-react | 0.577.0 |
| Build/Dev | Vite | 8.0.1 |
| Empacotamento | electron-builder (NSIS) | 26.8.1 |

### Comunicação Frontend ↔ Backend

O frontend (React) nunca acessa o banco diretamente. Toda comunicação passa pelo bridge seguro:

```
React (renderer) → window.api.xxx.yyy() → preload.js (contextBridge)
                                          → ipcRenderer.invoke('xxx:yyy')
                                          → ipcMain.handle('xxx:yyy')
                                          → database.js (SQLite)
```

---

## 3. Banco de Dados

**Arquivo:** `banco/gollino.db`
**Modo WAL** (Write-Ahead Logging) para melhor performance
**Foreign Keys** habilitados

### Tabelas Principais

#### `clientes`
Cadastro completo de clientes.
- `codigo` (PK), `nome`, `nome_fantasia`
- CPF/RG, CNPJ/IE, inscrição SUFRAMA
- Endereço completo (logradouro, número, bairro, CEP, cidade)
- `telefone`, `celular`, `email`
- **`haver`** — saldo de crédito do cliente (R$)
- `limite_credito`, `tipo_preco`, `tabela_preco`
- `situacao_cliente` (A=Ativo / I=Inativo)
- Auditoria: `usuario_cadastro`, `data_cadastro`, `data_atualizacao`

#### `produtos`
Cadastro completo de produtos.
- `codigo` (PK), `descricao`, `descricao_menor`, `referencia`
- `codigo_grupo`, `codigo_linha`, `unidade`
- **Estoque:** `estoque_atual`, `estoque_minimo`, `controla_estoque` (S/N)
- **Preços:** `preco_venda_vista`, `preco_venda_prazo`, `preco_venda_minimo`
- **Custos:** `custo_preco_unitario`, `preco_custo_atual`
- **Margens:** `margem_lucro_vista`, `margem_lucro_prazo`, `markup_vista`, `markup_prazo`
- **Fiscal:** NCM, CEST, CFOP, CST (ICMS/PIS/COFINS), alíquotas
- `situacao_produto` (A=Ativo / I=Inativo)

#### `vendas`
Cabeçalho das vendas/orçamentos.
- `orcamento` (PK), `codigo_cliente`, `data`
- **`situacao`:** N=Normal, C=Cancelada, D=Devolvida
- Valores: `valor_total`, `valor_produtos`, `valor_descontos_itens`, `valor_troco`
- Pagamentos: `valor_pago_dinheiro`, `valor_pago_cartao_credito`, `valor_pago_cartao_debito`, `valor_pago_cheque`, `valor_pago_haver`
- Parcelas: `qtde_parcelas1`, dados NF-e/SAT

#### `vendas_itens`
Itens de cada venda.
- `orcamento` (FK), `codigo_produto`, `descricao`, `quantidade`, `unidade`
- `preco_unitario`, `preco_custo`, `valor_desconto`, `valor_total`

#### `contas_receber`
Parcelas a receber (geradas automaticamente nas vendas a prazo/convênio).
- `nro_docto`, `tipo_docto` (VD=Venda / CR=Crédito), `seq_docto`, `codigo_cliente`
- `data_docto`, `data_vencimento`, `data_pagamento`
- `valor_docto`, `valor_pagamento`, `valor_desconto`
- **`situacao_docto`:** A=Aberta, P=Paga, C=Cancelada

#### `contas_pagar`
Compromissos a pagar com fornecedores.
- `codigo_fornecedor`, `nro_docto`, `codigo_forma_pagamento`
- `data_vencimento`, `data_pagamento`
- `valor_docto`, `valor_pagamento`, `valor_desconto`
- **`situacao_docto`:** A=Aberta, P=Paga, C=Cancelada
- `despesa_fixa` (S/N), `entra_caixa` (S/N)

#### `movimentos_caixa`
Turnos de caixa.
- `numero_caixa`, `numero_turno`
- `data_abertura`, `hora_abertura`, `usuario_abertura`, `valor_abertura`
- `data_fechamento`, `hora_fechamento`, `usuario_fechamento`
- Valores por forma: `valor_dinheiro`, `valor_cheque`, `valor_cartao_credito`, `valor_cartao_debito`
- **`situacao`:** A=Aberto, F=Fechado

#### `fornecedores`
Cadastro de fornecedores.
- `codigo`, `nome`, `nome_fantasia`, `cnpj`
- Endereço completo, `telefone`, `email`
- `situacao` (A=Ativo / I=Inativo)

#### `usuarios`
Usuários do sistema com controle de acesso.
- `usuario` (PK), `senha` (hash PBKDF2), `nome`
- **`nivel`:** 1=Operador, 2=Gerente, 250=Super (Admin)
- `super_usuario` (S/N), `ativo` (S/N), `ultima_saida`

#### `pre_vendas` / `pre_vendas_itens`
Orçamentos e condicionais antes de se tornarem venda.
- `numero` (PK), `tipo` (CONDICIONAL/ORCAMENTO/PEDIDO)
- `codigo_cliente`, `valor_total`, `qtde_itens`
- **`situacao`:** ABERTA, BAIXADA, CANCELADA

#### `movimentos_estoque`
Registro de entradas, saídas e acertos de estoque.
- `tipo` (ENTRADA/SAIDA/ACERTO), `produto_id`
- `quantidade`, `valor_unitario`, `total`, `data`, `fornecedor`, `obs`

#### `configuracoes`
Chave-valor para configurações do sistema.
- `chave` (UNIQUE), `valor` (texto/JSON), `descricao`

#### `grupos_produtos` / `linhas_produtos`
Classificação hierárquica de produtos.
- Linhas pré-configuradas: CHAPAS, GERAL, ARAMES, SELANTES

---

## 4. Módulos Implementados

### 4.1 Login e Autenticação ✅

- Tela de login com campos usuário e senha
- Hash PBKDF2 (100.000 iterações, SHA-256, salt aleatório)
- Migração automática de hashes legados SHA256 → PBKDF2 no primeiro login
- Controle de acesso por nível (`usuario.nivel`)

**Níveis de acesso:**

| Nível | Perfil | Páginas restritas |
|---|---|---|
| 1 | Operador | Apenas operacional |
| 2 | Gerente | + Relatórios, Contas, Caixas fechados |
| 250 | Super/Admin | + Configurações, Manutenção |

**Restrições por página:**

| Página | Nível mínimo |
|---|---|
| Configurações (empresa/sistema) | 250 |
| Manutenção | 250 |
| Relatórios (todos) | 2 |
| Contas a receber/pagar | 2 |
| Caixas fechados, Haver | 2 |

---

### 4.2 Dashboard ✅

Painel principal com KPIs em tempo real:
- Total de vendas do período (com filtro: hoje/semana/mês/ano)
- Total em contas a receber em aberto
- Total em contas a pagar em aberto
- Quantidade de produtos com estoque abaixo do mínimo
- Gráfico de vendas dos últimos 7 dias (barras)
- Animação de contagem nos números
- Indicador de caixa aberto/fechado

---

### 4.3 Vendas (PDV) ✅

Fluxo completo de venda:

1. Busca de cliente (opcional — permite "Consumidor")
2. Adição de produtos por código, descrição ou EAN
3. Quantidades e preços editáveis por item
4. Cálculo automático de totais e descontos
5. Modal de pagamento com formas:
   - Dinheiro (com cálculo de troco)
   - Cartão de Crédito / Débito
   - PIX
   - Cheque
   - Convênio (gera conta a receber com 30 dias)
   - A Prazo (parcelamento personalizado)
   - Haver (usa saldo do cliente)
6. Validação de estoque antes de finalizar
7. Geração automática de contas a receber para Convênio e A Prazo
8. Geração de PDF (recibo A4)
9. Cancelamento de venda (reverte estoque)
10. Exibição de erros com toast vermelho

**Parcelamento A Prazo:**
- Seleção de 2 a 12 parcelas
- Data do primeiro pagamento configurável
- Preview da tabela de parcelas
- Última parcela absorve diferença de arredondamento

---

### 4.4 Pré-Vendas / Orçamentos ✅

- Criação e edição de pré-vendas (orçamentos/condicionais/pedidos)
- Listagem com filtros por situação e data
- **Baixar como venda:** converte a pré-venda em venda real com escolha da forma de pagamento, gera PDF automaticamente
- Cancelamento de pré-venda

---

### 4.5 Devolução ✅

Fluxo completo de devolução de mercadoria:

1. Busca da venda pelo número
2. Exibição dos itens com campos de quantidade a devolver
3. Validação de quantidades (não pode devolver mais do que foi vendido)
4. Reposição automática do estoque
5. Cancelamento das contas a receber associadas
6. Crédito do valor no **haver** do cliente
7. Marcação da venda como devolvida (D) ou mantém Normal (N) se parcial
8. Campo de motivo da devolução

---

### 4.6 Clientes ✅

- Listagem com busca por nome, CPF/CNPJ, código
- Cadastro completo com validação de campos
- Máscaras automáticas: CPF, CNPJ, CEP, telefone
- Edição e exclusão (soft delete — inativa o registro)
- Página de detalhes com histórico de compras e limite de crédito

---

### 4.7 Produtos ✅

- Listagem com busca por descrição, código, EAN, referência
- Filtros por grupo, linha, situação, estoque baixo
- Cadastro completo: preços, custos, margens, estoque, fiscal
- Edição e exclusão (soft delete)
- Página de detalhes com histórico de movimentos

---

### 4.8 Estoque ✅ (parcial)

**Funcionando:**
- Listagem de movimentos (entrada/saída/acerto)
- Posição de estoque atual de todos os produtos
- Modal de entrada de mercadoria com produto, quantidade e fornecedor
- Atualização automática do `estoque_atual` em cada venda e devolução

**Em construção (aparece com aviso "Em desenvolvimento"):**
- Pedido de compra
- Saída de mercadoria manual
- Acerto de estoque
- Contagem de estoque
- Consulta de reajustes

---

### 4.9 Contas a Receber ✅

- Listagem com filtros: Todas / Abertas / Pagas + Vencidas
- Busca por cliente ou número do documento
- Indicadores: total em aberto, total pago, total vencido
- Modal de recebimento com forma de pagamento, valor e data
- Criação manual de lançamentos
- Geração automática pela venda (Convênio = 30 dias, A Prazo = parcelas configuradas)

---

### 4.10 Contas a Pagar ✅

- Listagem com filtros: Todos / Aberto / Vencido / Pago
- Busca por fornecedor ou documento
- Indicadores: total em aberto, total vencido, total pago
- Modal de pagamento com forma, valor e data
- Criação manual de novos lançamentos
- Seleção por checkbox para operações em lote

---

### 4.11 Caixa ✅

- Abertura de turno com valor inicial informado
- Fechamento com totais por forma de pagamento (dinheiro, cheque, cartão crédito, cartão débito)
- Indicador visual no TopBar (caixa aberto/fechado)
- Histórico de movimentos do caixa

---

### 4.12 Haver ✅

Gerenciamento do crédito acumulado pelos clientes:

- Listagem de todos os clientes com saldo em haver > 0
- Busca por nome, código ou CPF/CNPJ
- Total geral em haver (todos os clientes somados)
- Ajuste manual de saldo (crédito ou débito) com confirmação
- Preview do novo saldo antes de confirmar
- Crédito automático gerado pelas devoluções de venda

---

### 4.13 Relatórios ✅

Cinco relatórios com filtros e exportação CSV:

| Relatório | Filtros | Campos |
|---|---|---|
| Contas a Receber | Todas / Abertas / Pagas | Cliente, Documento, Seq., Vencimento, Valor, Pago, Situação |
| Contas a Pagar | Todas / Abertas / Pagas | Fornecedor, Documento, Vencimento, Valor, Pago, Situação |
| Vendas | Todas as vendas | Nº, Cliente, Data, Forma pgto, Total, Situação |
| Pré-Vendas | Todas as pré-vendas | Nº, Tipo, Cliente, Data, Total, Situação |
| Financeiro | Período (data início/fim) | Total de vendas no período |

---

### 4.14 Configurações ✅

**Aba Dados da Empresa:**
- Razão social, nome fantasia, CNPJ, inscrição estadual
- Contatos: telefone, celular, e-mail, site
- Endereço completo com CEP e UF
- Dados fiscais: CNAE, CRT
- Upload de logotipo (PNG/JPG)
- Salva e carrega via banco de dados (`configuracoes`, chave = `empresa`)

**Aba Sistema (parcialmente funcional):**
- Preferências de impressão
- Largura do cupom, impressora padrão
- Mensagem no rodapé do cupom

**Aba Backup:**
- Backup manual: abre diálogo "Salvar como", copia o arquivo `.db` para o destino escolhido
- Seção de backup automático Google Drive (interface visual, funcionalidade não implementada)

---

### 4.15 Assistente Inteligente ✅

Chat integrado na interface com:
- Leitura de dados reais (vendas, CR/CP, estoque, caixa)
- Alertas automáticos: contas vencidas, estoque baixo, caixa fechado
- Respostas contextuais baseadas em dados do banco
- Sugestões rápidas (clique para perguntar)
- Saudação por período do dia

---

### 4.16 Componentes Globais ✅

**TopBar:**
- Menu principal com dropdowns por categoria
- Toggle de tema claro/escuro
- Botão de busca global (Ctrl+K)
- Indicador de caixa aberto/fechado
- Nome do usuário logado

**Busca Global (Ctrl+K):**
- Busca por nome de páginas, filtros e ações
- Navegação rápida pelo teclado

**Atalhos de Teclado:**
- F1 → Ajuda / Lista de atalhos
- F2 → Vendas
- F3 → Pré-Vendas
- F4 → Contas a Receber
- F5 → Produtos
- F6 → Clientes
- F7 → Estoque
- F8 → Dashboard
- ESC → Voltar ao Dashboard / Fechar modal
- Ctrl+K → Busca global

---

## 5. API Interna (IPC)

Toda comunicação entre React e Electron usa IPC seguro via `contextBridge`.

```
window.api.auth.login(dados)

window.api.clientes.listar(filtros)
window.api.clientes.buscar(codigo)
window.api.clientes.salvar(dados)
window.api.clientes.excluir(codigo)

window.api.produtos.listar(filtros)
window.api.produtos.buscar(codigo)
window.api.produtos.salvar(dados)
window.api.produtos.excluir(codigo)

window.api.vendas.listar(filtros)
window.api.vendas.buscar(orcamento)
window.api.vendas.salvar(dados)
window.api.vendas.cancelar(dados)
window.api.vendas.devolver(dados)
window.api.vendas.proximoNumero()

window.api.contasReceber.listar(filtros)
window.api.contasReceber.receber(dados)
window.api.contasReceber.totalAberto()

window.api.contasPagar.listar(filtros)
window.api.contasPagar.pagar(dados)
window.api.contasPagar.salvar(dados)
window.api.contasPagar.totalAberto()

window.api.caixa.status()
window.api.caixa.abrir(dados)
window.api.caixa.fechar(dados)

window.api.dashboard.resumo(periodo)

window.api.config.get(chave)
window.api.config.set({ chave, valor })

window.api.backup.exportar()

window.api.preVendas.listar(filtros)
window.api.preVendas.buscar(numero)
window.api.preVendas.salvar(dados)
window.api.preVendas.cancelar(numero)
window.api.preVendas.baixar(numero)
window.api.preVendas.proximoNumero()

window.api.movimentosEstoque.listar(filtros)
window.api.movimentosEstoque.salvar(dados)

window.api.pdf.gerarVenda(orcamento)

window.api.haver.listar(busca)
window.api.haver.ajustar(dados)
window.api.haver.totalGeral()
```

---

## 6. Segurança

### Senhas
- Hash: **PBKDF2** com 100.000 iterações, SHA-256, salt aleatório de 32 chars
- Formato armazenado: `pbkdf2:<salt>:<hash>`
- Migração automática: hashes legados (SHA256+salt fixo) são migrados para PBKDF2 no primeiro login do usuário
- Credenciais nunca em texto puro no código-fonte

### Acesso a dados
- Renderer (React) não tem acesso direto ao banco — tudo via IPC
- `nodeIntegration: false`, `contextIsolation: true`
- API exposta somente via `contextBridge`

### Validações
- Estoque validado dentro de transação antes de confirmar venda
- Transações SQLite garantem atomicidade (tudo ou nada)
- Soft delete em clientes e produtos (registro inativado, não apagado)

---

## 7. Histórico de Desenvolvimento

### Fase 1 — Estrutura e CRUD Básico
- Configuração do projeto Electron + React + Vite + SQLite
- Definição do schema completo do banco de dados
- CRUD de clientes e produtos com busca e filtros
- Tela de login com autenticação básica

### Fase 2 — Operacional Principal
- Sistema de vendas completo (PDV) com adição de itens e cálculo de totais
- Múltiplas formas de pagamento (Dinheiro, Cartão, PIX, Cheque)
- Geração de PDF para recibo de venda
- Pré-vendas / condicionais com conversão para venda
- Controle de caixa (abertura e fechamento de turno)

### Fase 3 — Financeiro e Estoque
- Tela de Contas a Receber com modal de recebimento
- Tela de Contas a Pagar com modal de pagamento e criação manual
- Gestão de estoque com movimentos de entrada/saída
- Dashboard com KPIs e gráfico de 7 dias

### Fase 4 — Segurança e Qualidade
- Substituição de hash SHA256 por **PBKDF2** com migração automática
- Remoção de credenciais hardcoded no código (acesso rápido removido da tela de login)
- Propagação do objeto `usuario` logado para todas as páginas
- Validação de estoque dentro de transação na venda
- Controle de acesso por nível de usuário (nivelMinimo por rota)
- Substituição de todos os `usuario: 'rosangela'` hardcoded pelo usuário real logado

### Fase 5 — Fluxos Completos
- **Parcelamento A Prazo:** modal de pagamento com seleção de parcelas, data inicial, preview da tabela, arredondamento correto na última parcela
- **Convênio:** geração automática de conta a receber com vencimento em 30 dias
- **Devolução:** fluxo completo — busca venda, seleciona itens, reverte estoque, cancela CR, credita haver
- **Pré-venda Baixar:** conversão para venda real com modal de forma de pagamento e geração de PDF
- **Relatórios:** correção de campos (nro_docto, seq_docto) e adição de filtros por situação e período

### Fase 6 — Produção
- Manutenção fundida ao menu Configurações (elimina overflow do TopBar em telas menores)
- TopBar exibe nome real do usuário logado (removido "Secretaria" hardcoded)
- Configurações salva e carrega dados da empresa via banco (era só visual)
- Backup manual funcional com diálogo de salvar arquivo
- ContasPagar e ContasReceber recebem prop `usuario` — sem mais hardcoded
- `contasPagar.salvar` adicionado ao preload
- **Página Haver** criada do zero: consulta de créditos, total geral, ajuste manual de saldo
- API de haver adicionada ao backend (database.js, main.js, preload.js)

---

## 8. ⚠️ Dados Pendentes — Clientes e Produtos

> **ATENÇÃO — ITEM CRÍTICO ANTES DE ENTRAR EM PRODUÇÃO**

O banco de dados atualmente **não possui os clientes e produtos reais da empresa**. Os dados presentes são apenas exemplos de desenvolvimento ou registros criados durante os testes.

### O que precisa ser feito:

#### Clientes
- [ ] Importar ou cadastrar manualmente todos os clientes da empresa
- [ ] Campos obrigatórios: `codigo`, `nome`, `situacao_cliente`
- [ ] Campos importantes: CPF/CNPJ, telefone, limite de crédito, tipo de preço
- [ ] Verificar se clientes com **Convênio** ou saldo em **Haver** estão corretos
- [ ] Definir a sequência de numeração de novos clientes (o sistema usa o maior código + 1)

#### Produtos
- [ ] Importar ou cadastrar manualmente todos os produtos comercializados
- [ ] Campos obrigatórios: `codigo`, `descricao`, `unidade`
- [ ] Campos críticos: `preco_venda_vista`, `preco_venda_prazo`
- [ ] Definir `controla_estoque` (S/N) para cada produto
- [ ] Preencher `estoque_atual` e `estoque_minimo` com os valores reais
- [ ] Classificar por `codigo_grupo` e `codigo_linha` (grupos/linhas já pré-configurados: CHAPAS, GERAL, ARAMES, SELANTES)
- [ ] Verificar campos fiscais se necessário para NF-e: NCM, CFOP, CST

#### Fornecedores
- [ ] Cadastrar os principais fornecedores para vinculação nas contas a pagar e entradas de estoque

#### Grupos e Linhas de Produtos
- [ ] Revisar e complementar as linhas já existentes (CHAPAS, GERAL, ARAMES, SELANTES)
- [ ] Criar grupos adicionais se necessário

#### Formas recomendadas de importação:
1. **Cadastro manual** pela tela de Produtos (recomendado para poucos registros — até ~200)
2. **Script de importação** via CSV se a empresa tiver lista de produtos em planilha (requer desenvolvimento adicional)
3. **Migração de sistema anterior** se houver banco de dados exportável

> **Enquanto os produtos reais não estiverem cadastrados, o sistema não pode ser usado em produção para vendas reais.**

---

## 9. O que falta / Em construção

### Alta prioridade

| Item | Status | Observação |
|---|---|---|
| Clientes reais cadastrados | ❌ Pendente | Ver seção 8 |
| Produtos reais cadastrados | ❌ Pendente | Ver seção 8 |

### Média prioridade

| Item | Status | Observação |
|---|---|---|
| Caixa — Relatório de fechamento | 🔶 Parcial | Fecha o turno mas não gera resumo imprimível |
| Estoque — Saída manual | 🔶 Parcial | Tela mostra aviso "Em desenvolvimento" |
| Estoque — Acerto de estoque | 🔶 Parcial | Idem |
| Estoque — Contagem de estoque | 🔶 Parcial | Idem |
| Manutenção | 🔶 Parcial | Aparece "Em breve" (acesso restrito nível 250) |
| Backup automático Google Drive | 🔶 Interface pronta | Funcionalidade não implementada |
| Importação em massa (CSV) | ❌ Não iniciado | Útil para carga inicial de clientes/produtos |

### Baixa prioridade / Fora do escopo inicial

| Item | Status | Observação |
|---|---|---|
| NF-e (Nota Fiscal Eletrônica) | ❌ Em breve | Requer integração com SEFAZ |
| Boletos bancários | ❌ Em breve | Requer integração com banco |
| Cheques a receber/pagar | ❌ Em breve | Telas não iniciadas |
| Vales / Sangrias / Reforços | ❌ Em breve | Vinculados ao fluxo de caixa |
| Arquivo contador | ❌ Em breve | Exportação SPED |
| Pedido de compra | ❌ Em breve | Faz parte do módulo Estoque |
| Consulta de reajustes | ❌ Em breve | Faz parte do módulo Estoque |

---

## 10. Como Executar

### Desenvolvimento

```bash
# Instalar dependências
npm install

# Iniciar em modo desenvolvimento (Vite + Electron com hot-reload)
npm run dev:electron
```

### Build para produção

```bash
# Gerar instalador Windows (.exe NSIS)
npm run build:electron
```

O instalador é gerado em `dist-electron/`.

### Banco de dados

- Localização em dev: definida pelo `main.js` (variável `getDbPath()`)
- Localização em prod: `%APPDATA%\Gollino ME\banco\gollino.db` (Windows)
- O schema é executado automaticamente na primeira inicialização (`database.init()`)
- Usuários padrão criados na inicialização:
  - `admin` — Nível 250 (Super Admin)
  - `elter` — Nível 2 (Gerente)
  - `rosangela` — Nível 4 (Gerente+)

> **As senhas iniciais usam hash SHA256 legado.** Na primeira vez que cada usuário fizer login, a senha é migrada automaticamente para PBKDF2. As senhas em si não estão documentadas aqui por segurança — verificar com o administrador do sistema ou redefinir diretamente no banco.

---

*Documentação gerada em março de 2026.*
*Sistema desenvolvido sob medida para Gollino M.E — Orlândia/SP.*
