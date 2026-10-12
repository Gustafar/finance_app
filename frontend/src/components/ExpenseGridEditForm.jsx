import { useMemo, useState } from 'react'
import { updateExpensesBulk } from '../api/expenses'
import { useCategories } from '../hooks/useCategories'
import { useSubcategories } from '../hooks/useSubcategories'
import { usePeople } from '../hooks/usePeople'
import { usePaymentMethods } from '../hooks/usePaymentMethods'
import { useBuckets } from '../hooks/useBuckets'
import { useBanks } from '../hooks/useBanks'
import { useInvestmentBoxes } from '../hooks/useInvestmentBoxes'
import { TRANSACTION_TYPES } from '../utils/transactionTypes'
import { dateInputValueToISOString, isoStringToDateInputValue } from '../utils/date'
import { EXPENSE_PASTE_COLUMNS, isPlainExpenseCellPaste, parseExpenseCell, parseTsv } from '../utils/bulkPaste'
import { formatAmountForDisplay, isAmountFormula, isAmountInvalid, resolveAmountInput } from '../utils/amountFormula'
import AmountInput from './AmountInput'
import DatePicker from './DatePicker'
import EmojiTextInput from './EmojiTextInput'
import LoadingBar from './LoadingBar'
import SubcategorySelect from './SubcategorySelect'

function expenseToRow(expense) {
  return {
    id: expense.id,
    expense,
    date: isoStringToDateInputValue(expense.date),
    description: expense.description,
    amount: formatAmountForDisplay(expense.amount),
    amountFormula: expense.amount_formula || null,
    type: expense.type,
    categoryId: String(expense.category_id),
    subcategoryId: expense.subcategory_id ? String(expense.subcategory_id) : '',
    personId: String(expense.person_id),
    paymentMethodId: String(expense.payment_method_id),
    bucketId: String(expense.bucket_id),
    bankId: String(expense.bank_id),
    investmentBoxId: expense.investment_box_id ? String(expense.investment_box_id) : '',
    comment: expense.comment || '',
    isDirty: false,
    status: 'idle',
    error: null,
  }
}

function rowRequiresInvestmentBox(row) {
  return row.type === 'investment'
}

// Same rule as ExpenseEditForm: investments always point at a box, and an expense paid from a
// goal-withdrawal bucket may optionally say which box it comes out of.
function rowNeedsInvestmentBox(row, buckets) {
  if (rowRequiresInvestmentBox(row)) return true
  const bucket = buckets.find((b) => String(b.id) === row.bucketId)
  return row.type === 'expense' && Boolean(bucket?.is_goal_withdrawal)
}

function effectiveInvestmentBoxId(row, defaultInvestmentBoxId) {
  return row.investmentBoxId || (rowRequiresInvestmentBox(row) ? defaultInvestmentBoxId : '')
}

function isRowComplete(row, defaultInvestmentBoxId) {
  return Boolean(
    row.description.trim() &&
      !isAmountInvalid(row.amount) &&
      row.date &&
      row.subcategoryId &&
      row.personId &&
      row.paymentMethodId &&
      row.bucketId &&
      row.bankId &&
      (!rowRequiresInvestmentBox(row) || effectiveInvestmentBoxId(row, defaultInvestmentBoxId))
  )
}

function buildRowPayload(row, subcategories, buckets, defaultInvestmentBoxId) {
  const subcategory = subcategories.find((s) => String(s.id) === row.subcategoryId)
  const investmentBoxId = effectiveInvestmentBoxId(row, defaultInvestmentBoxId)
  return {
    id: row.id,
    description: row.description.trim(),
    amount: parseFloat(row.amount),
    amount_formula: row.amountFormula || null,
    type: row.type,
    category_id: Number(subcategory?.category_id ?? row.categoryId),
    subcategory_id: Number(row.subcategoryId),
    person_id: Number(row.personId),
    payment_method_id: Number(row.paymentMethodId),
    bucket_id: Number(row.bucketId),
    bank_id: Number(row.bankId),
    date: dateInputValueToISOString(row.date),
    ...(rowNeedsInvestmentBox(row, buckets) && investmentBoxId ? { investment_box_id: Number(investmentBoxId) } : {}),
    ...(row.comment.trim() ? { comment: row.comment.trim() } : {}),
  }
}

// Spreadsheet-style editor for several existing expenses at once. Only rows the user touched are
// sent; installment rows change just that one installment (no scope prompt, unlike the single edit).
function ExpenseGridEditForm({ expenses, onExpensesUpdated, onDone }) {
  const { categories, isLoading: isLoadingCategories } = useCategories()
  const { subcategories, isLoading: isLoadingSubcategories } = useSubcategories()
  const { people, isLoading: isLoadingPeople } = usePeople()
  const { paymentMethods, isLoading: isLoadingPaymentMethods } = usePaymentMethods()
  const { buckets, isLoading: isLoadingBuckets } = useBuckets()
  const { banks, isLoading: isLoadingBanks } = useBanks()
  const { investmentBoxes, isLoading: isLoadingInvestmentBoxes } = useInvestmentBoxes()

  const [rows, setRows] = useState(() => expenses.map(expenseToRow))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [summary, setSummary] = useState(null)

  const isLoadingOptions =
    isLoadingCategories ||
    isLoadingPeople ||
    isLoadingPaymentMethods ||
    isLoadingBuckets ||
    isLoadingBanks ||
    isLoadingInvestmentBoxes ||
    isLoadingSubcategories

  const defaultInvestmentBoxId = useMemo(() => {
    const defaultBox = investmentBoxes.find((b) => b.is_default)
    return defaultBox ? String(defaultBox.id) : investmentBoxes[0] ? String(investmentBoxes[0].id) : ''
  }, [investmentBoxes])

  const lookups = { subcategories, people, paymentMethods, buckets, banks }

  const updateRow = (index, patch) => {
    setRows((current) =>
      current.map((row, i) => (i === index ? { ...row, ...patch, isDirty: true, status: 'idle', error: null } : row))
    )
  }

  // Unlike the bulk entry grid, pasting never adds rows — lines past the last selected expense are dropped.
  const applyPaste = (anchorRowIndex, anchorColumnKey, text) => {
    const anchorColIndex = EXPENSE_PASTE_COLUMNS.indexOf(anchorColumnKey)
    if (anchorColIndex === -1) return

    const lines = parseTsv(text)
    if (lines.length === 0) return

    setRows((current) => {
      const next = [...current]

      lines.forEach((cells, lineIndex) => {
        const targetRowIndex = anchorRowIndex + lineIndex
        if (targetRowIndex >= next.length) return

        let patch = {}
        cells.forEach((cellText, cellIndex) => {
          const columnKey = EXPENSE_PASTE_COLUMNS[anchorColIndex + cellIndex]
          if (!columnKey) return
          patch = { ...patch, ...parseExpenseCell(columnKey, cellText, lookups) }
        })

        next[targetRowIndex] = { ...next[targetRowIndex], ...patch, isDirty: true, status: 'idle', error: null }
      })

      return next
    })
  }

  const pasteHandler = (rowIndex, columnKey) => (e) => {
    const text = e.clipboardData.getData('text')
    if (isPlainExpenseCellPaste(columnKey, text)) return
    e.preventDefault()
    applyPaste(rowIndex, columnKey, text)
  }

  const dirtyRowCount = rows.filter((row) => row.isDirty).length

  const handleSubmit = () => {
    setError(null)
    setSummary(null)

    if (dirtyRowCount === 0) {
      setSummary('Nenhuma alteração para salvar.')
      return
    }

    const candidateIndices = []
    const payloadRows = []
    let hasInvalidRows = false

    const nextRows = rows.map((row, index) => {
      if (!row.isDirty) return row

      const resolved = {
        ...row,
        amountFormula: isAmountFormula(row.amount) ? row.amount : row.amountFormula,
        amount: resolveAmountInput(row.amount),
      }
      if (!isRowComplete(resolved, defaultInvestmentBoxId)) {
        hasInvalidRows = true
        return { ...resolved, status: 'error', error: 'Preencha os campos obrigatórios desta linha.' }
      }
      candidateIndices.push(index)
      payloadRows.push(buildRowPayload(resolved, subcategories, buckets, defaultInvestmentBoxId))
      return { ...resolved, status: 'idle', error: null }
    })

    setRows(nextRows)

    if (payloadRows.length === 0) return

    setIsSubmitting(true)

    updateExpensesBulk(payloadRows)
      .then(({ results, updated }) => {
        const updatedById = new Map(updated.map((expense) => [expense.id, expense]))
        const failedIndices = new Set()

        candidateIndices.forEach((originalIndex, i) => {
          if (!results[i]?.ok) failedIndices.add(originalIndex)
        })

        if (updated.length > 0) onExpensesUpdated(updated)

        if (failedIndices.size === 0 && !hasInvalidRows) {
          onDone()
          return
        }

        setRows((current) =>
          current.map((row, index) => {
            if (failedIndices.has(index)) {
              return { ...row, status: 'error', error: 'Não foi possível salvar esta linha. Verifique os dados.' }
            }
            const saved = updatedById.get(row.id)
            return saved ? expenseToRow(saved) : row
          })
        )

        setSummary(`${updated.length} de ${results.length} transações salvas.`)
      })
      .catch((err) => {
        console.error('Erro ao salvar transações em grade:', err)
        setError('Não foi possível salvar as alterações. Tente novamente.')
      })
      .finally(() => setIsSubmitting(false))
  }

  return (
    <div className="bulk-grid-form">
      {isLoadingOptions && <LoadingBar variant="dialog" />}

      <p className="bulk-grid-hint">
        Edite direto nas células — só as linhas alteradas (marcadas à esquerda) são salvas. Dá para colar do Excel na
        mesma ordem de colunas da inclusão em lote. Em compras parceladas, a alteração vale só para a parcela da linha.
      </p>
      <p className="bulk-grid-row-count">
        {dirtyRowCount} {dirtyRowCount === 1 ? 'linha alterada' : 'linhas alteradas'} de {rows.length}
      </p>

      <div className="bulk-grid-scroll">
        <fieldset className="bulk-grid-fieldset" disabled={isSubmitting}>
          <table className="bulk-grid">
            <thead>
              <tr>
                <th>Parc.</th>
                <th>Data</th>
                <th>Valor</th>
                <th>Método de pagamento</th>
                <th>Descrição</th>
                <th>Subcategoria</th>
                <th>Tipo</th>
                <th>Responsável</th>
                <th>Envelope</th>
                <th>Banco</th>
                <th>Caixinha</th>
                <th>Comentário</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => {
                const { expense } = row
                const needsInvestmentBox = rowNeedsInvestmentBox(row, buckets)
                const isSubcategoryDeleted =
                  !isLoadingSubcategories &&
                  Boolean(row.subcategoryId) &&
                  !subcategories.some((s) => String(s.id) === row.subcategoryId)
                const isInvestmentBoxDeleted =
                  !isLoadingInvestmentBoxes &&
                  Boolean(row.investmentBoxId) &&
                  !investmentBoxes.some((b) => String(b.id) === row.investmentBoxId)
                const rowClassName = [
                  row.isDirty && 'bulk-grid-row--dirty',
                  row.status === 'error' && 'bulk-grid-row--error',
                ]
                  .filter(Boolean)
                  .join(' ')

                return (
                  <tr key={row.id} className={rowClassName || undefined}>
                    <td className="bulk-grid-installment" title={row.error || undefined}>
                      {expense.installment_count ? `${expense.installment_number}/${expense.installment_count}` : '—'}
                    </td>
                    <td>
                      <DatePicker
                        value={row.date}
                        onChange={(e) => updateRow(index, { date: e.target.value })}
                        onPaste={pasteHandler(index, 'date')}
                      />
                    </td>
                    <td>
                      <AmountInput
                        value={row.amount}
                        formula={row.amountFormula}
                        ariaLabel="Valor"
                        onChange={(text) => updateRow(index, { amount: text })}
                        // Focus/blur only swap between formula and result, so they skip updateRow —
                        // tabbing through a row must not mark it as changed.
                        onFocus={() => {
                          if (row.amountFormula && row.amount !== row.amountFormula) {
                            setRows((current) =>
                              current.map((r, i) => (i === index ? { ...r, amount: r.amountFormula } : r))
                            )
                          }
                        }}
                        onBlur={(text) => {
                          setRows((current) =>
                            current.map((r, i) =>
                              i === index
                                ? { ...r, amountFormula: isAmountFormula(text) ? text : null, amount: resolveAmountInput(text) }
                                : r
                            )
                          )
                        }}
                        onPaste={pasteHandler(index, 'amount')}
                      />
                    </td>
                    <td>
                      <select
                        value={row.paymentMethodId}
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
                      <EmojiTextInput
                        type="text"
                        className="bulk-grid-description-input"
                        value={row.description}
                        placeholder="Descrição"
                        onChange={(text) => updateRow(index, { description: text })}
                        onPaste={pasteHandler(index, 'description')}
                      />
                    </td>
                    <td onPaste={pasteHandler(index, 'subcategoryId')}>
                      {isSubcategoryDeleted ? (
                        <input type="text" value={`${expense.subcategory_name} (excluída)`} disabled readOnly />
                      ) : (
                        <SubcategorySelect
                          categories={categories}
                          subcategories={subcategories}
                          value={row.subcategoryId}
                          onChange={(nextSubcategoryId, nextCategoryId) =>
                            updateRow(index, { subcategoryId: nextSubcategoryId, categoryId: nextCategoryId })
                          }
                        />
                      )}
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
                        value={row.personId}
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
                        value={row.bucketId}
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
                        value={row.bankId}
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
                      {isInvestmentBoxDeleted ? (
                        <input type="text" value={`${expense.investment_box_name} (excluída)`} disabled readOnly />
                      ) : (
                        <select
                          value={effectiveInvestmentBoxId(row, defaultInvestmentBoxId)}
                          onChange={(e) => updateRow(index, { investmentBoxId: e.target.value })}
                          disabled={!needsInvestmentBox || isLoadingInvestmentBoxes}
                        >
                          <option value="">Selecione…</option>
                          {investmentBoxes.map((b) => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td>
                      <EmojiTextInput
                        type="text"
                        value={row.comment}
                        placeholder="Opcional"
                        onChange={(text) => updateRow(index, { comment: text })}
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

      {error && <p className="form-error">{error}</p>}
      {summary && <p className="state-message" style={{ padding: 0, textAlign: 'left' }}>{summary}</p>}

      <div className="bulk-grid-actions">
        <button type="button" className="btn btn-primary" onClick={handleSubmit} disabled={isSubmitting || dirtyRowCount === 0}>
          {isSubmitting ? 'Salvando…' : 'Salvar alterações'}
        </button>
      </div>
    </div>
  )
}

export default ExpenseGridEditForm
