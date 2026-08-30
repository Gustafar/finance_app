import { useEffect, useState } from 'react'
import { fetchLatestPlanningMonth, fetchRecurringExpenses, replaceMonthPlanning } from '../api/recurringExpenses'
import { formatMonthLabel } from '../utils/date'
import { formatCurrency } from '../utils/format'
import { useVisibility } from '../hooks/useVisibility'
import RecurringFields from './RecurringFields'
import { emptyRecurringForm, isRecurringFormComplete, recurringFormFromRow, recurringFormToPayload } from '../utils/recurringForm'
import Modal from './Modal'

// The backend validates every draft row before saving and rejects the whole batch on the first
// invalid one (e.g. a row whose category/subcategory got deleted since it was originally created).
// Translate the raw sentinel error text into something the user can act on directly in the draft.
const SAVE_ERROR_MESSAGES = {
  'recurring expense description cannot be empty': 'Um item do rascunho está sem descrição — edite-o antes de salvar.',
  'amount cannot be negative': 'Um item do rascunho está com um valor inválido — edite-o antes de salvar.',
  'type must be income, expense or investment': 'Um item do rascunho está com um tipo inválido — edite-o antes de salvar.',
  'day of month must be between 1 and 31': 'Um item do rascunho está com o dia do mês inválido — edite-o antes de salvar.',
  'category cannot be empty': 'Um item do rascunho está sem categoria válida (pode ter sido removida) — edite-o antes de salvar.',
  'category not found': 'Um item do rascunho está com uma categoria que não existe mais — edite-o antes de salvar.',
  'subcategory cannot be empty': 'Um item do rascunho está sem subcategoria válida (pode ter sido removida) — edite-o antes de salvar.',
  'subcategory not found': 'Um item do rascunho está com uma subcategoria que não existe mais — edite-o antes de salvar.',
  'person cannot be empty': 'Um item do rascunho está sem responsável válido (pode ter sido removido) — edite-o antes de salvar.',
  'person not found': 'Um item do rascunho está com um responsável que não existe mais — edite-o antes de salvar.',
  'payment method cannot be empty': 'Um item do rascunho está sem método de pagamento válido — edite-o antes de salvar.',
  'payment method not found': 'Um item do rascunho está com um método de pagamento que não existe mais — edite-o antes de salvar.',
  'bucket cannot be empty': 'Um item do rascunho está sem envelope válido — edite-o antes de salvar.',
  'bucket not found': 'Um item do rascunho está com um envelope que não existe mais — edite-o antes de salvar.',
  'bank cannot be empty': 'Um item do rascunho está sem banco válido — edite-o antes de salvar.',
  'bank not found': 'Um item do rascunho está com um banco que não existe mais — edite-o antes de salvar.',
}

function saveErrorMessage(err) {
  return SAVE_ERROR_MESSAGES[err.serverMessage] ?? 'Não foi possível salvar o planejamento. Tente novamente.'
}

let nextDraftId = 1

function toDraftRow(row) {
  return { draftId: nextDraftId++, ...row }
}

function CopyPreviousPlanDialog({
  isOpen,
  onClose,
  selectedMonth,
  hasCurrentMonthData,
  categories,
  subcategories,
  people,
  paymentMethods,
  buckets,
  banks,
  onSaved,
}) {
  const { hidden } = useVisibility()
  const [loadState, setLoadState] = useState('loading')
  const [loadError, setLoadError] = useState(null)
  const [sourceMonth, setSourceMonth] = useState(null)
  const [draftRows, setDraftRows] = useState([])

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [addForm, setAddForm] = useState(emptyRecurringForm)
  const [addAttemptedSubmit, setAddAttemptedSubmit] = useState(false)

  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState(emptyRecurringForm)
  const [editAttemptedSubmit, setEditAttemptedSubmit] = useState(false)

  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)

  useEffect(() => {
    if (!isOpen) return

    // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting the dialog's state for the newly opened/changed month, before the fetch below settles
    setLoadState('loading')
    setLoadError(null)
    setSaveError(null)
    setIsAddOpen(false)
    setEditingId(null)

    fetchLatestPlanningMonth(selectedMonth.year, selectedMonth.month)
      .then(({ year, month }) => {
        setSourceMonth({ year, month })
        return fetchRecurringExpenses(year, month)
      })
      .then((rows) => {
        setDraftRows(rows.map(toDraftRow))
        setLoadState('ready')
      })
      .catch((err) => {
        if (err.status === 404) {
          setLoadState('empty')
          return
        }
        console.error('Erro ao carregar planejamento anterior:', err)
        setLoadError('Não foi possível carregar o planejamento anterior.')
        setLoadState('error')
      })
  }, [isOpen, selectedMonth.year, selectedMonth.month])

  const handleAdd = (e) => {
    e.preventDefault()
    setAddAttemptedSubmit(true)
    if (!isRecurringFormComplete(addForm)) return

    setDraftRows((prev) => [...prev, toDraftRow(recurringFormToPayload(addForm))])
    setAddForm(emptyRecurringForm)
    setAddAttemptedSubmit(false)
    setIsAddOpen(false)
  }

  const startEditing = (row) => {
    setEditingId(row.draftId)
    setEditForm(recurringFormFromRow(row))
    setEditAttemptedSubmit(false)
  }

  const handleSaveEdit = (draftId) => {
    setEditAttemptedSubmit(true)
    if (!isRecurringFormComplete(editForm)) return

    setDraftRows((prev) =>
      prev.map((row) => (row.draftId === draftId ? { draftId, ...recurringFormToPayload(editForm) } : row))
    )
    setEditingId(null)
  }

  const handleRemove = (draftId) => {
    setDraftRows((prev) => prev.filter((row) => row.draftId !== draftId))
  }

  const handleSave = () => {
    setSaveError(null)
    setIsSaving(true)

    const rows = draftRows.map((row) => {
      const payload = { ...row }
      delete payload.draftId
      return payload
    })
    replaceMonthPlanning(selectedMonth.year, selectedMonth.month, rows)
      .then((created) => {
        onSaved(created)
        onClose()
      })
      .catch((err) => {
        console.error('Erro ao salvar planejamento copiado:', err)
        setSaveError(saveErrorMessage(err))
      })
      .finally(() => setIsSaving(false))
  }

  return (
    <Modal isOpen={isOpen} onClose={isSaving ? () => {} : onClose} contentClassName="copy-plan-dialog">
      <h2 className="modal-title">Copiar planejamento anterior</h2>

      {loadState === 'loading' && <p className="state-message">Buscando o planejamento mais recente…</p>}
      {loadState === 'error' && <p className="state-message state-message--error">{loadError}</p>}
      {loadState === 'empty' && (
        <p className="state-message">Nenhum planejamento anterior encontrado para copiar.</p>
      )}

      {loadState === 'ready' && (
        <>
          <p className={`plan-copy-warning${hasCurrentMonthData ? ' plan-copy-warning--danger' : ''}`}>
            {hasCurrentMonthData
              ? `Isso vai substituir todo o planejamento de ${formatMonthLabel(selectedMonth)} e excluir as despesas geradas automaticamente por ele. Essa ação não pode ser desfeita.`
              : `Copiando o planejamento de ${formatMonthLabel(sourceMonth)} para ${formatMonthLabel(selectedMonth)}. Revise, ajuste o que quiser, e salve para confirmar.`}
          </p>

          <ul className="expense-list recurring-list copy-plan-list">
            {draftRows.map((row) => {
              const isEditing = editingId === row.draftId

              if (isEditing) {
                return (
                  <li className="entity-row entity-row--inline-edit" key={row.draftId}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <RecurringFields
                        idPrefix={`copy-edit-${row.draftId}`}
                        form={editForm}
                        onChange={setEditForm}
                        categories={categories}
                        subcategories={subcategories}
                        people={people}
                        paymentMethods={paymentMethods}
                        buckets={buckets}
                        banks={banks}
                        attemptedSubmit={editAttemptedSubmit}
                      />
                      {editAttemptedSubmit && !isRecurringFormComplete(editForm) && (
                        <p className="form-error">Preencha os campos destacados antes de continuar.</p>
                      )}
                      <div className="entity-actions">
                        <button type="button" className="btn btn-secondary" onClick={() => handleSaveEdit(row.draftId)}>
                          Confirmar
                        </button>
                        <button
                          type="button"
                          className="icon-btn"
                          onClick={() => setEditingId(null)}
                          aria-label="Cancelar edição"
                          title="Cancelar"
                        >
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </li>
                )
              }

              return (
                <li className="expense-row" key={row.draftId}>
                  <div className="expense-main">
                    <span className="expense-description" title={row.description}>{row.description}</span>
                    <span className="expense-date">
                      Todo dia {row.day_of_month}
                      {!row.include_in_expenses && ' · Somente planejamento'}
                    </span>
                  </div>
                  <span className="expense-amount">{formatCurrency(row.amount, hidden)}</span>
                  <div className="expense-actions">
                    <button
                      type="button"
                      className="icon-btn"
                      onClick={() => startEditing(row)}
                      aria-label="Editar item"
                      title="Editar"
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path
                          d="M11.333 2a1.2 1.2 0 0 1 1.697 1.697l-7.03 7.03-2.333.637.636-2.334z"
                          stroke="currentColor"
                          strokeWidth="1.3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className="icon-btn icon-btn--danger"
                      onClick={() => handleRemove(row.draftId)}
                      aria-label="Remover item"
                      title="Remover"
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path
                          d="M3 4.5h10M6.5 4.5V3a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v1.5m-6.5 0 .6 8.1a1 1 0 0 0 1 .9h4.8a1 1 0 0 0 1-.9l.6-8.1"
                          stroke="currentColor"
                          strokeWidth="1.3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>
                </li>
              )
            })}
            {draftRows.length === 0 && <p className="state-message">Nenhum item no rascunho — adicione um item abaixo.</p>}
          </ul>

          {isAddOpen ? (
            <form className="expense-form" onSubmit={handleAdd} style={{ width: 'auto', marginTop: 16 }}>
              <RecurringFields
                idPrefix="copy-add"
                form={addForm}
                onChange={setAddForm}
                categories={categories}
                subcategories={subcategories}
                people={people}
                paymentMethods={paymentMethods}
                buckets={buckets}
                banks={banks}
                attemptedSubmit={addAttemptedSubmit}
              />
              {addAttemptedSubmit && !isRecurringFormComplete(addForm) && (
                <p className="form-error">Preencha os campos destacados antes de continuar.</p>
              )}
              <div className="entity-actions">
                <button type="submit" className="btn btn-primary">Adicionar ao rascunho</button>
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddOpen(false)}>Cancelar</button>
              </div>
            </form>
          ) : (
            <button type="button" className="btn btn-secondary" style={{ marginTop: 16 }} onClick={() => setIsAddOpen(true)}>
              + Adicionar item
            </button>
          )}

          {saveError && <p className="form-error">{saveError}</p>}

          <div className="confirm-dialog-actions" style={{ marginTop: 24 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSaving}>
              Cancelar
            </button>
            <button type="button" className="btn btn-primary" onClick={handleSave} disabled={isSaving || draftRows.length === 0}>
              {isSaving ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        </>
      )}
    </Modal>
  )
}

export default CopyPreviousPlanDialog
