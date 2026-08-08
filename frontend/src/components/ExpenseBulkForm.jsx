import { useMemo, useState } from 'react'
import { createExpensesBulk } from '../api/expenses'
import { useCategories } from '../hooks/useCategories'
import { usePeople } from '../hooks/usePeople'
import { usePaymentMethods } from '../hooks/usePaymentMethods'
import { useBuckets } from '../hooks/useBuckets'
import { useBanks } from '../hooks/useBanks'
import { useInvestmentBoxes } from '../hooks/useInvestmentBoxes'
import { TRANSACTION_TYPES } from '../utils/transactionTypes'
import { dateInputValueToISOString, parseFlexibleDateInput } from '../utils/date'
import { parsePastedAmount, resolveIdByName, resolveType } from '../utils/bulkPaste'
import DatePicker from './DatePicker'

// Fixed left-to-right order pasted spreadsheet columns are mapped to, starting from whichever
// cell was focused when the paste happened.
const PASTE_COLUMNS = [
  'date',
  'description',
  'amount',
  'type',
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
    date: '',
    description: '',
    amount: '',
    type: 'expense',
    categoryId: '',
    personId: '',
    paymentMethodId: '',
    bucketId: '',
    bankId: '',
    isInstallment: false,
    installmentCount: '2',
    investmentBoxId: '',
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
      return { amount: parsePastedAmount(text) }
    case 'type':
      return { type: resolveType(text) || 'expense' }
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
  return !row.description.trim() && !row.amount && !row.date
}

function isRowComplete(row, defaults) {
  const effectiveCategoryId = row.categoryId || defaults.categoryId
  const effectivePersonId = row.personId || defaults.personId
  const effectivePaymentMethodId = row.paymentMethodId || defaults.paymentMethodId
  const effectiveBucketId = row.bucketId || defaults.bucketId
  const effectiveBankId = row.bankId || defaults.bankId
  const effectiveInvestmentBoxId = row.investmentBoxId || defaults.investmentBoxId

  const sharedOk =
    row.description.trim() &&
    effectiveCategoryId &&
    effectivePersonId &&
    effectivePaymentMethodId &&
    effectiveBucketId &&
    effectiveBankId

  if (!sharedOk) return false

  if (row.isInstallment) {
    const count = Number(row.installmentCount)
    return Boolean(row.amount) && Number(row.amount) > 0 && count >= 2 && count <= 60 && Boolean(row.date)
  }

  if (row.type === 'investment' && !effectiveInvestmentBoxId) return false

  return Boolean(row.amount) && Number(row.amount) > 0 && Boolean(row.date) && Boolean(row.type)
}

function buildRowPayload(row, defaults) {
  const shared = {
    description: row.description.trim(),
    category_id: Number(row.categoryId || defaults.categoryId),
    person_id: Number(row.personId || defaults.personId),
    payment_method_id: Number(row.paymentMethodId || defaults.paymentMethodId),
    bucket_id: Number(row.bucketId || defaults.bucketId),
    bank_id: Number(row.bankId || defaults.bankId),
  }

  if (row.isInstallment) {
    return {
      is_installment: true,
      ...shared,
      total_amount: parseFloat(row.amount),
      installment_count: Number(row.installmentCount),
      purchase_date: dateInputValueToISOString(row.date),
    }
  }

  return {
    is_installment: false,
    ...shared,
    amount: parseFloat(row.amount),
    type: row.type,
    date: dateInputValueToISOString(row.date),
    ...(row.type === 'investment' ? { investment_box_id: Number(row.investmentBoxId || defaults.investmentBoxId) } : {}),
  }
}

function ExpenseBulkForm({ onExpensesCreated }) {
  const { categories, isLoading: isLoadingCategories } = useCategories()
  const { people, isLoading: isLoadingPeople } = usePeople()
  const { paymentMethods, isLoading: isLoadingPaymentMethods } = usePaymentMethods()
  const { buckets, isLoading: isLoadingBuckets } = useBuckets()
  const { banks, isLoading: isLoadingBanks } = useBanks()
  const { investmentBoxes, isLoading: isLoadingInvestmentBoxes } = useInvestmentBoxes()

  const [rows, setRows] = useState(() => Array.from({ length: INITIAL_ROW_COUNT }, makeEmptyRow))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [summary, setSummary] = useState(null)

  const noCategories = !isLoadingCategories && categories.length === 0

  const defaults = useMemo(() => {
    const defaultCategory = categories.find((c) => c.is_default)
    const defaultPerson = people.find((p) => p.is_default)
    const defaultPaymentMethod = paymentMethods.find((m) => m.is_default)
    const defaultBucket = buckets.find((b) => b.is_default)
    const defaultBank = banks.find((b) => b.is_default)
    const defaultBox = investmentBoxes.find((b) => b.is_default)
    return {
      categoryId: defaultCategory ? String(defaultCategory.id) : categories[0] ? String(categories[0].id) : '',
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
  }, [categories, people, paymentMethods, buckets, banks, investmentBoxes])

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
      if (!isRowComplete(row, defaults)) {
        return { ...row, status: 'error', error: 'Preencha os campos obrigatórios desta linha.' }
      }
      candidateIndices.push(index)
      payloadRows.push(buildRowPayload(row, defaults))
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
      <p className="bulk-grid-hint">
        Cole dados do Excel a partir da coluna Data — ordem das colunas: Data, Descrição, Valor, Tipo, Categoria,
        Responsável, Método de pagamento, Envelope, Banco.
      </p>

      <div className="bulk-grid-scroll">
        <fieldset className="bulk-grid-fieldset" disabled={isSubmitting}>
          <table className="bulk-grid">
            <thead>
              <tr>
                <th></th>
                <th>Data</th>
                <th>Descrição</th>
                <th>Valor</th>
                <th>Tipo</th>
                <th>Categoria</th>
                <th>Responsável</th>
                <th>Método de pagamento</th>
                <th>Envelope</th>
                <th>Banco</th>
                <th>Parcelado</th>
                <th>Parcelas</th>
                <th>Caixinha</th>
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
                    <DatePicker
                      value={row.date}
                      onChange={(e) => updateRow(index, { date: e.target.value })}
                      onPaste={pasteHandler(index, 'date')}
                    />
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
                      value={row.categoryId || defaults.categoryId}
                      onChange={(e) => updateRow(index, { categoryId: e.target.value })}
                      onPaste={pasteHandler(index, 'categoryId')}
                      disabled={noCategories}
                    >
                      <option value="">Selecione…</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
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
                      disabled={row.type !== 'investment' || isLoadingInvestmentBoxes}
                    >
                      <option value="">Selecione…</option>
                      {investmentBoxes.map((b) => (
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

      {noCategories && (
        <p className="form-error">Cadastre uma categoria em "Categorias" antes de adicionar despesas.</p>
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
        <button type="button" className="btn btn-primary" onClick={handleSubmit} disabled={isSubmitting || noCategories}>
          {isSubmitting ? 'Salvando…' : 'Salvar transações'}
        </button>
      </div>
    </div>
  )
}

export default ExpenseBulkForm
