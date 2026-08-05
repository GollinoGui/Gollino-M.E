// Utilitários compartilhados de relatório (Excel/CSV e PDF), usados tanto pelas
// páginas operacionais (Contas a Receber/Pagar, Caixa) quanto pelas abas da
// seção Relatórios — para manter o mesmo formato em todo o sistema.

const fmtDataBR = (d) => (d ? new Date(d + 'T12:00:00').toLocaleDateString('pt-BR') : '-')
const fmtMoedaBR = (v) =>
  (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const fmtNumCSV = (v) => (v || 0).toFixed(2).replace('.', ',')

// ── Exportar CSV (abre no Excel) ────────────────────────────────────────────
export function exportarCSV(linhas, nomeArquivo) {
  if (!linhas || linhas.length === 0) return
  const cabecalho = Object.keys(linhas[0])
  const escapar = (v) => {
    const s = String(v ?? '')
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"`
      : s
  }
  const bom = String.fromCharCode(0xfeff) // BOM para Excel reconhecer UTF-8
  const csv =
    bom +
    [cabecalho.join(';'), ...linhas.map((l) => cabecalho.map((c) => escapar(l[c])).join(';'))].join(
      '\r\n',
    )
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${nomeArquivo}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ── Agrupamento por cliente/fornecedor ──────────────────────────────────────
// Registros com o mesmo código + nome ficam juntos num único grupo; os grupos
// saem em ordem alfabética pelo nome, e os itens de cada grupo por data.
export function agruparPorPessoa(itens, { codigoKey, nomeKey, dataOrdenacaoKey = 'data_vencimento' }) {
  const mapa = new Map()
  for (const item of itens) {
    const codigo = item[codigoKey]
    const nome = item[nomeKey] || codigo || '—'
    const chave = `${codigo ?? ''}|${nome}`
    if (!mapa.has(chave)) mapa.set(chave, { codigo, nome, itens: [] })
    mapa.get(chave).itens.push(item)
  }
  const grupos = [...mapa.values()]
  if (dataOrdenacaoKey) {
    grupos.forEach((g) =>
      g.itens.sort((a, b) => (a[dataOrdenacaoKey] || '').localeCompare(b[dataOrdenacaoKey] || '')),
    )
  }
  grupos.sort((a, b) => String(a.nome).localeCompare(String(b.nome), 'pt-BR', { sensitivity: 'base' }))
  return grupos
}

// ── Dados da empresa (cabeçalho dos PDFs) ───────────────────────────────────
export async function buscarEmpresa() {
  try {
    const empresa = await window.api.config.get('empresa')
    return empresa || { razao_social: 'ELTER GOLLINO', nome_fantasia: 'GOLLINO M.E' }
  } catch {
    return { razao_social: 'ELTER GOLLINO', nome_fantasia: 'GOLLINO M.E' }
  }
}

// ── Geração do PDF (via processo principal do Electron) ────────────────────
export async function gerarPdfRelatorio(html, nomeArquivo) {
  const res = await window.api.pdf.gerarRelatorio(html, nomeArquivo)
  if (!res?.sucesso) throw new Error(res?.erro || 'Erro ao gerar o PDF do relatório.')
  return res
}

function estiloBasePdf() {
  return `
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#111;padding:16px 20px}
    table{width:100%;border-collapse:collapse;margin-bottom:2px}
    th,td{padding:4px 8px;text-align:left;vertical-align:top}
    thead th{background:#EBF3FC;font-size:10px;color:#333;border-bottom:1px solid #B7CDE5}
    tbody tr:not(.grupo-cabecalho):not(.grupo-subtotal){border-bottom:1px solid #eee}
    .grupo-cabecalho td{background:#185FA5;color:#fff;font-weight:700;font-size:11px;padding-top:6px;padding-bottom:6px}
    .grupo-subtotal td{background:#F0F4FA;font-weight:700;border-top:1px solid #B7CDE5;border-bottom:2px solid #B7CDE5}
    .total-geral td{background:#185FA5;color:#fff;font-weight:700;font-size:12px}
    .num{text-align:right;white-space:nowrap}
    @page{margin:10mm;size:A4}
  `
}

function cabecalhoPdf(empresa, titulo, subtitulo, totalRegistros) {
  const agora = new Date()
  const impresso = agora.toLocaleDateString('pt-BR') + ' ' + agora.toLocaleTimeString('pt-BR')
  return `
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px;border-bottom:2px solid #185FA5;padding-bottom:10px">
      <div>
        <div style="font-size:15px;font-weight:700;color:#185FA5">${empresa?.razao_social || empresa?.nome_fantasia || 'ELTER GOLLINO'}</div>
        <div style="font-size:13px;font-weight:600;margin-top:4px">${titulo}</div>
        ${subtitulo ? `<div style="font-size:11px;color:#555;margin-top:2px">${subtitulo}</div>` : ''}
      </div>
      <div style="text-align:right;font-size:10px;color:#666">
        Impresso em ${impresso}<br>
        ${totalRegistros != null ? `${totalRegistros} registro(s)` : ''}
      </div>
    </div>
  `
}

// Relatório agrupado por cliente/fornecedor, com subtotal por grupo e total geral
// no final — mesmo formato usado no relatório impresso de Contas a Receber/Pagar.
export function gerarHtmlAgrupadoPorPessoa({
  empresa,
  titulo,
  subtitulo,
  colunas,
  grupos,
  montarLinha,
  montarSubtotal,
  montarTotalGeral,
}) {
  const totalRegistros = grupos.reduce((s, g) => s + g.itens.length, 0)
  const corpo = grupos
    .map(
      (g) => `
    <tr class="grupo-cabecalho"><td colspan="${colunas.length}">${g.codigo ? `${g.codigo} — ` : ''}${g.nome}</td></tr>
    ${g.itens.map(montarLinha).join('')}
    <tr class="grupo-subtotal">${montarSubtotal(g)}</tr>
  `,
    )
    .join('')

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>${estiloBasePdf()}</style></head>
<body>
${cabecalhoPdf(empresa, titulo, subtitulo, totalRegistros)}
<table>
  <thead><tr>${colunas.map((c) => `<th${c.num ? ' class="num"' : ''}>${c.label}</th>`).join('')}</tr></thead>
  <tbody>
    ${corpo}
    <tr class="total-geral">${montarTotalGeral()}</tr>
  </tbody>
</table>
</body></html>`
}

// Relatório simples (sem agrupamento), em ordem alfabética/cronológica conforme
// o chamador já tiver ordenado — usado por Produtos, Financeiro, Caixa etc.
export function gerarHtmlListaSimples({ empresa, titulo, subtitulo, colunas, linhas, montarLinha, montarTotalGeral }) {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>${estiloBasePdf()}</style></head>
<body>
${cabecalhoPdf(empresa, titulo, subtitulo, linhas.length)}
<table>
  <thead><tr>${colunas.map((c) => `<th${c.num ? ' class="num"' : ''}>${c.label}</th>`).join('')}</tr></thead>
  <tbody>
    ${linhas.map(montarLinha).join('')}
    ${montarTotalGeral ? `<tr class="total-geral">${montarTotalGeral()}</tr>` : ''}
  </tbody>
</table>
</body></html>`
}

// Relatório em seções independentes (cada uma com seu próprio título, colunas
// e total) — usado quando o mesmo documento precisa mostrar, por exemplo, o
// que acabou de ser pago separado do que ainda está em aberto.
export function gerarHtmlSecoes({ empresa, titulo, subtitulo, secoes }) {
  const totalRegistros = secoes.reduce((s, sec) => s + sec.linhas.length, 0)
  const corpo = secoes
    .map(
      (sec) => `
    <div style="margin-top:16px;margin-bottom:4px;font-size:12px;font-weight:700;color:#185FA5;border-bottom:1px solid #B7CDE5;padding-bottom:3px">
      ${sec.titulo} (${sec.linhas.length})
    </div>
    ${
      sec.linhas.length === 0
        ? `<div style="font-size:11px;color:#888;padding:6px 0 10px">Nenhum registro.</div>`
        : `<table>
      <thead><tr>${sec.colunas.map((c) => `<th${c.num ? ' class="num"' : ''}>${c.label}</th>`).join('')}</tr></thead>
      <tbody>
        ${sec.linhas.map(sec.montarLinha).join('')}
        ${sec.montarTotal ? `<tr class="total-geral">${sec.montarTotal()}</tr>` : ''}
      </tbody>
    </table>`
    }
  `,
    )
    .join('')

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>${estiloBasePdf()}</style></head>
<body>
${cabecalhoPdf(empresa, titulo, subtitulo, totalRegistros)}
${corpo}
</body></html>`
}

export { fmtDataBR, fmtMoedaBR, fmtNumCSV }
