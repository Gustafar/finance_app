import { useMemo, useState } from 'react'
import { createExpensesBulk } from '../api/expenses'
import { useCategories } from '../hooks/useCategories'
import { useSubcategories } from '../hooks/useSubcategories'
import { usePeople } from '../hooks/usePeople'
import { usePaymentMethods } from '../hooks/usePaymentMethods'
import { useBuckets } from '../hooks/useBuckets'
import { useBanks } from '../hooks/useBanks'
import { useInvestmentBoxes } from '../hooks/useInvestmentBoxes'
import { TRANSACTION_TYPES } from '../utils/transactionTypes'
import { dateInputValueToISOString, parseFlexibleDateInput } from '../utils/date'
import { parsePastedAmount, parseTsv, resolveIdByName, resolveType } from '../utils/bulkPaste'
import { isAmountFormula, isAmountInvalid, maskAmountInput, resolveAmountInput, formatAmountForDisplay } from '../utils/amountFormula'
import DatePicker from './DatePicker'
import LoadingBar from './LoadingBar'
import SubcategorySelect from './SubcategorySelect'

// Fixed left-to-right order pasted spreadsheet columns are mapped to, starting from whichever
// cell was focused when the paste happened.
const PASTE_COLUMNS = [
  'date',
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
    date: '',
    description: '',
    amount: '',
    amountFormula: null,
    type: 'expense',
    subcategoryId: '',
    personId: '',
    paymentMethodId: '',
    bucketId: '',
    bankId: '',
    isInstallment: false,
    installmentCount: '2',
    investmentBoxId: '',
    comment: '',
    selected: false,
    status: 'idle',
    error: null,
  }
}

function parseCellForColumn(columnKey, text, lookups) {
  switch (columnKey) {
    case 'date':
      return { date: parseFlexibleDateInput(text) }
    case 'description':
      return { description: text.trim() }
    case 'amount':
      return { amount: formatAmountForDisplay(parsePastedAmount(text)) }
    case 'type':
      return { type: resolveType(text) || 'expense' }
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
  return !row.description.trim() && !row.amount && !row.date
}

function rowNeedsInvestmentBox(row, effectiveBucketId, buckets) {
  if (row.type === 'investment') return true
  if (row.isInstallment) return false
  const selectedBucket = buckets.find((b) => String(b.id) === String(effectiveBucketId))
  return row.type === 'expense' && Boolean(selectedBucket?.is_goal_withdrawal)
}

function isRowComplete(row, defaults, buckets) {
  const effectivePersonId = row.personId || defaults.personId
  const effectivePaymentMethodId = row.paymentMethodId || defaults.paymentMethodId
  const effectiveBucketId = row.bucketId || defaults.bucketId
  const effectiveBankId = row.bankId || defaults.bankId
  const effectiveInvestmentBoxId = row.investmentBoxId || defaults.investmentBoxId

  const sharedOk =
    row.description.trim() &&
    row.subcategoryId &&
    effectivePersonId &&
    effectivePaymentMethodId &&
    effectiveBucketId &&
    effectiveBankId

  if (!sharedOk) return false

  if (row.isInstallment) {
    const count = Number(row.installmentCount)
    return !isAmountInvalid(row.amount, { allowZero: false }) && count >= 2 && count <= 60 && Boolean(row.date)
  }

  if (rowNeedsInvestmentBox(row, effectiveBucketId, buckets) && !effectiveInvestmentBoxId) return false

  return !isAmountInvalid(row.amount) && Boolean(row.date) && Boolean(row.type)
}

function buildRowPayload(row, defaults, subcategories, buckets) {
  const subcategory = subcategories.find((s) => String(s.id) === String(row.subcategoryId))
  const effectiveBucketId = row.bucketId || defaults.bucketId
  const shared = {
    description: row.description.trim(),
    category_id: Number(subcategory?.category_id),
    subcategory_id: Number(row.subcategoryId),
    person_id: Number(row.personId || defaults.personId),
    payment_method_id: Number(row.paymentMethodId || defaults.paymentMethodId),
    bucket_id: Number(effectiveBucketId),
    bank_id: Number(row.bankId || defaults.bankId),
  }

  if (row.isInstallment) {
    return {
      is_installment: true,
      ...shared,
      total_amount: parseFloat(row.amount),
      installment_count: Number(row.installmentCount),
      purchase_date: dateInputValueToISOString(row.date),
      ...(row.comment.trim() ? { comment: row.comment.trim() } : {}),
    }
  }

  return {
    is_installment: false,
    ...shared,
    amount: parseFloat(row.amount),
    amount_formula: row.amountFormula || null,
    type: row.type,
    date: dateInputValueToISOString(row.date),
    ...(rowNeedsInvestmentBox(row, effectiveBucketId, buckets)
      ? { investment_box_id: Number(row.investmentBoxId || defaults.investmentBoxId) }
      : {}),
    ...(row.comment.trim() ? { comment: row.comment.trim() } : {}),
  }
}

function ExpenseBulkForm({ onExpensesCreated }) {
  const { categories, isLoading: isLoadingCategories } = useCategories()
  const { subcategories, isLoading: isLoadingSubcategories } = useSubcategories()
  const { people, isLoading: isLoadingPeople } = usePeople()
  const { paymentMethods, isLoading: isLoadingPaymentMethods } = usePaymentMethods()
  const { buckets, isLoading: isLoadingBuckets } = useBuckets()
  const { banks, isLoading: isLoadingBanks } = useBanks()
  const { investmentBoxes, isLoading: isLoadingInvestmentBoxes } = useInvestmentBoxes()

  const [rows, setRows] = useState(() => Array.from({ length: INITIAL_ROW_COUNT }, makeEmptyRow))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [summary, setSummary] = useState(null)

  const noSubcategories = !isLoadingSubcategories && subcategories.length === 0

  const isLoadingOptions =
    isLoadingCategories ||
    isLoadingPeople ||
    isLoadingPaymentMethods ||
    isLoadingBuckets ||
    isLoadingBanks ||
    isLoadingInvestmentBoxes ||
    isLoadingSubcategories

  const defaults = useMemo(() => {
    const defaultPerson = people.find((p) => p.is_default)
    const defaultPaymentMethod = paymentMethods.find((m) => m.is_default)
    const defaultBucket = buckets.find((b) => b.is_default)
    const defaultBank = banks.find((b) => b.is_default)
    const defaultBox = investmentBoxes.find((b) => b.is_default)
    return {
      personId: defaultPerson ? String(defaultPerson.id) : people[0] ? String(people[0].id) : '',
      paymentMethodId: defaultPaymentMethod
        ? String(defaultPaymentMethod.id)
        : paymentMethods[0]
          ? String(paymentMethods[0].id)
          : '',
      bucketId: defaultBucket ? String(defaultBucket.id) : buckets[0] ? String(buckets[0].id) : '',
      bankId: defaultBank ? String(defaultBank.id) : banks[0] ? String(banks[0].id) : '',
      investmentBoxId: defaultBox ? String(defaultBox.id) : investmentBoxes[0] ? String(investmentBoxes[0].id) : '',
    }
  }, [people, paymentMethods, buckets, banks, investmentBoxes])

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

  const filledRowCount = rows.filter((row) => !isRowBlank(row)).length

  const hasSelected = rows.some((row) => row.selected)

  const handleSubmit = () => {
    setError(null)
    setSummary(null)

    const candidateIndices = []
    const payloadRows = []

    const nextRows = rows
      .map((row) => ({
        ...row,
        amountFormula: isAmountFormula(row.amount) ? row.amount : row.amountFormula,
        amount: resolveAmountInput(row.amount),
      }))
      .map((row, index) => {
      if (isRowBlank(row)) return row
      if (!isRowComplete(row, defaults, buckets)) {
        return { ...row, status: 'error', error: 'Preencha os campos obrigatórios desta linha.' }
      }
      candidateIndices.push(index)
      payloadRows.push(buildRowPayload(row, defaults, subcategories, buckets))
      return { ...row, status: 'idle', error: null }
    })

    setRows(nextRows)

    if (payloadRows.length === 0) return

    setIsSubmitting(true)

    createExpensesBulk(payloadRows)
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

        setSummary(`${succeededIndices.size} de ${results.length} transações salvas.`)

        if (created.length > 0) onExpensesCreated(created)
      })
      .catch((err) => {
        console.error('Erro ao salvar transações em lote:', err)
        setError('Não foi possível salvar as transações. Tente novamente.')
      })
      .finally(() => setIsSubmitting(false))
  }

  return (
    <div className="bulk-grid-form">
      {isLoadingOptions && <LoadingBar variant="dialog" />}

      <p className="bulk-grid-hint">
        Cole dados do Excel a partir da coluna Data — ordem das colunas: Data, Valor, Método de pagamento,
        Descrição, Subcategoria, Tipo, Responsável, Envelope, Banco, Comentário.
      </p>
      <p className="bulk-grid-row-count">
        {filledRowCount} {filledRowCount === 1 ? 'linha preenchida' : 'linhas preenchidas'} de {rows.length}
      </p>

      <div className="bulk-grid-scroll">
        <fieldset className="bulk-grid-fieldset" disabled={isSubmitting}>
          <table className="bulk-grid">
            <thead>
              <tr>
                <th></th>
                <th>Data</th>
                <th>Valor</th>
                <th>Método de pagamento</th>
                <th>Descrição</th>
                <th>Subcategoria</th>
                <th>Tipo</th>
                <th>Responsável</th>
                <th>Envelope</th>
                <th>Banco</th>
                <th>Parcelado</th>
                <th>Parcelas</th>
                <th>Caixinha</th>
                <th>Comentário</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => {
                const effectiveBucketId = row.bucketId || defaults.bucketId
                const needsInvestmentBox = rowNeedsInvestmentBox(row, effectiveBucketId, buckets)
                return (
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
                    <DatePicker
                      value={row.date}
                      onChange={(e) => updateRow(index, { date: e.target.value })}
                      onPaste={pasteHandler(index, 'date')}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={row.amount}
                      placeholder="0,00 (ou =10+5,50)"
                      onChange={(e) => updateRow(index, { amount: maskAmountInput(e.target.value) })}
                      onFocus={() => {
                        if (row.amountFormula) updateRow(index, { amount: row.amountFormula })
                      }}
                      onBlur={(e) => {
                        const text = e.target.value
                        if (isAmountFormula(text)) {
                          updateRow(index, { amountFormula: text, amount: resolveAmountInput(text) })
                        } else {
                          updateRow(index, { amountFormula: null, amount: resolveAmountInput(text) })
                        }
                      }}
                      onPaste={pasteHandler(index, 'amount')}
                    />
                  </td>
                  <td>
                    <select
                      value={row.paymentMethodId || defaults.paymentMethodId}
                      onChange={(e) => updateRow(index, { paymentMethodId: e.target.value })}
                      onPaste={pasteHandler(index, 'paymentMethodId')}
                      disabled={isLoadingPaymentMethods}
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
                      className="bulk-grid-description-input"
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
                      disabled={noSubcategories}
                    />
                  </td>
                  <td>
                    <select
                      value={row.type}
                      onChange={(e) => {
                        const nextType = e.target.value
                        updateRow(index, nextType === 'expense' ? { type: nextType } : { type: nextType, isInstallment: false })
                      }}
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
                      disabled={isLoadingPeople}
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
                      disabled={isLoadingBuckets}
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
                      disabled={isLoadingBanks}
                    >
                      <option value="">Selecione…</option>
                      {banks.map((b) => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      type="checkbox"
                      checked={row.isInstallment}
                      onChange={(e) => updateRow(index, { isInstallment: e.target.checked })}
                      disabled={row.type !== 'expense'}
                      aria-label="Compra parcelada"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      min="2"
                      max="60"
                      value={row.installmentCount}
                      onChange={(e) => updateRow(index, { installmentCount: e.target.value })}
                      disabled={!row.isInstallment}
                    />
                  </td>
                  <td>
                    <select
                      value={row.investmentBoxId || defaults.investmentBoxId}
                      onChange={(e) => updateRow(index, { investmentBoxId: e.target.value })}
                      disabled={!needsInvestmentBox || isLoadingInvestmentBoxes}
                    >
                      <option value="">Selecione…</option>
                      {investmentBoxes.map((b) => (
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
                </tr>
                )
              })}
            </tbody>
          </table>
        </fieldset>
      </div>

      {rows.some((row) => row.status === 'error') && (
        <p className="form-error">Algumas linhas têm campos pendentes ou não puderam ser salvas — corrija as linhas destacadas.</p>
      )}

      {noSubcategories && (
        <p className="form-error">Cadastre uma categoria e uma subcategoria antes de adicionar despesas.</p>
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
        <button type="button" className="btn btn-primary" onClick={handleSubmit} disabled={isSubmitting || noSubcategories}>
          {isSubmitting ? 'Salvando…' : 'Salvar transações'}
        </button>
      </div>
    </div>
  )
}

export default ExpenseBulkForm
