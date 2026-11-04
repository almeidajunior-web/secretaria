import { categoryBreakdown } from './financeMetrics'
import { vencimentoDaCompra } from './creditCard'
import { RECURRENCE_OPTIONS } from './billRecurrence'

// Builds the Finanças .xlsx: one sheet with the lançamentos exactly as the
// table shows them (same month, filters, search and sort), and one with the
// totals for that same set — computed from those rows, so the two sheets
// always reconcile. Pure: it only shapes data for write-excel-file; the
// library itself is loaded on demand by downloadFinanceXlsx below.

const MONEY = '"R$" #,##0.00;[Red]-"R$" #,##0.00'
const DATE = 'dd/mm/yyyy'
const PERCENT = '0.0%'

const RECURRENCE_LABEL = Object.fromEntries(RECURRENCE_OPTIONS.map((r) => [r.value, r.label]))

const bold = (value) => ({ value, fontWeight: 'bold' })

// write-excel-file turns a Date into a spreadsheet serial straight from
// getTime(), i.e. in UTC. A local-midnight Date would land on the previous
// day anywhere east of Greenwich, so the day is built in UTC to begin with.
function excelDate(dateStr) {
  if (!dateStr) return null
  const [y, m, d] = dateStr.split('-').map(Number)
  return { value: new Date(Date.UTC(y, m - 1, d)), type: Date, format: DATE }
}

function money(value) {
  return { value, type: Number, format: MONEY }
}

export function buildFinanceSheets({
  entries,
  periodLabel,
  filtersLabel,
  categoryLabelById,
  paymentMethodLabelById,
  accountLabelById,
  showAccounts,
  creditCardConfig,
}) {
  const header = [
    'Data',
    'Tipo',
    'Título',
    'Descrição',
    'Categoria',
    'Pagamento',
    ...(showAccounts ? ['Conta'] : []),
    'Essencial',
    'Recorrência',
    'Parcela',
    'Fatura',
    'Valor',
  ].map(bold)

  const rows = entries.map((e) => {
    const isIncome = e.type === 'income'
    const invoice =
      e.paymentMethodId === 'credito' && e.date && creditCardConfig?.closingDay && creditCardConfig?.dueDay
        ? vencimentoDaCompra(e.date, creditCardConfig.closingDay, creditCardConfig.dueDay)
        : null
    return [
      excelDate(e.date),
      isIncome ? 'Receita' : 'Despesa',
      e.title || '',
      e.description || '',
      categoryLabelById[e.categoryId] || '',
      paymentMethodLabelById[e.paymentMethodId] || '',
      ...(showAccounts ? [accountLabelById[e.accountId] || ''] : []),
      isIncome ? '' : e.essential ? 'Sim' : 'Não',
      e.recurrence && e.recurrence !== 'none' ? RECURRENCE_LABEL[e.recurrence] || '' : '',
      e.installment ? `${e.installment.current}/${e.installment.total}` : '',
      excelDate(invoice),
      // Signed, so a plain SUM over the column is the saldo — despesas show
      // in red through the number format, without a second "tipo" lookup.
      money(isIncome ? e.amount || 0 : -(e.amount || 0)),
    ]
  })

  const lancamentos = {
    sheet: 'Lançamentos',
    data: [header, ...rows],
    stickyRowsCount: 1,
    columns: [
      { width: 12 },
      { width: 10 },
      { width: 30 },
      { width: 36 },
      { width: 18 },
      { width: 16 },
      ...(showAccounts ? [{ width: 16 }] : []),
      { width: 10 },
      { width: 13 },
      { width: 9 },
      { width: 12 },
      { width: 16 },
    ],
  }

  const income = entries.filter((e) => e.type === 'income').reduce((s, e) => s + (e.amount || 0), 0)
  const expense = entries.filter((e) => e.type === 'expense').reduce((s, e) => s + (e.amount || 0), 0)

  const breakdownRows = (type, title, typeTotal) => {
    const list = categoryBreakdown(entries, type, categoryLabelById, {})
    // Entries with no category still count toward the total — listed as their
    // own line so the column adds up to the figure above it.
    const uncategorized = entries
      .filter((e) => e.type === type && !e.categoryId)
      .reduce((s, e) => s + (e.amount || 0), 0)
    if (uncategorized) list.push({ label: 'Sem categoria', total: uncategorized })
    if (!list.length) return []
    return [
      [],
      [bold(title), bold('Total'), bold('%')],
      ...list.map((c) => [
        c.label,
        money(c.total),
        { value: typeTotal ? c.total / typeTotal : 0, type: Number, format: PERCENT },
      ]),
    ]
  }

  const resumo = {
    sheet: 'Resumo',
    columns: [{ width: 26 }, { width: 18 }, { width: 10 }],
    data: [
      [bold('Período'), periodLabel],
      [bold('Filtros aplicados'), filtersLabel || 'Nenhum'],
      [bold('Lançamentos'), { value: entries.length, type: Number }],
      [],
      ['Receitas', money(income)],
      ['Despesas', money(expense)],
      [bold('Saldo'), { ...money(income - expense), fontWeight: 'bold' }],
      ...breakdownRows('expense', 'Despesas por categoria', expense),
      ...breakdownRows('income', 'Receitas por categoria', income),
    ],
  }

  return [lancamentos, resumo]
}

// Loaded only when someone actually exports — keeps the spreadsheet writer out
// of the bundle every other visit pays for.
export async function downloadFinanceXlsx(sheets, fileName) {
  const { default: writeExcelFile } = await import('write-excel-file/browser')
  await writeExcelFile(sheets).toFile(fileName)
}
