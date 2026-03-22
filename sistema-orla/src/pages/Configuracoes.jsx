import { useState, useEffect } from 'react'
import { Building2, Save, Upload } from 'lucide-react'

const dadosIniciais = {
  razao_social: 'Elter Gollino',
  nome_fantasia: 'Gollino M.E',
  cnpj: '01.748.720/0001-00',
  ie: '',
  telefone: '',
  celular: '',
  email: '',
  site: '',
  cep: '',
  endereco: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  uf: 'SP',
  regime_tributario: 'simples',
  cnae: '',
  crt: '1',
  data_abertura: '04/03/1997',
  porte: 'ME',
  natureza_juridica: 'Empresário Individual (213-5)',
}

const secoes = [
  {
    titulo: 'Dados da empresa',
    campos: [
      { key: 'razao_social', label: 'Razão social *', col: 2 },
      { key: 'nome_fantasia', label: 'Nome fantasia', col: 2 },
      { key: 'cnpj', label: 'CNPJ *', col: 1 },
      { key: 'ie', label: 'Inscrição estadual', col: 1 },
    ],
  },
  {
    titulo: 'Contato',
    campos: [
      { key: 'telefone', label: 'Telefone', col: 1 },
      { key: 'celular', label: 'Celular', col: 1 },
      { key: 'email', label: 'E-mail', col: 1 },
      { key: 'site', label: 'Site', col: 1 },
    ],
  },
  {
    titulo: 'Endereço',
    campos: [
      { key: 'cep', label: 'CEP', col: 1 },
      { key: 'endereco', label: 'Logradouro', col: 1 },
      { key: 'numero', label: 'Número', col: 1 },
      { key: 'complemento', label: 'Complemento', col: 1 },
      { key: 'bairro', label: 'Bairro', col: 1 },
      { key: 'cidade', label: 'Cidade', col: 1 },
      { key: 'uf', label: 'UF', col: 1 },
    ],
  },
  {
    titulo: 'Dados fiscais',
    campos: [
      { key: 'cnae', label: 'CNAE', col: 1 },
      { key: 'crt', label: 'CRT', col: 1 },
    ],
  },
]

export default function Configuracoes() {
  const [form, setForm] = useState(dadosIniciais)
  const [logo, setLogo] = useState('')
  const [salvo, setSalvo] = useState(false)
  const [abaAtiva, setAbaAtiva] = useState('empresa')
  const [backupMsg, setBackupMsg] = useState('')
  const [backupLoading, setBackupLoading] = useState(false)

  async function fazerBackup() {
    setBackupLoading(true)
    setBackupMsg('')
    try {
      const res = await window.api.backup.exportar()
      if (res?.sucesso) setBackupMsg(`Backup salvo em: ${res.caminho}`)
      else setBackupMsg('')
    } catch {
      setBackupMsg('Erro ao realizar backup.')
    } finally {
      setBackupLoading(false)
    }
  }

  const f = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }))

  useEffect(() => {
    async function carregar() {
      try {
        const empresa = await window.api.config.get('empresa')
        if (empresa) setForm((p) => ({ ...p, ...empresa }))
        const logoSalvo = await window.api.config.get('logo')
        if (logoSalvo) setLogo(logoSalvo)
      } catch (_) {}
    }
    carregar()
  }, [])

  async function salvar() {
    try {
      await window.api.config.set({ chave: 'empresa', valor: form })
      if (logo) await window.api.config.set({ chave: 'logo', valor: logo })
      setSalvo(true)
      setTimeout(() => setSalvo(false), 2500)
    } catch (_) {
      setSalvo(true)
      setTimeout(() => setSalvo(false), 2500)
    }
  }

  function handleLogo(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      if (ev.target?.result) {
        setLogo(ev.target.result)
      }
    }
    reader.readAsDataURL(file)
  }

  const abas = [
    { id: 'empresa', label: 'Dados da empresa' },
    { id: 'sistema', label: 'Sistema' },
    { id: 'backup', label: 'Backup' },
  ]

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg)',
      }}
    >
      {salvo && (
        <div
          style={{
            position: 'fixed',
            top: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--green-500)',
            color: 'var(--surface)',
            padding: '10px 24px',
            borderRadius: 'var(--radius-lg)',
            fontSize: 13,
            fontWeight: 500,
            zIndex: 999,
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          }}
        >
          Configurações salvas com sucesso!
        </div>
      )}

      <div
        style={{
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          padding: '0 24px',
          display: 'flex',
          gap: 4,
        }}
      >
        {abas.map((aba) => (
          <button
            key={aba.id}
            onClick={() => setAbaAtiva(aba.id)}
            style={{
              padding: '13px 18px',
              fontSize: 13,
              fontWeight: abaAtiva === aba.id ? 500 : 400,
              color:
                abaAtiva === aba.id
                  ? 'var(--blue-700)'
                  : 'var(--text-secondary)',
              borderBottom:
                abaAtiva === aba.id
                  ? '2px solid var(--blue-700)'
                  : '2px solid transparent',
              marginBottom: -1,
              transition: 'all 0.12s',
            }}
          >
            {aba.label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        {abaAtiva === 'empresa' && (
          <div
            style={{
              maxWidth: 860,
              margin: '0 auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
            }}
          >
            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                padding: 24,
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: 'var(--text-secondary)',
                  marginBottom: 16,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <Building2 size={15} style={{ color: 'var(--blue-600)' }} />{' '}
                Logo da empresa
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <div
                  style={{
                    width: 100,
                    height: 100,
                    borderRadius: 'var(--radius-lg)',
                    border: '2px dashed var(--border-md)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'var(--gray-50)',
                    overflow: 'hidden',
                    flexShrink: 0,
                  }}
                >
                  {logo ? (
                    <img
                      src={logo}
                      alt='Logo'
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                      }}
                    />
                  ) : (
                    <Building2 size={32} style={{ color: 'var(--gray-300)' }} />
                  )}
                </div>
                <div>
                  <label
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '8px 16px',
                      background: 'var(--blue-700)',
                      color: 'var(--surface)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    <Upload size={14} /> Escolher imagem
                    <input
                      type='file'
                      accept='image/*'
                      onChange={handleLogo}
                      style={{ display: 'none' }}
                    />
                  </label>
                  <div
                    style={{
                      fontSize: 12,
                      color: 'var(--text-muted)',
                      marginTop: 8,
                    }}
                  >
                    PNG ou JPG. Aparecerá no cupom de saída e relatórios.
                  </div>
                </div>
              </div>
            </div>

            {secoes.map((secao) => (
              <div
                key={secao.titulo}
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 24,
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: 'var(--text-secondary)',
                    marginBottom: 16,
                  }}
                >
                  {secao.titulo.toUpperCase()}
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 14,
                  }}
                >
                  {secao.campos.map((campo) => (
                    <div
                      key={campo.key}
                      style={{
                        gridColumn: campo.col === 2 ? '1 / -1' : undefined,
                      }}
                    >
                      <label
                        style={{
                          fontSize: 11,
                          color: 'var(--text-secondary)',
                          display: 'block',
                          marginBottom: 4,
                        }}
                      >
                        {campo.label}
                      </label>
                      {campo.key === 'regime_tributario' ? (
                        <select
                          value={form[campo.key]}
                          onChange={f(campo.key)}
                          style={{
                            width: '100%',
                            height: 36,
                            padding: '0 10px',
                          }}
                        >
                          <option value='simples'>Simples Nacional</option>
                          <option value='presumido'>Lucro Presumido</option>
                          <option value='real'>Lucro Real</option>
                          <option value='mei'>MEI</option>
                        </select>
                      ) : campo.key === 'uf' ? (
                        <select
                          value={form[campo.key]}
                          onChange={f(campo.key)}
                          style={{
                            width: '100%',
                            height: 36,
                            padding: '0 10px',
                          }}
                        >
                          {[
                            'AC',
                            'AL',
                            'AP',
                            'AM',
                            'BA',
                            'CE',
                            'DF',
                            'ES',
                            'GO',
                            'MA',
                            'MT',
                            'MS',
                            'MG',
                            'PA',
                            'PB',
                            'PR',
                            'PE',
                            'PI',
                            'RJ',
                            'RN',
                            'RS',
                            'RO',
                            'RR',
                            'SC',
                            'SP',
                            'SE',
                            'TO',
                          ].map((uf) => (
                            <option key={uf}>{uf}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          value={form[campo.key] || ''}
                          onChange={f(campo.key)}
                          style={{
                            width: '100%',
                            height: 36,
                            padding: '0 10px',
                          }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {abaAtiva === 'sistema' && (
          <div
            style={{
              maxWidth: 860,
              margin: '0 auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
            }}
          >
            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                padding: 24,
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: 'var(--text-secondary)',
                  marginBottom: 16,
                }}
              >
                PREFERÊNCIAS
              </div>
              <div
                style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
              >
                {[
                  {
                    label: 'Imprimir cupom automaticamente ao finalizar venda',
                    key: 'auto_print',
                    value: true,
                  },
                  {
                    label: 'Perguntar forma de pagamento ao fechar caixa',
                    key: 'ask_payment',
                    value: false,
                  },
                  {
                    label: 'Mostrar estoque zerado em destaque na venda',
                    key: 'show_zero',
                    value: true,
                  },
                  {
                    label: 'Exigir vendedor em todas as vendas',
                    key: 'require_seller',
                    value: false,
                  },
                ].map((opt) => (
                  <label
                    key={opt.key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type='checkbox'
                      defaultChecked={opt.value}
                      style={{ width: 16, height: 16 }}
                    />
                    <span
                      style={{ fontSize: 13, color: 'var(--text-primary)' }}
                    >
                      {opt.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                padding: 24,
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: 'var(--text-secondary)',
                  marginBottom: 16,
                }}
              >
                IMPRESSÃO
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 14,
                }}
              >
                <div>
                  <label
                    style={{
                      fontSize: 11,
                      color: 'var(--text-secondary)',
                      display: 'block',
                      marginBottom: 4,
                    }}
                  >
                    Largura do cupom
                  </label>
                  <select
                    style={{ width: '100%', height: 36, padding: '0 10px' }}
                  >
                    <option>80mm (térmica padrão)</option>
                    <option>58mm (térmica pequena)</option>
                    <option>A4</option>
                  </select>
                </div>
                <div>
                  <label
                    style={{
                      fontSize: 11,
                      color: 'var(--text-secondary)',
                      display: 'block',
                      marginBottom: 4,
                    }}
                  >
                    Impressora padrão
                  </label>
                  <select
                    style={{ width: '100%', height: 36, padding: '0 10px' }}
                  >
                    <option>Impressora padrão do sistema</option>
                  </select>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label
                    style={{
                      fontSize: 11,
                      color: 'var(--text-secondary)',
                      display: 'block',
                      marginBottom: 4,
                    }}
                  >
                    Mensagem no rodapé do cupom
                  </label>
                  <input
                    defaultValue='Obrigado pela preferência! Volte sempre.'
                    style={{ width: '100%', height: 36, padding: '0 10px' }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {abaAtiva === 'backup' && (
          <div
            style={{
              maxWidth: 860,
              margin: '0 auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
            }}
          >
            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                padding: 24,
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: 'var(--text-secondary)',
                  marginBottom: 16,
                }}
              >
                BACKUP AUTOMÁTICO — GOOGLE DRIVE
              </div>
              <div
                style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
              >
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type='checkbox'
                    defaultChecked
                    style={{ width: 16, height: 16 }}
                  />
                  <span style={{ fontSize: 13 }}>
                    Ativar backup automático no Google Drive
                  </span>
                </label>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 14,
                  }}
                >
                  <div>
                    <label
                      style={{
                        fontSize: 11,
                        color: 'var(--text-secondary)',
                        display: 'block',
                        marginBottom: 4,
                      }}
                    >
                      Horário do backup
                    </label>
                    <input
                      type='time'
                      defaultValue='18:00'
                      style={{ width: '100%', height: 36, padding: '0 10px' }}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        fontSize: 11,
                        color: 'var(--text-secondary)',
                        display: 'block',
                        marginBottom: 4,
                      }}
                    >
                      Manter últimos N backups
                    </label>
                    <select
                      style={{ width: '100%', height: 36, padding: '0 10px' }}
                    >
                      <option>7 backups (1 semana)</option>
                      <option>14 backups (2 semanas)</option>
                      <option>30 backups (1 mês)</option>
                    </select>
                  </div>
                </div>
                <div
                  style={{
                    background: 'var(--blue-50)',
                    border: '1px solid var(--blue-100)',
                    borderRadius: 'var(--radius-md)',
                    padding: '14px 18px',
                  }}
                >
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: 'var(--blue-800)',
                      marginBottom: 4,
                    }}
                  >
                    Como funciona
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: 'var(--blue-600)',
                      lineHeight: 1.6,
                    }}
                  >
                    Todo dia no horário configurado, o sistema copia o banco de
                    dados automaticamente para uma pasta no Google Drive chamada{' '}
                    <strong>Backup Gollino</strong>. Para restaurar, basta
                    copiar o arquivo de volta.
                  </div>
                </div>
                <button
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 20px',
                    background: 'var(--blue-700)',
                    color: 'var(--surface)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 13,
                    fontWeight: 500,
                    alignSelf: 'flex-start',
                  }}
                >
                  Conectar com Google Drive
                </button>

                <div
                  style={{
                    borderTop: '1px solid var(--border)',
                    paddingTop: 16,
                  }}
                >
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: 'var(--text-secondary)',
                      marginBottom: 12,
                    }}
                  >
                    BACKUP MANUAL
                  </div>
                  {backupMsg && (
                    <div style={{ fontSize: 12, color: backupMsg.startsWith('Erro') ? '#C53030' : '#22543D', marginBottom: 8 }}>
                      {backupMsg}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      onClick={fazerBackup}
                      disabled={backupLoading}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '9px 18px',
                        border: '1px solid var(--border-md)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: 13,
                        color: 'var(--text-primary)',
                        cursor: backupLoading ? 'wait' : 'pointer',
                        opacity: backupLoading ? 0.6 : 1,
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = 'var(--gray-50)')
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = 'transparent')
                      }
                    >
                      {backupLoading ? 'Salvando...' : 'Fazer backup agora'}
                    </button>
                    <button
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '9px 18px',
                        border: '1px solid var(--border-md)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: 13,
                        color: 'var(--text-primary)',
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = 'var(--gray-50)')
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = 'transparent')
                      }
                    >
                      Restaurar backup
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div
        style={{
          background: 'var(--surface)',
          borderTop: '1px solid var(--border)',
          padding: '12px 24px',
          display: 'flex',
          justifyContent: 'flex-end',
        }}
      >
        <button
          onClick={salvar}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 24px',
            background: 'var(--blue-700)',
            color: 'var(--surface)',
            borderRadius: 'var(--radius-md)',
            fontSize: 14,
            fontWeight: 500,
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = 'var(--blue-800)')
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = 'var(--blue-700)')
          }
        >
          <Save size={16} /> Salvar configurações
        </button>
      </div>
    </div>
  )
}
