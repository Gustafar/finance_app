import { useState } from 'react'
import Modal from './Modal'
import ExpenseForm from './ExpenseForm'
import ExpenseBulkForm from './ExpenseBulkForm'

function AddExpenseModal({ isOpen, onClose, onExpenseCreated, onExpensesCreated }) {
  const [mode, setMode] = useState('single')

  const handleClose = () => {
    onClose()
    setMode('single')
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} contentClassName={mode === 'bulk' ? 'modal-content--scrollable-body' : undefined}>
      <h2 className="modal-title">Nova despesa</h2>

      <div className="type-toggle add-expense-tabs" role="tablist" aria-label="Modo de lançamento">
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'single'}
          className={`type-toggle-option${mode === 'single' ? ' type-toggle-option--selected' : ''}`}
          onClick={() => setMode('single')}
        >
          Transação única
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'bulk'}
          className={`type-toggle-option${mode === 'bulk' ? ' type-toggle-option--selected' : ''}`}
          onClick={() => setMode('bulk')}
        >
          Múltiplas transações
        </button>
      </div>

      {mode === 'single' ? (
        <ExpenseForm onExpenseCreated={onExpenseCreated} />
      ) : (
        <ExpenseBulkForm onExpensesCreated={onExpensesCreated} />
      )}
    </Modal>
  )
}

export default AddExpenseModal
