import { useState, useEffect } from 'react'
import { Lock, User, Eye, EyeOff, AlertCircle } from 'lucide-react'

const SVGCalha = ({ style }) => (
  <svg viewBox='0 0 200 60' style={style} fill='none'>
    <path
      d='M0 45 Q50 10 100 30 Q150 50 200 20'
      stroke='currentColor'
      strokeWidth='8'
      strokeLinecap='round'
      fill='none'
    />
    <path
      d='M0 55 L200 55'
      stroke='currentColor'
      strokeWidth='3'
      strokeLinecap='round'
    />
    <path
      d='M10 45 L10 55 M50 32 L50 55 M100 30 L100 55 M150 42 L150 55 M190 25 L190 55'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      opacity='0.5'
    />
  </svg>
)
const SVGRufo = ({ style }) => (
  <svg viewBox='0 0 160 80' style={style} fill='none'>
    <path
      d='M0 60 L80 10 L160 60'
      stroke='currentColor'
      strokeWidth='7'
      strokeLinecap='round'
      strokeLinejoin='round'
      fill='none'
    />
    <path d='M0 60 L160 60' stroke='currentColor' strokeWidth='3' />
    <path
      d='M0 65 L160 65'
      stroke='currentColor'
      strokeWidth='2'
      opacity='0.4'
    />
    <path
      d='M30 60 L30 70 M80 10 L80 70 M130 60 L130 70'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      opacity='0.5'
    />
  </svg>
)
const SVGChapa = ({ style }) => (
  <svg viewBox='0 0 180 100' style={style} fill='none'>
    <rect
      x='5'
      y='5'
      width='170'
      height='90'
      rx='4'
      stroke='currentColor'
      strokeWidth='5'
      fill='none'
    />
    {[20, 40, 60, 80, 100, 120, 140, 160].map((x) => (
      <line
        key={x}
        x1={x}
        y1='5'
        x2={x}
        y2='95'
        stroke='currentColor'
        strokeWidth='1.5'
        opacity='0.3'
      />
    ))}
    {[20, 40, 60, 80].map((y) => (
      <line
        key={y}
        x1='5'
        y1={y}
        x2='175'
        y2={y}
        stroke='currentColor'
        strokeWidth='1.5'
        opacity='0.2'
      />
    ))}
  </svg>
)

export default function Login({ onLogin }) {
  const [fase, setFase] = useState('splash')
  const [usuario, setUsuario] = useState('')
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [splashSaindo, setSplashSaindo] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setSplashSaindo(true), 2200)
    const t2 = setTimeout(() => setFase('login'), 2700)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [])

  async function handleLogin(e) {
    e.preventDefault()
    setErro('')
    setCarregando(true)
    try {
      const result = await window.api.auth.login({
        usuario: usuario.toLowerCase(),
        senha,
      })
      if (result.sucesso) {
        onLogin(result.usuario)
      } else {
        setErro(result.erro || 'Usuário ou senha incorretos.')
      }
    } catch (err) {
      setErro('Erro ao conectar com o banco de dados.')
      console.error(err)
    } finally {
      setCarregando(false)
    }
  }

  if (fase === 'splash')
    return (
      <div
        style={{
          height: '100vh',
          width: '100vw',
          background:
            'linear-gradient(135deg,#0C3F7A 0%,#185FA5 50%,#1a56a0 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          opacity: splashSaindo ? 0 : 1,
          transition: 'opacity 0.5s ease',
          overflow: 'hidden',
        }}
      >
        <style>{`
          @keyframes splashEntrada{from{opacity:0;transform:scale(0.8) translateY(20px)}to{opacity:1;transform:scale(1) translateY(0)}}
          @keyframes float{0%,100%{transform:translateY(0px) rotate(var(--r,0deg))}50%{transform:translateY(-10px) rotate(var(--r,0deg))}}
          @keyframes barraCarregar{from{width:0%}to{width:100%}}
          @keyframes pulsar{0%,100%{opacity:1}50%{opacity:0.5}}
        `}</style>
        <SVGCalha
          style={{
            position: 'absolute',
            right: -20,
            top: 40,
            width: 320,
            height: 100,
            color: 'rgba(255,255,255,0.06)',
            animation: 'float 6s ease-in-out infinite',
            '--r': '-5deg',
          }}
        />
        <SVGRufo
          style={{
            position: 'absolute',
            left: '10%',
            bottom: 60,
            width: 240,
            height: 120,
            color: 'rgba(255,255,255,0.05)',
            animation: 'float 8s ease-in-out infinite 1s',
            '--r': '3deg',
          }}
        />
        <SVGChapa
          style={{
            position: 'absolute',
            right: '20%',
            bottom: 40,
            width: 200,
            height: 110,
            color: 'rgba(255,255,255,0.04)',
            animation: 'float 7s ease-in-out infinite 0.5s',
          }}
        />
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 24,
            animation: 'splashEntrada 0.8s cubic-bezier(0.34,1.56,0.64,1) both',
            position: 'relative',
            zIndex: 2,
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 6,
              width: 64,
              height: 64,
            }}
          >
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  background:
                    i % 2 === 0
                      ? 'rgba(255,255,255,0.95)'
                      : 'rgba(255,255,255,0.4)',
                  borderRadius: 10,
                  animation: `splashEntrada 0.6s ease ${0.1 + i * 0.08}s both`,
                }}
              />
            ))}
          </div>
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                fontSize: 36,
                fontWeight: 800,
                color: 'var(--surface)',
                letterSpacing: '-1px',
                lineHeight: 1,
              }}
            >
              Gollino M.E
            </div>
            <div
              style={{
                fontSize: 14,
                color: 'rgba(255,255,255,0.6)',
                marginTop: 8,
                letterSpacing: '0.1em',
              }}
            >
              SISTEMA DE GESTÃO
            </div>
          </div>
          <div
            style={{
              width: 200,
              height: 3,
              background: 'rgba(255,255,255,0.15)',
              borderRadius: 99,
              overflow: 'hidden',
              marginTop: 8,
            }}
          >
            <div
              style={{
                height: '100%',
                background: 'var(--surface)',
                borderRadius: 99,
                animation: 'barraCarregar 2s ease forwards',
              }}
            />
          </div>
          <div
            style={{
              fontSize: 12,
              color: 'rgba(255,255,255,0.4)',
              animation: 'pulsar 1.5s ease infinite',
              letterSpacing: '0.05em',
            }}
          >
            Carregando...
          </div>
        </div>
      </div>
    )

  return (
    <div
      style={{
        height: '100vh',
        width: '100vw',
        background:
          'linear-gradient(135deg,#0C3F7A 0%,#185FA5 60%,#1a6ac0 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        overflow: 'hidden',
      }}
    >
      <style>{`
        @keyframes loginEntrada{from{opacity:0;transform:translateY(24px) scale(0.97)}to{opacity:1;transform:translateY(0) scale(1)}}
        @keyframes float{0%,100%{transform:translateY(0px) rotate(var(--r,0deg))}50%{transform:translateY(-10px) rotate(var(--r,0deg))}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .input-login:focus{border-color:#378ADD !important;box-shadow:0 0 0 3px rgba(55,138,221,0.15) !important}
        .btn-login{transition:all 0.2s}
        .btn-login:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 8px 24px rgba(12,63,122,0.4) !important}
      `}</style>
      <SVGCalha
        style={{
          position: 'absolute',
          right: -20,
          top: 40,
          width: 320,
          height: 100,
          color: 'rgba(255,255,255,0.06)',
          animation: 'float 6s ease-in-out infinite',
          '--r': '-5deg',
        }}
      />
      <SVGRufo
        style={{
          position: 'absolute',
          left: '5%',
          bottom: 60,
          width: 240,
          height: 120,
          color: 'rgba(255,255,255,0.05)',
          animation: 'float 8s ease-in-out infinite 1s',
          '--r': '3deg',
        }}
      />
      <SVGChapa
        style={{
          position: 'absolute',
          right: '15%',
          bottom: 30,
          width: 200,
          height: 110,
          color: 'rgba(255,255,255,0.04)',
          animation: 'float 7s ease-in-out infinite 0.5s',
        }}
      />

      <div
        style={{
          width: 400,
          animation: 'loginEntrada 0.5s cubic-bezier(0.34,1.56,0.64,1) both',
          position: 'relative',
          zIndex: 2,
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              marginBottom: 16,
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 5,
                width: 48,
                height: 48,
              }}
            >
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{
                    background:
                      i % 2 === 0
                        ? 'rgba(255,255,255,0.95)'
                        : 'rgba(255,255,255,0.4)',
                    borderRadius: 8,
                  }}
                />
              ))}
            </div>
          </div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: 'var(--surface)',
              letterSpacing: '-0.5px',
            }}
          >
            Gollino M.E
          </div>
          <div
            style={{
              fontSize: 13,
              color: 'rgba(255,255,255,0.55)',
              marginTop: 6,
              letterSpacing: '0.08em',
            }}
          >
            SISTEMA DE GESTÃO
          </div>
        </div>

        <div
          style={{
            background: 'var(--surface)',
            borderRadius: 20,
            padding: '32px 32px 28px',
            boxShadow: '0 24px 60px rgba(12,63,122,0.25)',
          }}
        >
          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginBottom: 4,
            }}
          >
            Entrar no sistema
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>
            Insira suas credenciais para continuar
          </div>

          {erro && (
            <div
              style={{
                background: 'var(--red-50)',
                border: '1px solid var(--red-100)',
                borderRadius: 10,
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 16,
              }}
            >
              <AlertCircle
                size={15}
                style={{ color: 'var(--red-500)', flexShrink: 0 }}
              />
              <span style={{ fontSize: 13, color: 'var(--red-500)' }}>{erro}</span>
            </div>
          )}

          <form
            onSubmit={handleLogin}
            style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
          >
            <div>
              <label
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  display: 'block',
                  marginBottom: 6,
                }}
              >
                Usuário
              </label>
              <div style={{ position: 'relative' }}>
                <User
                  size={15}
                  style={{
                    position: 'absolute',
                    left: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                  }}
                />
                <input
                  className='input-login'
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  placeholder='Digite seu usuário'
                  autoFocus
                  style={{
                    width: '100%',
                    height: 44,
                    paddingLeft: 38,
                    paddingRight: 14,
                    borderRadius: 10,
                    border: '1.5px solid var(--gray-200)',
                    fontSize: 14,
                    outline: 'none',
                    transition: 'all 0.15s',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>
            <div>
              <label
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  display: 'block',
                  marginBottom: 6,
                }}
              >
                Senha
              </label>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={15}
                  style={{
                    position: 'absolute',
                    left: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                  }}
                />
                <input
                  className='input-login'
                  type={mostrarSenha ? 'text' : 'password'}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder='Digite sua senha'
                  style={{
                    width: '100%',
                    height: 44,
                    paddingLeft: 38,
                    paddingRight: 44,
                    borderRadius: 10,
                    border: '1.5px solid var(--gray-200)',
                    fontSize: 14,
                    outline: 'none',
                    transition: 'all 0.15s',
                    boxSizing: 'border-box',
                  }}
                />
                <button
                  type='button'
                  onClick={() => setMostrarSenha((p) => !p)}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                  }}
                >
                  {mostrarSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button
              type='submit'
              className='btn-login'
              disabled={!usuario || !senha || carregando}
              style={{
                height: 46,
                background:
                  !usuario || !senha || carregando
                    ? 'var(--gray-200)'
                    : 'linear-gradient(135deg,#0C3F7A,#185FA5)',
                color: !usuario || !senha || carregando ? 'var(--text-muted)' : 'var(--surface)',
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 700,
                border: 'none',
                cursor:
                  !usuario || !senha || carregando ? 'not-allowed' : 'pointer',
                marginTop: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              {carregando ? (
                <>
                  <div
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTopColor: 'var(--surface)',
                      animation: 'spin 0.7s linear infinite',
                    }}
                  />
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </button>
          </form>

        </div>
        <div
          style={{
            textAlign: 'center',
            marginTop: 20,
            fontSize: 12,
            color: 'rgba(255,255,255,0.35)',
          }}
        >
          Gollino M.E © {new Date().getFullYear()} · Sistema de Gestão
        </div>
      </div>
    </div>
  )
}
