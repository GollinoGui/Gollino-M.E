import { Clock, X } from 'lucide-react'
import { BotoesRelatorio } from './BotoesRelatorio'
import { TIPO_LABEL, ICONE_POR_TIPO } from '../utils/caixaHistorico'
import {
  exportarCSV,
  buscarEmpresa,
  gerarHtmlListaSimples,
  gerarPdfRelatorio,
  fmtMoedaBR,
} from '../utils/relatorios'

const fmt = (v) =>
  (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const fmtData = (d) => (d ? d.split('-').reverse().join('/') : '')

// Relatório detalhado exibido automaticamente assim que um caixa é fechado —
// seja pelo fluxo normal (Caixa.jsx) ou pelo fechamento de um caixa atrasado
// (AvisoCaixaAtrasado.jsx). `resumo` é o resultado já mesclado (dados de
// abertura vindos do resumo pré-fechamento + números definitivos vindos da
// RPC caixa_fechar); `historico` é a timeline itemizada da sessão (vendas,
// sangria/reforço, despesas/vales/receitas, recebimentos e baixas por
// prejuízo) capturada antes do fechamento zerar o estado.
export default function ModalRelatorioCaixa({ resumo, historico, onFechar }) {
  const nomeArquivo = `fechamento_caixa_${resumo?.dataFechamento || new Date().toISOString().slice(0, 10)}`

  function exportarExcel() {
    const linhas = historico.map((h) => ({
      Hora: h.hora,
      Tipo: TIPO_LABEL[h.tipo] || h.tipo,
      Descrição: h.descricao,
      'Valor (R$)': (h.valor || 0).toFixed(2).replace('.', ','),
    }))
    linhas.push({
      Hora: '', Tipo: '', Descrição: 'TOTAL DE VENDAS DA SESSÃO',
      'Valor (R$)': (resumo?.valorTotal || 0).toFixed(2).replace('.', ','),
    })
    if (resumo?.totalPrejuizo > 0) {
      linhas.push({
        Hora: '', Tipo: '', Descrição: 'TOTAL BAIXADO POR PREJUÍZO',
        'Valor (R$)': resumo.totalPrejuizo.toFixed(2).replace('.', ','),
      })
    }
    exportarCSV(linhas, nomeArquivo)
  }

  async function gerarPDF() {
    const empresa = await buscarEmpresa()
    const colunas = [
      { label: 'Hora' },
      { label: 'Tipo' },
      { label: 'Descrição' },
      { label: 'Valor', num: true },
    ]
    const html = gerarHtmlListaSimples({
      empresa,
      titulo: 'Fechamento de Caixa',
      subtitulo: `${fmtData(resumo?.dataAbertura)} ${resumo?.horaAbertura || ''} até ${fmtData(resumo?.dataFechamento)} ${resumo?.horaFechamento || ''} · ${resumo?.qtdeVendas || 0} venda(s)`,
      colunas,
      linhas: historico,
      montarLinha: (h) =>
        `<tr><td>${h.hora}</td><td>${TIPO_LABEL[h.tipo] || h.tipo}</td><td>${h.descricao}</td><td class="num">${h.valor > 0 ? fmtMoedaBR(h.valor) : ''}</td></tr>`,
      montarTotalGeral: () =>
        `<td colspan="3">TOTAL DE VENDAS DA SESSÃO</td><td class="num">${fmtMoedaBR(resumo?.valorTotal)}</td>`,
    })
    await gerarPdfRelatorio(html, nomeArquivo)
  }

  const cardsFormaPagamento = [
    { label: 'Dinheiro', value: resumo?.dinheiro, color: '#22863A' },
    { label: 'Cartão Créd.', value: resumo?.cartaoCredito, color: '#185FA5' },
    { label: 'Cartão Déb.', value: resumo?.cartaoDebito, color: '#B7791F' },
    { label: 'Cheque', value: resumo?.cheque, color: 'var(--text-muted)' },
    { label: 'PIX', value: resumo?.pix, color: '#0D9488' },
    { label: 'Convênio', value: resumo?.convenio, color: '#7C3AED' },
  ].filter((c) => c.value > 0)

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2500,
      }}
    >
      <div
        style={{
          background: 'var(--surface)',
          borderRadius: 16,
          border: '1px solid var(--border-md)',
          width: 640,
          maxHeight: '86vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 60px rgba(0,0,0,0.25)',
          overflow: 'hidden',
        }}
      >
        {/* Cabeçalho */}
        <div style={{ background: '#185FA5', padding: '18px 24px', flexShrink: 0 }}>
          <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, marginBottom: 2 }}>
            CAIXA FECHADO
          </div>
          <div style={{ color: '#fff', fontSize: 20, fontWeight: 700 }}>
            {fmtData(resumo?.dataAbertura)} {resumo?.horaAbertura} — {fmtData(resumo?.dataFechamento)} {resumo?.horaFechamento}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 4 }}>
            Aberto por {resumo?.usuarioAbertura || '—'} · Fechado por {resumo?.usuarioFechamento || '—'}
          </div>
        </div>

        <div style={{ padding: '18px 24px', overflowY: 'auto', flex: 1 }}>
          {/* Totais */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 14 }}>
            {[
              { label: 'Total vendas', value: fmt(resumo?.valorTotal), color: '#22863A' },
              { label: 'Dinheiro esperado', value: fmt(resumo?.dinheiroEsperado), color: '#185FA5' },
              { label: 'Qtde vendas', value: resumo?.qtdeVendas || 0, color: 'var(--text-primary)' },
            ].map((c) => (
              <div key={c.label} style={{ background: 'var(--gray-50)', border: '1px solid var(--border-md)', borderRadius: 10, padding: '10px 14px' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>{c.label}</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: c.color }}>{c.value}</div>
              </div>
            ))}
          </div>

          {resumo?.totalPrejuizo > 0 && (
            <div
              style={{
                background: '#FEF2F2',
                border: '1px solid #FCA5A5',
                borderRadius: 10,
                padding: '10px 14px',
                marginBottom: 14,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: 13, color: '#991B1B', fontWeight: 500 }}>
                ⚠ Baixado por prejuízo nesta sessão ({resumo.qtdePrejuizo} conta{resumo.qtdePrejuizo !== 1 ? 's' : ''})
              </span>
              <span style={{ fontSize: 16, fontWeight: 700, color: '#991B1B' }}>{fmt(resumo.totalPrejuizo)}</span>
            </div>
          )}

          {cardsFormaPagamento.length > 0 && (
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
              {cardsFormaPagamento.map((f) => (
                <div key={f.label} style={{ background: 'var(--gray-50)', border: '1px solid var(--border-md)', borderRadius: 8, padding: '8px 14px' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>{f.label}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: f.color }}>{fmt(f.value)}</div>
                </div>
              ))}
            </div>
          )}

          {/* Timeline detalhada */}
          <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', letterSpacing: '0.03em', marginBottom: 10 }}>
            MOVIMENTAÇÃO DA SESSÃO
          </div>
          {historico.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 24, fontSize: 13 }}>
              Nenhuma movimentação nesta sessão.
            </div>
          ) : (
            historico.map((h, i) => {
              const cfgIcone = ICONE_POR_TIPO[h.tipo] || { icon: X, bg: '#F0F4FA', color: 'var(--text-muted)' }
              const IconeTipo = cfgIcone.icon
              return (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '9px 12px',
                    borderRadius: 10,
                    border: '1px solid var(--border-md)',
                    marginBottom: 6,
                  }}
                >
                  <div style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, background: cfgIcone.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <IconeTipo size={13} style={{ color: cfgIcone.color }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 48 }}>
                    <Clock size={10} style={{ color: 'var(--text-muted)' }} />
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{h.hora}</span>
                  </div>
                  <div style={{ flex: 1, fontSize: 13, fontWeight: h.tipo !== 'venda' ? 500 : 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {h.descricao}
                  </div>
                  {h.valor > 0 && (
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#185FA5', flexShrink: 0 }}>{fmt(h.valor)}</div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Rodapé */}
        <div style={{ padding: '12px 24px', borderTop: '1px solid var(--border-md)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <BotoesRelatorio onExportarExcel={exportarExcel} onGerarPDF={gerarPDF} abrirParaCima />
          <div style={{ flex: 1 }} />
          <button
            onClick={onFechar}
            autoFocus
            style={{
              height: 38,
              padding: '0 24px',
              background: '#185FA5',
              color: '#fff',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
