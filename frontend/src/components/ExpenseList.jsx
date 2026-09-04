import { useState } from 'react'
import { formatCurrency, formatDate } from '../utils/format'
import { paletteColor } from '../utils/categoryColor'
import { TRANSACTION_TYPE_AMOUNT_STYLE } from '../utils/transactionTypes'
import { useVisibility } from '../hooks/useVisibility'
import ConfirmDialog from './ConfirmDialog'
import InstallmentScopeDialog from './InstallmentScopeDialog'
import SelectionToolbar from './SelectionToolbar'

function ExpenseList({ expenses, onDelete, onEdit, isSelecting, selectedIds, toggleId, toggleSelecting }) {
  const sorted = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date))
  const { hidden } = useVisibility()
  const [pendingDeleteExpense, setPendingDeleteExpense] = useState(null)
  const [expandedIds, setExpandedIds] = useState(() => new Set())
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const toggleExpanded = (id) => {
    setExpandedIds((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <>
      <SelectionToolbar
        isSelecting={isSelecting}
        count={selectedIds.size}
        onToggle={toggleSelecting}
        onDeleteClick={() => setIsBulkDeleteOpen(true)}
        panel
        hideIdle
        hideCancel
      />

      <ul className="expense-list">
        {sorted.map((expense) => {
          const categoryColor = paletteColor(expense.category_color)
          const personColor = paletteColor(expense.person_color)
          const paymentMethodColor = paletteColor(expense.payment_method_color)
          const bucketColor = paletteColor(expense.bucket_color)
          const bankColor = paletteColor(expense.bank_color)
          const amountConfig = TRANSACTION_TYPE_AMOUNT_STYLE[expense.type] ?? TRANSACTION_TYPE_AMOUNT_STYLE.expense
          const isExpanded = expandedIds.has(expense.id)
          const isSelected = selectedIds.has(expense.id)
          return (
            <li
              className={`expense-row${isExpanded ? ' expense-row--expanded' : ''}${isSelected ? ' expense-row--selected' : ''}`}
              key={expense.id}
              onClick={() => (isSelecting ? toggleId(expense.id) : toggleExpanded(expense.id))}
            >
              <div className="expense-badges expense-badges--grouped">
                <span
                  className="badge badge--category"
                  style={{ background: categoryColor.bg, color: categoryColor.text }}
                >
                  {expense.subcategory_name || expense.category_name}
                </span>

                <span
                  className="badge badge--person"
                  style={{ background: personColor.bg, color: personColor.text }}
                >
                  {expense.person_name}
                </span>

                <span
                  className="badge badge--payment"
                  style={{ background: paymentMethodColor.bg, color: paymentMethodColor.text }}
                >
                  {expense.payment_method_name}
                </span>

                <span
                  className="badge badge--bucket"
                  style={{ background: bucketColor.bg, color: bucketColor.text }}
                >
                  {expense.bucket_name}
                </span>

                <span
                  className="badge badge--bank"
                  style={{ background: bankColor.bg, color: bankColor.text }}
                >
                  {expense.bank_name}
                </span>
              </div>

              <div className="expense-main">
                <span className="expense-description" title={expense.description}>{expense.description}</span>
                {expense.comment && (
                  <span className="expense-comment" title={expense.comment}>{expense.comment}</span>
                )}
                <span className="expense-date">{formatDate(expense.date)}</span>
                {expense.installment_count && (
                  <span className="installment-note">
                    <svg width="11" height="11" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <rect x="1.5" y="3.5" width="13" height="9" rx="1.3" stroke="currentColor" strokeWidth="1.3" />
                      <path d="M1.5 6.5h13" stroke="currentColor" strokeWidth="1.3" />
                    </svg>
                    Parcela {expense.installment_number}/{expense.installment_count} · Compra de{' '}
                    {formatCurrency(expense.purchase_total_amount, hidden)} em {formatDate(expense.purchase_date)}
                  </span>
                )}
                {expense.recurring_expense_id && <span className="installment-note">Fixo</span>}
              </div>

              <div className="expense-amount-group">
                <span className={`expense-amount ${amountConfig.className}`}>
                  {amountConfig.prefix}
                  {formatCurrency(expense.amount, hidden)}
                  {expense.amount_formula && (
                    <span
                      className="expense-amount-formula-badge"
                      title={expense.amount_formula}
                      onClick={(e) => {
                        e.stopPropagation()
                        onEdit(expense)
                      }}
                      aria-label={`Valor calculado por fórmula: ${expense.amount_formula}`}
                    >
                      ƒ
                    </span>
                  )}
                </span>
                {expense.installment_count && (
                  <span className="expense-amount-total">
                    Total {formatCurrency(expense.purchase_total_amount, hidden)}
                  </span>
                )}
              </div>

              <div className="expense-actions">
                {isSelecting ? (
                  <input
                    type="checkbox"
                    className="select-checkbox"
                    checked={isSelected}
                    onClick={(e) => e.stopPropagation()}
                    onChange={() => toggleId(expense.id)}
                    aria-label="Selecionar transação"
                  />
                ) : (
                  <>
                    <button
                      type="button"
                      className="icon-btn"
                      onClick={(e) => {
                        e.stopPropagation()
                        onEdit(expense)
                      }}
                      aria-label="Editar despesa"
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
                      onClick={(e) => {
                        e.stopPropagation()
                        setPendingDeleteExpense(expense)
                      }}
                      aria-label="Excluir despesa"
                      title="Excluir"
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
                  </>
                )}
              </div>
            </li>
          )
        })}
      </ul>

      {pendingDeleteExpense?.installment_purchase_id ? (
        <InstallmentScopeDialog
          isOpen={pendingDeleteExpense !== null}
          title="Excluir transação"
          message="Esta transação faz parte de uma compra parcelada. O que deseja excluir? Essa ação não pode ser desfeita."
          confirmLabel="Excluir"
          danger
          isConfirming={isDeleting}
          onConfirm={(scope) => {
            setIsDeleting(true)
            onDelete(pendingDeleteExpense.id, scope).finally(() => {
              setIsDeleting(false)
              setPendingDeleteExpense(null)
            })
          }}
          onCancel={() => setPendingDeleteExpense(null)}
        />
      ) : (
        <ConfirmDialog
          isOpen={pendingDeleteExpense !== null}
          title="Excluir transação"
          message="Tem certeza que deseja excluir esta transação? Essa ação não pode ser desfeita."
          confirmLabel="Excluir"
          danger
          isConfirming={isDeleting}
          onConfirm={() => {
            setIsDeleting(true)
            onDelete(pendingDeleteExpense.id).finally(() => {
              setIsDeleting(false)
              setPendingDeleteExpense(null)
            })
          }}
          onCancel={() => setPendingDeleteExpense(null)}
        />
      )}

      <ConfirmDialog
        isOpen={isBulkDeleteOpen}
        title="Excluir transações"
        message={`Tem certeza que deseja excluir ${selectedIds.size} transaç${selectedIds.size === 1 ? 'ão' : 'ões'}? Essa ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        danger
        isConfirming={isDeleting}
        onConfirm={() => {
          setIsDeleting(true)
          Promise.all([...selectedIds].map((id) => onDelete(id))).finally(() => {
            setIsDeleting(false)
            setIsBulkDeleteOpen(false)
            toggleSelecting()
          })
        }}
        onCancel={() => setIsBulkDeleteOpen(false)}
      />
    </>
  )
}

export default ExpenseList
