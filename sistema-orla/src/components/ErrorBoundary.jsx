import { Component } from 'react'

// Sem isto, qualquer exceção durante o render derruba a árvore React inteira
// e a tela fica em branco, sem nenhuma mensagem ou log visível ao usuário.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { erro: null }
  }

  static getDerivedStateFromError(erro) {
    return { erro }
  }

  componentDidCatch(erro, info) {
    console.error('Erro não tratado na interface:', erro, info?.componentStack)
  }

  render() {
    if (this.state.erro) {
      return (
        <div
          style={{
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            fontFamily: 'sans-serif',
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 600, color: '#dc2626' }}>
            Ocorreu um erro ao exibir esta tela
          </div>
          <div style={{ fontSize: 13, color: '#6b7280' }}>
            {String(this.state.erro?.message || this.state.erro)}
          </div>
          <button
            onClick={() => this.setState({ erro: null })}
            style={{
              alignSelf: 'flex-start',
              padding: '8px 14px',
              border: '1px solid #d1d5db',
              borderRadius: 6,
              cursor: 'pointer',
              background: '#fff',
            }}
          >
            Tentar novamente
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
