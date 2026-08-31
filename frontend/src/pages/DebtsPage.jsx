import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import SummaryCard from '../components/SummaryCard'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import DebtForm from '../components/DebtForm'
import DebtPaymentForm from '../components/DebtPaymentForm'
import { useDebts } from '../hooks/useDebts'
import { useVisibility } from '../hooks/useVisibility'
import { deleteDebt, deleteDebtPayment } from '../api/debts'
import { formatCurrency, formatDate } from '../utils/format'

const DIRECTION_TABS = [
  { value: 'receivable', label: 'A receber' },
  { value: 'payable', label: 'A pagar' },
]

const isSettled = (debt) => debt.outstanding <= 0.005

function DebtsPage() {
  const { debts, setDebts, isLoading, error } = useDebts()
  const { hidden } = useVisibility()

  const [direction, setDirection] = useState('receivable')
  const [showSettled, setShowSettled] = useState(false)
  const [expandedIds, setExpandedIds] = useState(() => new Set())

  const [formState, setFormState] = useState(null) // { debt } | { debt: null }
  const [payingDebt, setPayingDebt] = useState(null)
  const [pendingDeleteDebt, setPendingDeleteDebt] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const knownNames = useMemo(
    () => [...new Set(debts.map((d) => d.counterparty_name))].sort((a, b) => a.localeCompare(b, 'pt-BR')),
    [debts]
  )

  const totals = useMemo(() => {
    const acc = { receivable: 0, payable: 0 }
    debts.forEach((d) => {
      if (d.outstanding > 0) acc[d.direction] += d.outstanding
    })
    return acc
  }, [debts])

  const groups = useMemo(() => {
    const visible = debts
      .filter((d) => d.direction === direction)
      .filter((d) => showSettled || !isSettled(d))

    const byName = new Map()
    visible.forEach((debt) => {
      if (!byName.has(debt.counterparty_name)) byName.set(debt.counterparty_name, [])
      byName.get(debt.counterparty_name).push(debt)
    })

    return [...byName.entries()]
      .map(([name, items]) => ({
        name,
        items,
        outstanding: items.reduce((sum, d) => sum + Math.max(d.outstanding, 0), 0),
      }))
      .sort((a, b) => b.outstanding - a.outstanding || a.name.localeCompare(b.name, 'pt-BR'))
  }, [debts, direction, showSettled])

  const toggleExpanded = (id) => {
    setExpandedIds((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const upsertDebt = (saved) => {
    setDebts((prev) => {
      const exists = prev.some((d) => d.id === saved.id)
      return exists ? prev.map((d) => (d.id === saved.id ? saved : d)) : [saved, ...prev]
    })
  }

  const handleDeleteDebt = () => {
    setIsProcessing(true)
    deleteDebt(pendingDeleteDebt.id)
      .then(() => setDebts((prev) => prev.filter((d) => d.id !== pendingDeleteDebt.id)))
      .catch((err) => console.error('Erro ao excluir cobrança:', err))
      .finally(() => {
        setIsProcessing(false)
        setPendingDeleteDebt(null)
      })
  }

  const handleDeletePayment = (debtId, paymentId) => {
    deleteDebtPayment(debtId, paymentId)
      .then((updated) => upsertDebt(updated))
      .catch((err) => console.error('Erro ao excluir pagamento:', err))
  }

  const noun = direction === 'receivable' ? 'a receber' : 'a pagar'

  return (
    <main className="container">
      <div className="page-header">
        <Link to="/" className="icon-btn" aria-label="Voltar" title="Voltar">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3 5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <h1>Cobranças</h1>
      </div>

      {isLoading && <p className="state-message">Carregando…</p>}
      {!isLoading && error && <p className="state-message state-message--error">{error}</p>}

      {!isLoading && !error && (
        <>
          <section className="summary-grid">
            <SummaryCard label="Total a receber" value={formatCurrency(totals.receivable, hidden)} tone="income" />
            <SummaryCard label="Total a pagar" value={formatCurrency(totals.payable, hidden)} tone="expense" />
          </section>

          <div className="type-toggle" role="tablist" aria-label="Sentido da cobrança" style={{ marginBottom: 16 }}>
            {DIRECTION_TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                role="tab"
                aria-selected={direction === tab.value}
                className={`type-toggle-option${direction === tab.value ? ' type-toggle-option--selected' : ''}`}
                onClick={() => setDirection(tab.value)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <section className="panel">
            <div className="panel-header panel-header--actions">
              <h2>{direction === 'receivable' ? 'Quem está devendo' : 'Para quem devemos'}</h2>
              <div className="panel-header-actions-group">
                <label className="checkbox-field checkbox-field--compact" htmlFor="show-settled">
                  <input
                    id="show-settled"
                    type="checkbox"
                    checked={showSettled}
                    onChange={(e) => setShowSettled(e.target.checked)}
                  />
                  Mostrar quitadas
                </label>
                <button type="button" className="btn btn-primary btn-sm" onClick={() => setFormState({ debt: null })}>
                  + Nova cobrança
                </button>
              </div>
            </div>

            {groups.length === 0 && (
              <p className="state-message">Nenhuma dívida {noun} no momento.</p>
            )}

            {groups.length > 0 && (
              <div className="investment-box-grid">
                {groups.map((group) => (
                  <div className="investment-box-card" key={group.name}>
                    <span className="badge">{group.name}</span>

                    <ul className="investment-box-history">
                      {group.items.map((debt) => {
                        const settled = isSettled(debt)
                        const isExpanded = expandedIds.has(debt.id)
                        return (
                          <li key={debt.id} className="debt-item">
                            <div className="investment-box-history-row">
                              <div className="investment-box-history-main">
                                <span className="expense-description" title={debt.description}>
                                  {debt.description}
                                </span>
                                <span className="expense-date">
                                  {settled && 'Quitada · '}
                                  {formatDate(debt.incurred_on)}
                                  {debt.due_date && ` · vence ${formatDate(debt.due_date)}`}
                                  {debt.comment && ` · ${debt.comment}`}
                                </span>
                              </div>
                              <span className={`expense-amount ${settled ? '' : 'expense-amount--expense'}`}>
                                {formatCurrency(settled ? debt.amount : debt.outstanding, hidden)}
                              </span>
                            </div>

                            <div className="debt-item-actions">
                              {!settled && (
                                <button
                                  type="button"
                                  className="btn btn-secondary btn-sm"
                                  onClick={() => setPayingDebt(debt)}
                                >
                                  Registrar pagamento
                                </button>
                              )}
                              {debt.payments.length > 0 && (
                                <button
                                  type="button"
                                  className="btn btn-secondary btn-sm"
                                  onClick={() => toggleExpanded(debt.id)}
                                >
                                  {isExpanded ? 'Ocultar pagamentos' : `Pagamentos (${debt.payments.length})`}
                                </button>
                              )}
                              <button
                                type="button"
                                className="icon-btn"
                                onClick={() => setFormState({ debt })}
                                aria-label="Editar cobrança"
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
                                onClick={() => setPendingDeleteDebt(debt)}
                                aria-label="Excluir cobrança"
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

                            {isExpanded && debt.payments.length > 0 && (
                              <ul className="debt-payments">
                                {debt.payments.map((payment) => (
                                  <li className="debt-payment-row" key={payment.id}>
                                    <span className="expense-date">
                                      {formatDate(payment.paid_on)}
                                      {payment.comment && ` · ${payment.comment}`}
                                    </span>
                                    <span className="expense-amount expense-amount--income">
                                      {formatCurrency(payment.amount, hidden)}
                                    </span>
                                    <button
                                      type="button"
                                      className="icon-btn icon-btn--danger"
                                      onClick={() => handleDeletePayment(debt.id, payment.id)}
                                      aria-label="Excluir pagamento"
                                      title="Excluir pagamento"
                                    >
                                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                                        <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                                      </svg>
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      <Modal isOpen={formState !== null} onClose={() => setFormState(null)}>
        {formState && (
          <DebtForm
            debt={formState.debt}
            defaultDirection={direction}
            knownNames={knownNames}
            onSaved={(saved) => {
              upsertDebt(saved)
              setFormState(null)
            }}
            onCancel={() => setFormState(null)}
          />
        )}
      </Modal>

      <Modal isOpen={payingDebt !== null} onClose={() => setPayingDebt(null)}>
        {payingDebt && (
          <DebtPaymentForm
            debt={payingDebt}
            onSaved={(updated) => {
              upsertDebt(updated)
              setPayingDebt(null)
            }}
            onCancel={() => setPayingDebt(null)}
          />
        )}
      </Modal>

      <ConfirmDialog
        isOpen={pendingDeleteDebt !== null}
        title="Excluir cobrança"
        message="Tem certeza que deseja excluir esta cobrança e todo o seu histórico de pagamentos? Essa ação não pode ser desfeita."
        confirmLabel="Excluir"
        danger
        isConfirming={isProcessing}
        onConfirm={handleDeleteDebt}
        onCancel={() => setPendingDeleteDebt(null)}
      />
    </main>
  )
}

export default DebtsPage
