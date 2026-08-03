import { useMemo, useState } from 'react'

// Hook genérico de ordenação por coluna: primeiro clique ordena crescente,
// clicar de novo na mesma coluna inverte para decrescente.
// `acessores` permite ordenar por colunas calculadas (ex: "em aberto" = valor - pago)
// que não existem como campo direto no objeto.
export function useOrdenacao(dados, { colunaInicial = null, direcaoInicial = 'asc', acessores = {} } = {}) {
  const [coluna, setColuna] = useState(colunaInicial)
  const [direcao, setDirecao] = useState(direcaoInicial)

  function alternar(chave) {
    if (coluna === chave) {
      setDirecao((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setColuna(chave)
      setDirecao('asc')
    }
  }

  const ordenados = useMemo(() => {
    if (!coluna) return dados
    const valorDe = (item) => (acessores[coluna] ? acessores[coluna](item) : item[coluna])
    const copia = [...dados]
    copia.sort((a, b) => {
      let va = valorDe(a)
      let vb = valorDe(b)
      if (va == null) va = ''
      if (vb == null) vb = ''
      const cmp =
        typeof va === 'string' || typeof vb === 'string'
          ? String(va).localeCompare(String(vb), 'pt-BR', { numeric: true, sensitivity: 'base' })
          : va - vb
      return direcao === 'asc' ? cmp : -cmp
    })
    return copia
  }, [dados, coluna, direcao, acessores])

  return { ordenados, coluna, direcao, alternar }
}
