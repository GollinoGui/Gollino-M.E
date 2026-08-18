// Data local (YYYY-MM-DD) de um Date qualquer. NÃO usar `Date#toISOString()`
// para isso: toISOString() converte pra UTC, e como o Brasil é UTC-3 isso já
// mostra o dia seguinte a partir das ~21h no horário local — causa "vendas de
// hoje" vazias, contas de hoje/amanhã marcadas como vencidas, e datas erradas
// gravadas em vendas/pagamentos feitos à noite.
export function localDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function hojeLocal() {
  return localDateStr(new Date())
}
