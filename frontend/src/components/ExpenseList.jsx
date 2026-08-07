import { formatCurrency, formatDate } from '../utils/format'
import { paletteColor } from '../utils/categoryColor'
import { TRANSACTION_TYPE_AMOUNT_STYLE } from '../utils/transactionTypes'

function ExpenseList({ expenses, onDelete, onEdit }) {
  const sorted = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date))

  return (
    <ul className="expense-list">
      {sorted.map((expense) => {
        const categoryColor = paletteColor(expense.category_color)
        const personColor = paletteColor(expense.person_color)
        const paymentMethodColor = paletteColor(expense.payment_method_color)
        const caixinhaColor = paletteColor(expense.caixinha_color)
        const amountConfig = TRANSACTION_TYPE_AMOUNT_STYLE[expense.type] ?? TRANSACTION_TYPE_AMOUNT_STYLE.expense
        return (
          <li className="expense-row" key={expense.id}>
            <div className="expense-badges">
              <span
                className="badge badge--category"
                style={{ background: categoryColor.bg, color: categoryColor.text }}
              >
                {expense.category_name}
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
                className="badge badge--caixinha"
                style={{ background: caixinhaColor.bg, color: caixinhaColor.text }}
              >
                {expense.caixinha_name}
              </span>
            </div>

            <div className="expense-main">
              <span className="expense-description" title={expense.description}>{expense.description}</span>
              <span className="expense-date">{formatDate(expense.date)}</span>
              {expense.installment_count && (
                <span className="installment-note">
                  Parcela {expense.installment_number}/{expense.installment_count} · Compra de{' '}
                  {formatCurrency(expense.purchase_total_amount)} em {formatDate(expense.purchase_date)}
                </span>
              )}
              {expense.recurring_expense_id && <span className="installment-note">Fixo</span>}
            </div>

            <span className={`expense-amount ${amountConfig.className}`}>
              {amountConfig.prefix}
              {formatCurrency(expense.amount)}
            </span>

            <div className="expense-actions">
              <button
                type="button"
                className="icon-btn"
                onClick={() => onEdit(expense)}
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
                onClick={() => onDelete(expense.id)}
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
            </div>
          </li>
        )
      })}
    </ul>
  )
}

export default ExpenseList
