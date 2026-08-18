# Documentação do Sistema — Gollino M.E

**Versão:** 1.4.0
**Data:** Agosto 2026
**Tecnologia:** Electron + React + Postgres (Supabase, banco na nuvem)
**Plataforma:** Windows (instalador NSIS, com atualização automática via GitHub Releases)

---

## Índice

1. [Visão Geral](#1-visão-geral)
2. [Arquitetura Técnica](#2-arquitetura-técnica)
3. [Banco de Dados](#3-banco-de-dados)
4. [Módulos Implementados](#4-módulos-implementados)
5. [API Interna (IPC)](#5-api-interna-ipc)
6. [Segurança](#6-segurança)
7. [Histórico de Desenvolvimento](#7-histórico-de-desenvolvimento)
8. [Dados de Clientes e Produtos](#8-dados-de-clientes-e-produtos)
9. [O que falta / Em construção](#9-o-que-falta--em-construção)
10. [Como Executar](#10-como-executar)

---

## 1. Visão Geral

O **Gollino M.E** é um sistema de gestão comercial (ERP) desktop voltado para pequenas empresas de varejo/comércio. Foi desenvolvido sob medida para a empresa **ELTER GOLLINO — GOLLINO M.E**, CNPJ 01.748.720/0001-00, localizada em Orlândia/SP.

> Desde junho/2026 o sistema roda sobre banco de dados **na nuvem (Supabase/Postgres)** em vez de um arquivo SQLite local — isso muda como backup, múltiplos computadores e segurança funcionam (ver seções 2, 3 e 6).

**Funcionalidades centrais:**

- Frente de caixa (PDV) com múltiplas formas de pagamento, inclusive mistas
- Gestão de clientes, produtos e fornecedores
- Pré-vendas / orçamentos / condicionais
- Devolução de mercadoria com crédito automático em haver
- Contas a receber e a pagar, com Plano de Contas hierárquico e baixa em lote
- Cheques a receber e a pagar
- Lançamentos extras: outras receitas, vales e despesas avulsas
- Controle de caixa (abertura/fechamento de turno) com relatório de fechamento detalhado
- Gestão de estoque completa: entrada, saída, pedido de compra, acerto, contagem com aprovação, reajuste de preços em lote
- Financeiro avançado ("Lucro Real"): lucro por confronto patrimonial, ponto de equilíbrio, calculadora de precificação por produto, sazonalidade de vendas
- Controle manual de Notas Fiscais (sem emissão eletrônica real — ver seção 4.21)
- Onze relatórios com exportação em Excel/CSV e PDF padronizado
- Importação em massa de produtos/clientes via CSV
- Log de auditoria do sistema
- Dashboard com KPIs em tempo real e meta do dia segmentada por forma de pagamento
- Assistente inteligente integrado
- Controle de acesso por nível de usuário
- Atualização automática do aplicativo via GitHub Releases

---

## 2. Arquitetura Técnica

```
sistema-orla/
├── electron/
│   ├── main.js             # Processo principal — IPC handlers, janela, PDF, backup, auto-update
│   ├── preload.js          # Bridge segura (contextBridge) — expõe window.api
│   ├── supabaseClient.js   # Cliente Supabase (URL/anon key, sessão persistida em disco)
│   └── database.js         # Toda a lógica de acesso a dados (chamadas ao Supabase)
├── src/
│   ├── App.jsx              # Raiz: roteamento, autenticação, permissões, atalhos
│   ├── main.jsx              # Entry point React
│   ├── pages/                # Páginas da aplicação (27 telas)
│   ├── components/           # Componentes reutilizáveis (TopBar, menus, modais, Assistente)
│   └── styles/
│       └── global.css        # Variáveis CSS, temas, responsividade
├── banco/                    # Pasta local só para artefatos gerados (PDFs) — não é mais o banco
├── schema.postgres.sql       # Definição base do banco Postgres (não é mais 100% a fonte da verdade — ver seção 3)
└── package.json
```

### Stack Tecnológica

| Camada | Tecnologia | Versão |
|---|---|---|
| Desktop | Electron | 41.0.3 |
| Frontend | React | 19.2.4 |
| Banco de dados | PostgreSQL via **Supabase** (`@supabase/supabase-js`) | 2.108.2 |
| Autenticação | Supabase Auth (e-mail sintético + senha) | — |
| Ícones | lucide-react | 0.577.0 |
| Build/Dev | Vite | 8.0.1 |
| Empacotamento | electron-builder (NSIS) | 26.8.1 |
| Atualização automática | electron-updater (GitHub Releases) | 6.8.9 |

> `better-sqlite3` ainda aparece no `package.json` (em `devDependencies`), mas é resíduo da arquitetura antiga — não é mais importado em nenhum lugar do código ativo. Pode ser removido com segurança quando alguém for limpar dependências.

### Comunicação Frontend ↔ Backend

O frontend (React) nunca acessa o banco diretamente. Toda comunicação passa pelo bridge seguro do Electron, que por sua vez fala com o Supabase (o banco em si roda na nuvem, não na máquina do usuário):

```
React (renderer) → window.api.xxx.yyy() → preload.js (contextBridge)
                                          → ipcRenderer.invoke('xxx:yyy')
                                          → ipcMain.handle('xxx:yyy')
                                          → database.js → supabase-js → Postgres (nuvem, Supabase)
```

**Por que passar pelo processo principal do Electron em vez do renderer falar direto com o Supabase?** Mantém o padrão de segurança original (renderer sem acesso a rede/credenciais além do bridge) e concentra toda a lógica de negócio (RPCs transacionais, formatação, validação) num único lugar — o mesmo motivo que já existia na versão SQLite, só que agora o "banco" do outro lado é remoto.

A sessão de autenticação (token do Supabase) é persistida em `app.getPath('userData')/supabase-session.json`, já que o processo principal do Electron não tem acesso a `localStorage` do navegador — isso é o que permite "lembrar o login" entre reinícios do app.

---

## 3. Banco de Dados

**Onde mora:** Postgres gerenciado pelo **Supabase** (nuvem) — não existe mais um arquivo `.db` local. Todos os computadores da loja enxergam os mesmos dados em tempo real.

**Segurança de acesso:** feita por **Row Level Security (RLS)** no próprio Postgres, não por senha de aplicação. A URL do projeto e a chave `anon` ficam hardcoded em `electron/supabaseClient.js` — isso é intencional (são consideradas públicas por design no modelo do Supabase); quem realmente barra acesso indevido é a política de RLS, que exige uma sessão autenticada válida (`auth.uid()`) e usa uma função `nivel_atual()` pra checar o nível do usuário logado antes de liberar leitura/escrita em cada tabela. Sem sessão válida, uma consulta não dá erro — simplesmente volta vazia (RLS filtra silenciosamente).

**`schema.postgres.sql`** tem a definição base, mas **não é mais a fonte de verdade completa** — há uma pasta `banco/*.sql` com migrações incrementais aplicadas depois (ex.: `migracao_gastos_operacionais.sql`, `migracao_fechamentos_patrimoniais.sql`, `migracao_produtos_versionamento_otimista.sql`, `migracao_vendas_numeracao_atomica.sql`, `migracao_contas_pagar_pagar_security_definer.sql`, entre outras), e ao menos três tabelas usadas pelo sistema (`solicitacoes_aprovacao` e as tabelas de log/comentários de aprovação) não aparecem em nenhum `CREATE TABLE` versionado no repositório — foram criadas direto no Supabase. **Antes de confiar neste arquivo como schema definitivo, seria bom exportar o schema real do projeto Supabase e comparar.**

### Tabelas Principais

| Tabela | Propósito |
|---|---|
| `clientes` | Cadastro de clientes |
| `produtos` | Cadastro de produtos, preços, custos, estoque, dados fiscais |
| `fornecedores` | Cadastro de fornecedores |
| `vendas` / `vendas_itens` | Cabeçalho e itens de cada venda/orçamento |
| `contas_receber` | Títulos a receber de clientes |
| `contas_pagar` | Compromissos a pagar a fornecedores |
| `plano_contas` | Plano de contas hierárquico (classificação de despesas) — **novo** |
| `historicos` | Categorias/observações reutilizáveis vinculadas a lançamentos |
| `caixas` / `movimentos_caixa` | Sessões de caixa (turnos) e seus lançamentos (venda, sangria, reforço etc.) |
| `movimentos_estoque` | Entradas, saídas e acertos de estoque — **novo** |
| `pedidos_compra` / `pedidos_compra_itens` | Pedidos de compra a fornecedores — **novo** |
| `entradas_mercadoria` / `entradas_mercadoria_itens` | Recebimento físico de mercadoria |
| `cheques` | Cheques recebidos: emissão, compensação, devolução — **novo** |
| `lancamentos_extras` | Outras receitas, vales e despesas avulsas — **novo** |
| `reajustes_preco` | Histórico de reajustes de preço em lote — **novo** |
| `fechamentos_patrimoniais` | Snapshots mensais de patrimônio (base do "Lucro Real") — **novo** |
| `gastos_operacionais` / `gastos_operacionais_pagamentos` | Despesas fixas operacionais e seus pagamentos mensais — **novo** |
| `pre_vendas` / `pre_vendas_itens` | Orçamentos e condicionais antes de virar venda |
| `usuarios` | Usuários do sistema, ligados a `auth_id` do Supabase Auth |
| `grupos_produtos` / `linhas_produtos` | Classificação hierárquica de produtos |
| `configuracoes` | Chave-valor para configurações do sistema |
| `numeradores` | Numeração sequencial atômica (vendas, pedidos etc., via RPC) |
| `cidades` | Tabela auxiliar de cidades |

---

## 4. Módulos Implementados

### 4.1 Login e Autenticação ✅

- Login por usuário + senha, autenticado via **Supabase Auth** (`signInWithPassword`) — internamente o sistema sintetiza um e-mail (`usuario@gollino.app`) porque o Supabase Auth exige e-mail, mas quem usa o sistema só digita usuário e senha normalmente.
- Sessão persistida localmente para "lembrar login" entre reinícios, mas sempre revalidada contra o Supabase ao abrir o app (se a sessão expirou/foi revogada, cai pro login de verdade em vez de mostrar um app "logado" com tudo vazio).
- Controle de acesso por nível (`usuario.nivel`), aplicado tanto na tela (`nivelMinimo` por rota em `App.jsx`) quanto no banco via RLS.

**Níveis de acesso:**

| Nível | Perfil | Páginas restritas |
|---|---|---|
| 1 | Operador | Apenas operacional |
| 2 | Gerente | + Lucro Real, Caixas fechados, Devolução, Haver, Cheques a pagar, Relatório financeiro |
| 250 | Super/Admin | + Configurações, Manutenção, Importação |

> Alguns colaboradores têm níveis intermediários customizados (ex.: nível 4) para liberar um recorte específico de permissões sem chegar a Super — ver cadastro de usuários em Configurações.

---

### 4.2 Dashboard ✅

- KPIs em tempo real: **Valor em caixa** (dinheiro esperado na gaveta da sessão aberta), **A receber**, **A pagar**, **Produtos** (com estoque baixo).
- **Meta do dia** segmentada por forma de pagamento (mesmas cores do card "Formas de pagamento") — o valor do dia em Convênio/Fiado aparece à parte, em textura riscada, já que ainda não é caixa de verdade.
- Gráfico de vendas dos últimos 7 dias.
- Botão "Tutorial" que abre um modal guiando pelas telas do sistema.
- Indicador de caixa aberto/fechado.

---

### 4.3 Vendas (PDV) ✅

Fluxo completo de venda:

1. Busca de cliente (opcional — permite "Consumidor")
2. Adição de produtos por código, descrição ou EAN
3. Quantidades e preços editáveis por item; **desconto por item em R$** (não mais em %) — limitado entre R$ 0 e o subtotal do item
4. Cálculo automático de totais e descontos
5. Modal de pagamento com formas: Dinheiro (com troco), Cartão de Crédito/Débito, PIX, Cheque, Haver, Convênio (30 dias), A Prazo (parcelamento personalizado) — e **pagamento misto**, combinando várias formas na mesma venda
6. Validação de estoque antes de finalizar
7. Exigência de nome + telefone quando sobra saldo "a prazo" para cliente anônimo
8. Geração automática de contas a receber para Convênio e A Prazo
9. Geração de PDF (recibo A4)
10. Cancelamento de venda restrito a nível ≥ 2 (reverte estoque)
11. Atalho F5 finaliza a venda direto do modal de pagamento

**Parcelamento A Prazo:** seleção de 2 a 12 parcelas, data do primeiro pagamento configurável, preview da tabela, última parcela absorve arredondamento.

---

### 4.4 Pré-Vendas / Orçamentos ✅

- Criação e edição de pré-vendas (orçamentos/condicionais/pedidos)
- Listagem com filtros por situação e data
- **Baixar como venda:** converte a pré-venda em venda real com escolha da forma de pagamento, gera PDF automaticamente
- Cancelamento de pré-venda

---

### 4.5 Devolução ✅ (nível ≥ 2)

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
- Cadastro completo com validação de campos e máscaras (CPF, CNPJ, CEP, telefone)
- Edição e exclusão (soft delete)
- Página de detalhes com histórico de compras e limite de crédito

---

### 4.7 Produtos ✅

- Listagem com busca por descrição, código, EAN, referência
- Filtros por grupo, linha, situação, estoque baixo
- Cadastro completo: preços, custos, margens, estoque, fiscal
- Edição e exclusão (soft delete)
- Página de detalhes com histórico de movimentos

---

### 4.8 Fornecedores ✅

- Listagem com busca por nome, CPF/CNPJ, código, layout mestre-detalhe
- Cadastro completo: nome, CNPJ/CPF, IE, contatos, endereço completo, situação
- Exclusão protegida por senha de administrador
- Exportação da listagem em Excel/CSV e PDF

---

### 4.9 Estoque ✅

Sete abas, todas funcionais:

| Aba | O que faz |
|---|---|
| Movimentos | Histórico de entradas/saídas/acertos |
| Posição de estoque | Saldo atual por produto |
| Pedido de compra | Monta pedido (fornecedor, previsão de entrega, frete/despesas, itens); ao "receber", atualiza estoque e gera a conta a pagar automaticamente; cancelamento verifica se algum item ficaria com estoque negativo |
| Saída de mercadoria | Baixa manual (uso interno, perda/avaria, devolução a fornecedor, brinde/amostra) |
| Acerto de estoque | Corrige a quantidade de um produto pontualmente, mostrando a diferença calculada |
| Contagem | Planilha em massa — usuário digita a contagem física de vários produtos; só os itens divergentes viram acerto; **nível abaixo de gerente precisa enviar a contagem para aprovação** em vez de aplicar direto |
| Reajuste de preços | Aplica um percentual (positivo ou negativo) sobre todos os produtos ou uma seleção, com histórico dos reajustes aplicados |

Entrada de mercadoria segue vinculada a pedidos de compra ou lançada avulsa.

---

### 4.10 Contas a Receber ✅

- Listagem com filtros: Todas / Abertas / Pagas + Vencidas
- Busca por cliente ou número do documento
- Indicadores: total em aberto, total pago, total vencido
- **Seleção múltipla (lote):** recebe várias contas de uma vez — cada uma continua sendo baixada individualmente pela mesma rotina auditada de sempre; ao confirmar, gera automaticamente um relatório PDF configurável (contas recebidas na operação + opcionalmente: em aberto do(s) cliente(s) atendido(s), em aberto de todos os clientes, vencidas de todos os clientes)
- **Baixa por prejuízo** (dívida incobrável), com controle de permissão para exclusão direta
- Criação manual de lançamentos
- Geração automática pela venda (Convênio = 30 dias, A Prazo = parcelas configuradas)

---

### 4.11 Contas a Pagar ✅

- Listagem com filtros: Todos / Aberto / Vencido / Pago
- Busca por fornecedor ou documento
- Indicadores: total em aberto, total vencido, total pago
- **Seleção múltipla (lote)** com relatório PDF automático ao confirmar, igual a Contas a Receber
- Criação manual com fornecedor/descrição e **Plano de Contas** — árvore hierárquica de 4 níveis (níveis 2/3 são só agrupadores, nível 4 são as contas-folha selecionáveis, ex. "Aluguel" dentro de "Despesas fixas"), usada pra classificar cada lançamento e depois analisar gasto por categoria
- Nível 1 só visualiza; inserir/pagar exige nível ≥ 2 (bloqueado no banco via RLS e na tela)

---

### 4.12 Caixa ✅

- Abertura de turno com valor inicial informado
- Fechamento com totais por forma de pagamento
- **Relatório de fechamento automático** (`ModalRelatorioCaixa`) ao fechar o turno — linha do tempo completa da sessão (venda, sangria, reforço, despesa, vale, recebimento de conta, baixa por prejuízo) com hora, ícone, descrição e valor; alerta específico se houve baixa por prejuízo na sessão; exporta em Excel/PDF. Aparece também ao fechar um caixa esquecido aberto de dia anterior.
- **Confirmação ao fechar o app com caixa aberto:** fechar a janela (X/Alt+F4) com o caixa em aberto pergunta antes de sair.
- Indicador visual no TopBar

---

### 4.13 Caixas Fechados ✅ (nível ≥ 2)

- Histórico de sessões de caixa encerradas, filtrável por período
- Cartões-resumo: nº de caixas fechados, vendas no período, total em dinheiro, prejuízo, total geral recebido
- Tabela ordenável (abertura/fechamento, usuário, valores por forma de pagamento), linha expansível com vendas individuais do turno e a parte ainda fiado/convênio
- Exportação Excel e PDF

---

### 4.14 Haver ✅ (nível ≥ 2)

- Listagem de clientes com saldo em haver > 0, busca por nome/código/CPF-CNPJ
- Total geral em haver
- Ajuste manual de saldo com preview do novo saldo
- Crédito automático gerado pelas devoluções de venda

---

### 4.15 Cheques a Receber / a Pagar ✅ (pagar exige nível ≥ 2)

- Cartões-resumo: total em aberto, total compensado
- Lista com filtro por nome/número e situação (aberto, compensado, devolvido); sinaliza vencidos
- Cadastro de novo cheque (emitente/favorecido, valor, banco, número, documento vinculado, datas)
- Ações por cheque em aberto: **Compensar** (baixa como pago) ou **Devolvido** (sem fundo)

---

### 4.16 Lançamentos Extras — Outras Receitas / Vales / Despesas ✅

Uma única tela reaproveitada para três finalidades:

- **Outras receitas** — entradas de caixa fora de venda (ex.: venda de sucata)
- **Vales** — adiantamento a colaborador
- **Despesas** — saída avulsa por categoria (salário, frete avulso, aluguel, outras)

Lista com totais "em aberto" e "pago/recebido"; registra novo lançamento (descrição, valor, data, pessoa, forma de pagamento); dá baixa nos em aberto; **cancelamento exige nível ≥ 2**.

---

### 4.17 Contador de Dinheiro ✅

Calculadora auxiliar de contagem de cédulas e moedas do Real — digita a quantidade de cada cédula/moeda, soma automaticamente. Não salva nada no banco nem se integra ao fechamento de caixa; é só uma ferramenta de conferência manual avulsa.

---

### 4.18 Consulta de Recebimentos / Pagamentos ✅

Relatórios de **baixas já efetuadas** (diferente de Contas a Receber/Pagar, que mostram o que está em aberto):

- **Consulta de Recebimentos** — histórico por parcela/tranche recebida de clientes, filtrável por período; uma conta quitada em etapas com formas diferentes aparece corretamente
- **Consulta de Pagamentos** — histórico de pagamentos a fornecedores, com totais de valor pago e descontos obtidos, agrupado por forma de pagamento

---

### 4.19 Financeiro — Lucro Real ✅ (nível ≥ 2)

Módulo de análise financeira avançada, com 4 abas:

**Visão Geral** — responde "quanto a loja realmente lucrou nesse período, e por quê". O **lucro real é apurado por confronto patrimonial**: variação do patrimônio líquido (estoque a custo + a receber + caixa/banco − a pagar) entre um fechamento e o anterior, ajustada por retiradas/aportes — não é um "receita menos despesa" contábil simples. Traz card de lucro com comparação ao período anterior, composição visual do período (pra onde foi o dinheiro), gráfico de tendência, receita vs. custos por mês, estimativa de lucro do próximo mês/ano, e tabela histórica. Inclui o **Simulador de Ponto de Equilíbrio**: quanto a loja precisa faturar no mês pra pagar as contas e pra bater uma meta de lucro, usando a margem de contribuição real do mês — cálculo de planejamento, separado do lucro real (que é o que já aconteceu).

**Calculadora de Produtos** — mesa de teste por produto (não grava nada): margem, markup, margem de contribuição, meta de lucro em unidades, projeção de ganho/perda ao mudar preço ou custo, elasticidade de desconto/aumento, tudo usando o ritmo real de vendas do produto. Tem modo de explicações inline ativável/desativável, pensado para quem está aprendendo os conceitos.

**Patrimônio** — mostra o patrimônio atual em 5 cards (estoque a custo, a receber, caixa/banco, a pagar, patrimônio atual) com um botão "Fechar o mês" que grava um snapshot permanente — é esse fechamento que alimenta o cálculo de lucro real da Visão Geral. Também traz **sazonalidade**: vendas por mês, contas a receber geradas por mês e venda por produto mês a mês (só aponta padrão quando o mês já se repetiu em ao menos 2 anos, pra evitar concluir tendência com um único ano de dado).

**Vendas Detalhadas** — extrato técnico venda a venda: quantidade, custo, preço, Markup % (taxa fixa interna, não calculada do custo/preço do item), Resultado e Lucro bruto, com imposto editável por linha; linhas com resultado/lucro negativo são sinalizadas.

---

### 4.20 Relatórios ✅

Onze relatórios, a maioria com exportação em Excel/CSV **e PDF** (layout padronizado com cabeçalho da empresa):

Vendas, Itens Vendidos, Entradas de Mercadoria, Fechamento de Caixa, Inventário de Produtos, Extrato, Produtos, Contas a Receber, Contas a Pagar, Financeiro, Plano de Contas.

Um botão de "relatório geral" no topo exporta em CSV único (Vendas + Produtos + Contas a Receber + Contas a Pagar do mês corrente) para conferência rápida.

---

### 4.21 Fiscal — NF-e ✅ (controle manual, sem emissão real)

**Não é uma integração real com SEFAZ.** Não há geração de XML/DANFE nem comunicação com webservices fiscais. É uma tela de controle: lista vendas de um período, mostra quais já têm NF-e "registrada" e quais estão pendentes. Ao clicar numa venda, abre um modal com os dados prontos pra copiar, um botão que abre o portal externo do emissor (URL configurável) e um campo pra anotar manualmente o número/chave da nota já emitida em outro sistema.

---

### 4.22 Configurações ✅

**Aba Dados da Empresa:** razão social, CNPJ, IE, contatos, endereço, CNAE/CRT, logotipo. Salva/carrega via banco (`configuracoes`, chave `empresa`).

**Aba Sistema:** preferências de impressão, largura do cupom, impressora padrão, mensagem no rodapé.

**Aba Usuários:** cadastro de usuários e controle de quais itens de menu ficam ocultos por usuário.

**Aba Backup:** ⚠️ ver seção 6 — o backup manual de arquivo local **não existe mais** (era baseado no `.db` do SQLite); a seção da tela hoje só retorna erro informando que o banco agora é compartilhado no Supabase.

---

### 4.23 Manutenção ✅ (parcial, nível 250)

Uma ferramenta hoje: **"Corrigir CR de vendas canceladas"** — cancela automaticamente títulos ainda em aberto no Contas a Receber pertencentes a vendas já canceladas. Estruturada como lista de ações com botão "Executar", pronta para receber mais rotinas no futuro.

---

### 4.24 Log do Sistema ✅

Linha do tempo de auditoria, filtrável por data e categoria: vendas, cancelamentos, recebimentos, pagamentos a fornecedor, baixas por prejuízo, movimentações de estoque, abertura/fechamento de caixa. Sem restrição de nível — qualquer usuário logado pode ver.

---

### 4.25 Importação CSV ✅ (nível 250)

Importação em massa de Produtos ou Clientes via arquivo `.csv`. Mostra instruções na tela (colunas obrigatórias/opcionais, separador aceito, templates em `scripts/`), roda a importação de uma vez e mostra totais de inseridos/atualizados/com erro, linha a linha. Registro com código já existente é atualizado; senão, é criado.

---

### 4.26 Assistente Inteligente ✅

Chat integrado com:
- Leitura de dados reais (vendas, CR/CP, estoque, caixa)
- Alertas automáticos: contas vencidas, estoque baixo, caixa fechado
- Respostas contextuais baseadas em dados do banco
- Sugestões rápidas (clique para perguntar)
- Abre automaticamente no login

---

### 4.27 Componentes Globais ✅

**TopBar:** menu principal com dropdowns por categoria (Operacional, Estoque, Financeiro, Fiscal, Relatórios, Cadastros, Configurações), toggle de tema claro/escuro, indicador de caixa, nome do usuário logado.

**Busca Global:** `Ctrl+K` ou `F1` — busca por páginas, filtros e ações, navegação pelo teclado.

**Atalhos de Teclado:**
- F1 → Busca global (mesma função do Ctrl+K)
- F2 → Vendas
- F3 → Pré-Vendas
- F4 → Contas a Receber
- F5 → Produtos (em Vendas, finaliza a venda em andamento em vez de navegar)
- F6 → Clientes
- F7 → Estoque
- F8 → Dashboard
- ESC → Voltar ao Dashboard / Fechar modal
- Ctrl+K → Busca global

**Avisos automáticos:** caixa esquecido aberto de dia anterior; confirmação ao fechar o app com caixa aberto; notificação de atualização disponível/baixada (auto-update).

---

## 5. API Interna (IPC)

Toda comunicação entre React e Electron usa IPC seguro via `contextBridge`. Domínios expostos hoje em `window.api.*`:

```
auth            → login, logout, verificarSenha, sessaoValida
dialog          → confirm, alert
app             → aoSolicitarFechamento, confirmarSaida, versao
updates         → aoDisponivel, aoNaoDisponivel, aoBaixado, aoErro, verificarAgora, reiniciarAgora

clientes        → listar, buscar, salvar, excluir
fornecedores    → listar, buscar, salvar, excluir
historicos      → listar, salvar, excluir
planoContas     → listar, salvar, excluir
produtos        → listar, buscar, salvar, excluir, recalcularEstoqueMinimo

vendas          → listar, buscar, salvar, cancelar, atualizarImposto, devolver
preVendas       → listar, buscar, salvar, cancelar, baixar, converter, proximoNumero

contasReceber   → listar, receber, totalAberto, baixarPrejuizo, listarPagamentos
contasPagar     → listar, pagar, salvar, totalAberto

caixa           → status, abrir, fechar, resumoAtual, historico, sangria, reforco
manutencao      → corrigirCR
dashboard       → resumo
financeiro      → resumoPeriodo, historicoMensal   (nível 250)
patrimonio      → snapshotAtual, listar, fechar

movimentosEstoque   → listar, salvar
pedidosCompra       → listar, salvar, cancelar, receber, proximoNumero
entradasMercadoria  → listar, itens, proximoNumero, confirmar
reajustesPreco      → listar, aplicar

cheques             → listar, salvar, baixar, devolver
lancamentosExtras   → listar, salvar, pagar, cancelar
gastosOperacionais  → fornecedoresFixos, listar, salvar, excluir, despesasCategoriaMes, marcarPago, desmarcarPago

haver           → listar, ajustar, totalGeral
nfe             → listar, registrar, detalhes, abrirPortal
importar        → abrirArquivo, produtos, clientes
log             → listar
usuarios        → listar, salvarMenusOcultos
config          → get, set
backup          → exportar, importar   (hoje retornam erro — ver seção 6)

aprovacoes      → listarPendentes, solicitar, aprovar, rejeitar, listarResolvidasNaoVistas, marcarVisualizado
comentarios     → listar, enviar, marcarVisto

relatorios      → inventario, itensVendidos, entradasMercadoria, sazonalidadeProdutos, vendasMensais,
                   contasReceberMensal, vendasDetalhadas, extrato
pdf             → gerarVenda, gerarRelatorio
```

Grande parte das operações transacionais (fechar venda, abrir/fechar caixa, sangria/reforço, receber conta, baixar por prejuízo, converter pré-venda, receber pedido de compra, ajustar haver, aplicar reajuste de preço, numeração sequencial, relatórios agregados) roda como **função/procedure no próprio Postgres** (`supabase.rpc(...)`), não só em JavaScript no processo principal — a lógica pesada e a atomicidade ficam no banco.

---

## 6. Segurança

### Senhas e sessão
- Autenticação via **Supabase Auth** (`signInWithPassword`), não mais hash local PBKDF2 no código do sistema — a senha em si é validada pelo Supabase.
- Usuários do sistema não têm e-mail próprio: o login usa `usuario+senha`, e um e-mail interno é sintetizado (`usuario@gollino.app`) só para satisfazer o requisito técnico do Supabase Auth.
- Sessão (JWT + refresh token) persistida em arquivo local (`userData/supabase-session.json`) para permitir "lembrar login"; sempre revalidada contra o Supabase ao reabrir o app.

### Acesso a dados
- Renderer (React) não tem acesso direto ao banco — tudo via IPC (`nodeIntegration: false`, `contextIsolation: true`)
- A barreira de segurança real dos dados é o **Row Level Security (RLS)** no Postgres, não o sigilo de nenhuma credencial no código — a URL e a chave `anon` do Supabase são públicas por design nesse modelo; sem uma sessão autenticada válida, o RLS devolve conjuntos vazios.
- Controle de nível de usuário duplicado: na tela (`nivelMinimo` em `App.jsx`) e no banco (RLS via `nivel_atual()`), então mesmo burlando a tela a permissão real continua barrada no banco.

### Validações
- Estoque validado antes de confirmar venda e antes de receber/cancelar pedido de compra (não deixa ficar negativo)
- Contagem de estoque por usuário abaixo de gerente precisa de aprovação antes de aplicar
- Exclusão de fornecedor exige senha de administrador
- Cancelamento de venda, devolução, cancelamento de lançamento extra e pagamento de contas a pagar exigem nível ≥ 2
- Soft delete em clientes e produtos (registro inativado, não apagado)

### ⚠️ Backup — lacuna conhecida
Diferente da versão anterior (cópia manual do arquivo `.db`), **hoje não existe nenhum mecanismo de backup implementado no aplicativo.** Os botões `backup:exportar`/`backup:importar` existem só por compatibilidade de interface e retornam erro explicando que "o banco agora é compartilhado no Supabase" — não há rotina de exportação/dump das tabelas no código. Na prática, a proteção dos dados depende inteiramente da infraestrutura do próprio Supabase (backups automáticos do plano contratado). **Vale confirmar diretamente no painel do Supabase qual é a política de backup/retenção do projeto** — isso não está documentado em lugar nenhum do repositório. Ver também seção 9.

---

## 7. Histórico de Desenvolvimento

### Fase 1 — Estrutura e CRUD Básico
Configuração do projeto Electron + React + Vite; schema inicial do banco; CRUD de clientes e produtos; login básico.

### Fase 2 — Operacional Principal
Sistema de vendas (PDV); múltiplas formas de pagamento; PDF de recibo; pré-vendas/condicionais; controle de caixa.

### Fase 3 — Financeiro e Estoque
Contas a Receber e a Pagar; gestão de estoque com entrada/saída; dashboard com KPIs e gráfico de 7 dias.

### Fase 4 — Segurança e Qualidade
Hash PBKDF2 (então local); remoção de credenciais hardcoded; controle de acesso por nível; validação de estoque em transação.

### Fase 5 — Fluxos Completos
Parcelamento A Prazo; Convênio; Devolução completa; conversão de Pré-venda em venda; correções de relatórios.

### Fase 6 — Produção
Manutenção fundida em Configurações; Backup manual de arquivo (SQLite, hoje descontinuado); página Haver.

### Fase 7 — Migração para Supabase (junho/2026)
Banco de dados sai do arquivo SQLite local e passa a rodar em **Postgres na nuvem via Supabase**. Autenticação passa a usar Supabase Auth (login por usuário+senha com e-mail sintético) em vez do hash PBKDF2 local. Segurança de acesso passa a ser garantida por Row Level Security no banco. Lógica transacional (vendas, caixa, contas, numeração sequencial) migra para funções/procedures no Postgres (`supabase.rpc`). O backup manual de arquivo `.db` deixa de existir — ver lacuna na seção 6.

### Fase 8 — Fechamento de caixa, lote em Contas a Pagar/Receber e relatórios (agosto/2026)
Relatório de fechamento de caixa com linha do tempo completa da sessão, exibido automaticamente ao fechar (inclusive caixa esquecido ou saída do app com caixa aberto); confirmação antes de fechar o app com caixa em aberto; pagamento/recebimento em lote em Contas a Pagar/Receber com relatório PDF configurável ao confirmar; Dashboard com meta do dia segmentada por forma de pagamento; PDF adicionado às abas de relatório que só tinham Excel; correção da pasta de dados em produção para `userData` (evita falha silenciosa em instalações dentro de `Program Files`).

### Fase 9 — Fornecedores e Estoque completo (agosto/2026)
Cadastro completo de Fornecedores (busca, mestre-detalhe, exclusão protegida por senha admin, exportação). Estoque ganha as abas que antes eram só "em desenvolvimento": Pedido de compra (com geração automática de conta a pagar ao receber), Saída de mercadoria manual, Acerto de estoque, Contagem em massa com fluxo de aprovação para nível abaixo de gerente, e Reajuste de preços em lote.

### Fase 10 — Financeiro avançado (agosto/2026)
Cheques a receber/pagar; Lançamentos Extras (outras receitas, vales, despesas); Plano de Contas hierárquico ligado a Contas a Pagar e a um relatório dedicado; Caixas Fechados (histórico de turnos); Consulta de Recebimentos e Consulta de Pagamentos (baixas já efetuadas); Contador de Dinheiro; início do controle manual de NF-e (sem emissão real).

### Fase 11 — Financeiro "Lucro Real" (agosto/2026)
Novo módulo com Visão Geral (lucro apurado por confronto patrimonial, com comparação ao período anterior, tendência e estimativa), Simulador de Ponto de Equilíbrio, Patrimônio (fechamento mensal + sazonalidade de vendas por produto), Calculadora de Produtos (margem/markup/meta de lucro/elasticidade por produto, com modo de explicações para quem está aprendendo os conceitos) e Vendas Detalhadas (extrato técnico venda a venda). Liberado para nível gerente (2), não só admin.

### Fase 12 — Vendas, importação e ajustes (agosto/2026)
Desconto por item em Vendas passa de percentual para valor em R$; PIX e Haver como formas diretas de pagamento; pagamento misto; Importação em massa de Produtos/Clientes via CSV; Log do Sistema (auditoria); atualização automática do aplicativo via `electron-updater`/GitHub Releases.

---

## 8. Dados de Clientes e Produtos

O histórico de commits (`dados reais`, `dados reais agora`, e o uso corrente de Contas a Pagar por integrantes reais da equipe) indica que **os dados de teste já foram substituídos por dados reais da empresa**, diferente de uma versão anterior desta documentação que ainda tratava isso como pendência crítica de pré-produção. Isso não foi confirmado consultando o banco diretamente nesta revisão — antes de tratar como definitivo (ex. antes de uma decisão que dependa disso), vale um `select count(*)` rápido em `clientes` e `produtos` no Supabase para confirmar.

Pontos que continuam valendo a checar periodicamente:
- Clientes com **Convênio** ou saldo em **Haver** estão corretos
- Produtos com `controla_estoque`, `estoque_atual` e `estoque_minimo` preenchidos corretamente
- Classificação por `codigo_grupo`/`codigo_linha` (linhas pré-configuradas: CHAPAS, GERAL, ARAMES, SELANTES)
- Campos fiscais (NCM, CFOP, CST) se for necessário emitir NF-e de verdade no futuro

---

## 9. O que falta / Em construção

### Alta prioridade

| Item | Status | Observação |
|---|---|---|
| Backup de dados | ⚠️ Sem mecanismo no app | Ver seção 6 — depende inteiramente da infraestrutura do Supabase; confirmar política de backup no painel do projeto |
| Emissão real de NF-e (SEFAZ) | 🔶 Só controle manual | Tela hoje só registra número/chave digitados manualmente; sem geração de XML/DANFE nem webservice |

### Média prioridade

| Item | Status | Observação |
|---|---|---|
| Boletos bancários | ❌ Não iniciado | Item de menu existe, cai em "Em breve" |
| Sangrias / Reforços de caixa como páginas dedicadas | 🔶 Só dentro do fluxo de Caixa | Os itens de menu separados "Sangrias"/"Reforços de caixa" caem em "Em breve" mesmo a função já existindo dentro da tela de Caixa — inconsistência de menu, não falta de funcionalidade |
| Mais rotinas em Manutenção | 🔶 Estrutura pronta, 1 rotina só | Tela já preparada pra receber mais ações |

### Baixa prioridade / Fora do escopo inicial

| Item | Status | Observação |
|---|---|---|
| Arquivo do contador (SPED) | ❌ Não iniciado | Item de menu Fiscal, sem case implementado |
| Manifestação do destinatário | ❌ Não iniciado | Item de menu Fiscal, sem case implementado |
| Acerto fiscal / Movimento fiscal | ❌ Não iniciado | Itens de menu Fiscal, sem case implementado |

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

# Gerar e publicar release no GitHub (dispara auto-update pros usuários)
npm run release
```

O instalador é gerado em `dist-electron/`.

### Banco de dados

- O banco roda em **Postgres na nuvem (Supabase)** — não há mais arquivo local pra apontar ou copiar.
- Credenciais do projeto (URL + chave `anon`) estão em `electron/supabaseClient.js`; a segurança real é via RLS no banco, não sigilo dessas strings.
- A pasta local `banco/` (via `userData` em produção) hoje só guarda artefatos gerados pelo app — PDFs de venda e de relatórios — não o banco de dados em si.
- Usuários e senhas reais devem ser verificados no cadastro de Usuários (Configurações) ou diretamente no projeto Supabase — não documentar credenciais aqui.

---

*Documentação atualizada em agosto de 2026 a partir da leitura do código-fonte (não substitui uma auditoria formal do schema do Supabase).*
*Sistema desenvolvido sob medida para Gollino M.E — Orlândia/SP.*
