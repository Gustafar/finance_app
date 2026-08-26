import { useMemo, useState } from 'react'
import { createRecurringExpensesBulk } from '../api/recurringExpenses'
import { TRANSACTION_TYPES } from '../utils/transactionTypes'
import { parsePastedAmount, parseTsv, resolveIdByName, resolveType } from '../utils/bulkPaste'
import { normalizeAmountSeparators, maskAmountInput, formatAmountForDisplay } from '../utils/amountFormula'
import { clampDayOfMonth } from '../utils/date'
import SubcategorySelect from './SubcategorySelect'

// Fixed left-to-right order pasted spreadsheet columns are mapped to, starting from whichever
// cell was focused when the paste happened. Matches the column order used across all bulk
// expense grids (see ExpenseBulkForm's PASTE_COLUMNS).
const PASTE_COLUMNS = [
  'dayOfMonth',
  'amount',
  'paymentMethodId',
  'description',
  'subcategoryId',
  'type',
  'personId',
  'bucketId',
  'bankId',
  'comment',
]

const INITIAL_ROW_COUNT = 6

let nextRowId = 1

function makeEmptyRow() {
  return {
    id: nextRowId++,
    type: 'expense',
    description: '',
    amount: '',
    dayOfMonth: '1',
    subcategoryId: '',
    personId: '',
    paymentMethodId: '',
    bucketId: '',
    bankId: '',
    comment: '',
    includeInExpenses: true,
    selected: false,
    status: 'idle',
    error: null,
  }
}

function parsePastedDayOfMonth(text) {
  return clampDayOfMonth(text.trim())
}

function parseCellForColumn(columnKey, text, lookups) {
  switch (columnKey) {
    case 'type':
      return { type: resolveType(text) || 'expense' }
    case 'description':
      return { description: text.trim() }
    case 'amount':
      return { amount: formatAmountForDisplay(parsePastedAmount(text)) }
    case 'dayOfMonth':
      return { dayOfMonth: parsePastedDayOfMonth(text) }
    case 'subcategoryId':
      return { subcategoryId: resolveIdByName(lookups.subcategories, text) }
    case 'personId':
      return { personId: resolveIdByName(lookups.people, text) }
    case 'paymentMethodId':
      return { paymentMethodId: resolveIdByName(lookups.paymentMethods, text) }
    case 'bucketId':
      return { bucketId: resolveIdByName(lookups.buckets, text) }
    case 'bankId':
      return { bankId: resolveIdByName(lookups.banks, text) }
    case 'comment':
      return { comment: text.trim() }
    default:
      return {}
  }
}

function isRowBlank(row) {
  return !row.description.trim() && !row.amount
}

function isRowComplete(row, defaults) {
  const day = Number(row.dayOfMonth)
  const effectivePersonId = row.personId || defaults.personId
  const effectivePaymentMethodId = row.paymentMethodId || defaults.paymentMethodId
  const effectiveBucketId = row.bucketId || defaults.bucketId
  const effectiveBankId = row.bankId || defaults.bankId

  return Boolean(
    row.description.trim() &&
      row.subcategoryId &&
      effectivePersonId &&
      effectivePaymentMethodId &&
      effectiveBucketId &&
      effectiveBankId &&
      row.amount &&
      Number(normalizeAmountSeparators(row.amount)) > 0 &&
      row.dayOfMonth &&
      day >= 1 &&
      day <= 31 &&
      row.type
  )
}

function buildRowPayload(row, defaults, subcategories, planYear, planMonth) {
  const subcategory = subcategories.find((s) => String(s.id) === String(row.subcategoryId))
  return {
    description: row.description.trim(),
    amount: parseFloat(normalizeAmountSeparators(row.amount)),
    type: row.type,
    day_of_month: Number(row.dayOfMonth),
    category_id: Number(subcategory?.category_id),
    subcategory_id: Number(row.subcategoryId),
    person_id: Number(row.personId || defaults.personId),
    payment_method_id: Number(row.paymentMethodId || defaults.paymentMethodId),
    bucket_id: Number(row.bucketId || defaults.bucketId),
    bank_id: Number(row.bankId || defaults.bankId),
    include_in_expenses: Boolean(row.includeInExpenses),
    plan_year: planYear,
    plan_month: planMonth + 1,
    ...(row.comment.trim() ? { comment: row.comment.trim() } : {}),
  }
}

function RecurringExpenseBulkForm({ categories, subcategories, people, paymentMethods, buckets, banks, planYear, planMonth, onRecurrencesCreated }) {
  const [rows, setRows] = useState(() => Array.from({ length: INITIAL_ROW_COUNT }, makeEmptyRow))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [summary, setSummary] = useState(null)

  const defaults = useMemo(() => {
    const defaultPerson = people.find((p) => p.is_default)
    const defaultPaymentMethod = paymentMethods.find((m) => m.is_default)
    const defaultBucket = buckets.find((b) => b.is_default)
    const defaultBank = banks.find((b) => b.is_default)
    return {
      personId: defaultPerson ? String(defaultPerson.id) : people[0] ? String(people[0].id) : '',
      paymentMethodId: defaultPaymentMethod
        ? String(defaultPaymentMethod.id)
        : paymentMethods[0]
          ? String(paymentMethods[0].id)
          : '',
      bucketId: defaultBucket ? String(defaultBucket.id) : buckets[0] ? String(buckets[0].id) : '',
      bankId: defaultBank ? String(defaultBank.id) : banks[0] ? String(banks[0].id) : '',
    }
  }, [people, paymentMethods, buckets, banks])

  const lookups = { subcategories, people, paymentMethods, buckets, banks }

  const updateRow = (index, patch) => {
    setRows((current) => current.map((row, i) => (i === index ? { ...row, ...patch, status: 'idle', error: null } : row)))
  }

  const toggleRowSelected = (index) => {
    setRows((current) => current.map((row, i) => (i === index ? { ...row, selected: !row.selected } : row)))
  }

  const addRow = () => setRows((current) => [...current, makeEmptyRow()])

  const removeSelected = () => {
    setRows((current) => {
      const remaining = current.filter((row) => !row.selected)
      return remaining.length > 0 ? remaining : [makeEmptyRow()]
    })
  }

  const duplicateSelected = () => {
    setRows((current) => {
      const selectedRows = current.filter((row) => row.selected)
      if (selectedRows.length === 0) return current

      const lastSelectedIndex = current.reduce((last, row, index) => (row.selected ? index : last), -1)
      const duplicates = selectedRows.map((row) => ({ ...row, id: nextRowId++, selected: false, status: 'idle', error: null }))

      const next = [...current]
      next.splice(lastSelectedIndex + 1, 0, ...duplicates)
      return next
    })
  }

  const applyPaste = (anchorRowIndex, anchorColumnKey, text) => {
    const anchorColIndex = PASTE_COLUMNS.indexOf(anchorColumnKey)
    if (anchorColIndex === -1) return

    const lines = parseTsv(text)
    if (lines.length === 0) return

    setRows((current) => {
      const next = [...current]

      lines.forEach((cells, lineIndex) => {
        const targetRowIndex = anchorRowIndex + lineIndex
        while (targetRowIndex >= next.length) next.push(makeEmptyRow())

        let patch = {}
        cells.forEach((cellText, cellIndex) => {
          const columnKey = PASTE_COLUMNS[anchorColIndex + cellIndex]
          if (!columnKey) return
          patch = { ...patch, ...parseCellForColumn(columnKey, cellText, lookups) }
        })

        next[targetRowIndex] = { ...next[targetRowIndex], ...patch, status: 'idle', error: null }
      })

      return next
    })
  }

  // Free-text inputs where a paste should behave like a normal paste (insert at the cursor,
  // keep surrounding text) when it's just plain single-cell text rather than spreadsheet data.
  const FREE_TEXT_COLUMNS = new Set(['description'])

  const pasteHandler = (rowIndex, columnKey) => (e) => {
    const text = e.clipboardData.getData('text')
    if (FREE_TEXT_COLUMNS.has(columnKey) && !/[\t\n]/.test(text)) return
    e.preventDefault()
    applyPaste(rowIndex, columnKey, text)
  }

  const hasSelected = rows.some((row) => row.selected)

  const handleSubmit = () => {
    setError(null)
    setSummary(null)

    const candidateIndices = []
    const payloadRows = []

    const nextRows = rows.map((row, index) => {
      if (isRowBlank(row)) return row
      if (!isRowComplete(row, defaults)) {
        return { ...row, status: 'error', error: 'Preencha os campos obrigatórios desta linha.' }
      }
      candidateIndices.push(index)
      payloadRows.push(buildRowPayload(row, defaults, subcategories, planYear, planMonth))
      return { ...row, status: 'idle', error: null }
    })

    setRows(nextRows)

    if (payloadRows.length === 0) return

    setIsSubmitting(true)

    createRecurringExpensesBulk(payloadRows)
      .then(({ results, created }) => {
        const succeededIndices = new Set()
        const failedIndices = new Set()

        candidateIndices.forEach((originalIndex, i) => {
          if (results[i]?.ok) succeededIndices.add(originalIndex)
          else failedIndices.add(originalIndex)
        })

        setRows((current) => {
          const updated = current.map((row, index) => {
            if (failedIndices.has(index)) {
              return { ...row, status: 'error', error: 'Não foi possível salvar esta linha. Verifique os dados.' }
            }
            return row
          })
          const remaining = updated.filter((_, index) => !succeededIndices.has(index))
          return remaining.length > 0 ? remaining : [makeEmptyRow()]
        })

        setSummary(`${succeededIndices.size} de ${results.length} gastos fixos salvos.`)

        if (created.length > 0) onRecurrencesCreated(created)
      })
      .catch((err) => {
        console.error('Erro ao salvar gastos fixos em lote:', err)
        setError('Não foi possível salvar os gastos fixos. Tente novamente.')
      })
      .finally(() => setIsSubmitting(false))
  }

  return (
    <div className="bulk-grid-form">
      <p className="bulk-grid-hint">
        Cole dados do Excel a partir da coluna Dia do mês — ordem das colunas: Dia do mês, Valor, Método de
        pagamento, Descrição, Subcategoria, Tipo, Responsável, Envelope, Banco, Comentário.
      </p>

      <div className="bulk-grid-scroll">
        <fieldset className="bulk-grid-fieldset" disabled={isSubmitting}>
          <table className="bulk-grid">
            <thead>
              <tr>
                <th></th>
                <th>Dia do mês</th>
                <th>Valor</th>
                <th>Método de pagamento</th>
                <th>Descrição</th>
                <th>Subcategoria</th>
                <th>Tipo</th>
                <th>Responsável</th>
                <th>Envelope</th>
                <th>Banco</th>
                <th>Comentário</th>
                <th>Lança</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={row.id} className={row.status === 'error' ? 'bulk-grid-row--error' : undefined}>
                  <td title={row.error || undefined}>
                    <input
                      type="checkbox"
                      checked={row.selected}
                      onChange={() => toggleRowSelected(index)}
                      aria-label="Selecionar linha"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={row.dayOfMonth}
                      onChange={(e) => updateRow(index, { dayOfMonth: clampDayOfMonth(e.target.value) })}
                      onPaste={pasteHandler(index, 'dayOfMonth')}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={row.amount}
                      placeholder="0,00"
                      onChange={(e) => updateRow(index, { amount: maskAmountInput(e.target.value) })}
                      onBlur={(e) => updateRow(index, { amount: normalizeAmountSeparators(e.target.value) })}
                      onPaste={pasteHandler(index, 'amount')}
                    />
                  </td>
                  <td>
                    <select
                      value={row.paymentMethodId || defaults.paymentMethodId}
                      onChange={(e) => updateRow(index, { paymentMethodId: e.target.value })}
                      onPaste={pasteHandler(index, 'paymentMethodId')}
                    >
                      <option value="">Selecione…</option>
                      {paymentMethods.map((m) => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      type="text"
                      value={row.description}
                      placeholder="Descrição"
                      onChange={(e) => updateRow(index, { description: e.target.value })}
                      onPaste={pasteHandler(index, 'description')}
                    />
                  </td>
                  <td onPaste={pasteHandler(index, 'subcategoryId')}>
                    <SubcategorySelect
                      categories={categories}
                      subcategories={subcategories}
                      value={row.subcategoryId}
                      onChange={(nextSubcategoryId) => updateRow(index, { subcategoryId: nextSubcategoryId })}
                    />
                  </td>
                  <td>
                    <select
                      value={row.type}
                      onChange={(e) => updateRow(index, { type: e.target.value })}
                      onPaste={pasteHandler(index, 'type')}
                    >
                      {TRANSACTION_TYPES.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <select
                      value={row.personId || defaults.personId}
                      onChange={(e) => updateRow(index, { personId: e.target.value })}
                      onPaste={pasteHandler(index, 'personId')}
                    >
                      <option value="">Selecione…</option>
                      {people.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <select
                      value={row.bucketId || defaults.bucketId}
                      onChange={(e) => updateRow(index, { bucketId: e.target.value })}
                      onPaste={pasteHandler(index, 'bucketId')}
                    >
                      <option value="">Selecione…</option>
                      {buckets.map((b) => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <select
                      value={row.bankId || defaults.bankId}
                      onChange={(e) => updateRow(index, { bankId: e.target.value })}
                      onPaste={pasteHandler(index, 'bankId')}
                    >
                      <option value="">Selecione…</option>
                      {banks.map((b) => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      type="text"
                      value={row.comment}
                      placeholder="Opcional"
                      onChange={(e) => updateRow(index, { comment: e.target.value })}
                      onPaste={pasteHandler(index, 'comment')}
                    />
                  </td>
                  <td>
                    <input
                      type="checkbox"
                      checked={row.includeInExpenses}
                      onChange={(e) => updateRow(index, { includeInExpenses: e.target.checked })}
                      aria-label="Lançar automaticamente nas despesas"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </fieldset>
      </div>

      {rows.some((row) => row.status === 'error') && (
        <p className="form-error">Algumas linhas têm campos pendentes ou não puderam ser salvas — corrija as linhas destacadas.</p>
      )}

      {error && <p className="form-error">{error}</p>}
      {summary && <p className="state-message" style={{ padding: 0, textAlign: 'left' }}>{summary}</p>}

      <div className="bulk-grid-actions">
        <button type="button" className="btn btn-secondary" onClick={addRow} disabled={isSubmitting}>
          + Adicionar linha
        </button>
        <button type="button" className="btn btn-secondary" onClick={duplicateSelected} disabled={isSubmitting || !hasSelected}>
          Duplicar selecionadas
        </button>
        <button type="button" className="btn btn-secondary" onClick={removeSelected} disabled={isSubmitting || !hasSelected}>
          Remover selecionadas
        </button>
        <button type="button" className="btn btn-primary" onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? 'Salvando…' : 'Salvar gastos fixos'}
        </button>
      </div>
    </div>
  )
}

export default RecurringExpenseBulkForm