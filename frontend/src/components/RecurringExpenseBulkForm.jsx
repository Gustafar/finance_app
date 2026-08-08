import { useState } from 'react'
import { createRecurringExpensesBulk } from '../api/recurringExpenses'
import { TRANSACTION_TYPES } from '../utils/transactionTypes'
import { parsePastedAmount, resolveIdByName, resolveType } from '../utils/bulkPaste'

// Fixed left-to-right order pasted spreadsheet columns are mapped to, starting from whichever
// cell was focused when the paste happened. Matches RecurringFields' own field order.
const PASTE_COLUMNS = [
  'type',
  'description',
  'amount',
  'dayOfMonth',
  'categoryId',
  'personId',
  'paymentMethodId',
  'bucketId',
  'bankId',
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
    categoryId: '',
    personId: '',
    paymentMethodId: '',
    bucketId: '',
    bankId: '',
    selected: false,
    status: 'idle',
    error: null,
  }
}

function parsePastedDayOfMonth(text) {
  return text.trim().replace(/[^\d]/g, '')
}

function parseCellForColumn(columnKey, text, lookups) {
  switch (columnKey) {
    case 'type':
      return { type: resolveType(text) || 'expense' }
    case 'description':
      return { description: text.trim() }
    case 'amount':
      return { amount: parsePastedAmount(text) }
    case 'dayOfMonth':
      return { dayOfMonth: parsePastedDayOfMonth(text) }
    case 'categoryId':
      return { categoryId: resolveIdByName(lookups.categories, text) }
    case 'personId':
      return { personId: resolveIdByName(lookups.people, text) }
    case 'paymentMethodId':
      return { paymentMethodId: resolveIdByName(lookups.paymentMethods, text) }
    case 'bucketId':
      return { bucketId: resolveIdByName(lookups.buckets, text) }
    case 'bankId':
      return { bankId: resolveIdByName(lookups.banks, text) }
    default:
      return {}
  }
}

function isRowBlank(row) {
  return !row.description.trim() && !row.amount
}

function isRowComplete(row) {
  const day = Number(row.dayOfMonth)

  return Boolean(
    row.description.trim() &&
      row.categoryId &&
      row.personId &&
      row.paymentMethodId &&
      row.bucketId &&
      row.bankId &&
      row.amount &&
      Number(row.amount) > 0 &&
      row.dayOfMonth &&
      day >= 1 &&
      day <= 31 &&
      row.type
  )
}

function buildRowPayload(row) {
  return {
    description: row.description.trim(),
    amount: parseFloat(row.amount),
    type: row.type,
    day_of_month: Number(row.dayOfMonth),
    category_id: Number(row.categoryId),
    person_id: Number(row.personId),
    payment_method_id: Number(row.paymentMethodId),
    bucket_id: Number(row.bucketId),
    bank_id: Number(row.bankId),
  }
}

function RecurringExpenseBulkForm({ categories, people, paymentMethods, buckets, banks, onRecurrencesCreated }) {
  const [rows, setRows] = useState(() => Array.from({ length: INITIAL_ROW_COUNT }, makeEmptyRow))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [summary, setSummary] = useState(null)

  const lookups = { categories, people, paymentMethods, buckets, banks }

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

  const applyPaste = (anchorRowIndex, anchorColumnKey, text) => {
    const anchorColIndex = PASTE_COLUMNS.indexOf(anchorColumnKey)
    if (anchorColIndex === -1) return

    const lines = text.replace(/\r/g, '').split('\n')
    if (lines.length > 1 && lines[lines.length - 1] === '') lines.pop()
    if (lines.length === 0) return

    setRows((current) => {
      const next = [...current]

      lines.forEach((line, lineIndex) => {
        const targetRowIndex = anchorRowIndex + lineIndex
        while (targetRowIndex >= next.length) next.push(makeEmptyRow())

        const cells = line.split('\t')
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

  const pasteHandler = (rowIndex, columnKey) => (e) => {
    e.preventDefault()
    applyPaste(rowIndex, columnKey, e.clipboardData.getData('text'))
  }

  const hasSelected = rows.some((row) => row.selected)

  const handleSubmit = () => {
    setError(null)
    setSummary(null)

    const candidateIndices = []
    const payloadRows = []

    const nextRows = rows.map((row, index) => {
      if (isRowBlank(row)) return row
      if (!isRowComplete(row)) {
        return { ...row, status: 'error', error: 'Preencha os campos obrigatórios desta linha.' }
      }
      candidateIndices.push(index)
      payloadRows.push(buildRowPayload(row))
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
        Cole dados do Excel a partir da coluna Tipo — ordem das colunas: Tipo, Descrição, Valor, Dia do mês,
        Categoria, Responsável, Método de pagamento, Envelope, Banco.
      </p>

      <div className="bulk-grid-scroll">
        <fieldset className="bulk-grid-fieldset" disabled={isSubmitting}>
          <table className="bulk-grid">
            <thead>
              <tr>
                <th></th>
                <th>Tipo</th>
                <th>Descrição</th>
                <th>Valor</th>
                <th>Dia do mês</th>
                <th>Categoria</th>
                <th>Responsável</th>
                <th>Método de pagamento</th>
                <th>Envelope</th>
                <th>Banco</th>
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
                    <input
                      type="text"
                      value={row.description}
                      placeholder="Descrição"
                      onChange={(e) => updateRow(index, { description: e.target.value })}
                      onPaste={pasteHandler(index, 'description')}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={row.amount}
                      placeholder="0,00"
                      onChange={(e) => updateRow(index, { amount: e.target.value })}
                      onPaste={pasteHandler(index, 'amount')}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={row.dayOfMonth}
                      onChange={(e) => updateRow(index, { dayOfMonth: e.target.value })}
                      onPaste={pasteHandler(index, 'dayOfMonth')}
                    />
                  </td>
                  <td>
                    <select
                      value={row.categoryId}
                      onChange={(e) => updateRow(index, { categoryId: e.target.value })}
                      onPaste={pasteHandler(index, 'categoryId')}
                    >
                      <option value="">Selecione…</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <select
                      value={row.personId}
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
                      value={row.paymentMethodId}
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
                    <select
                      value={row.bucketId}
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
                      value={row.bankId}
                      onChange={(e) => updateRow(index, { bankId: e.target.value })}
                      onPaste={pasteHandler(index, 'bankId')}
                    >
                      <option value="">Selecione…</option>
                      {banks.map((b) => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
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