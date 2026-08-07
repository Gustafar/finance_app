import { useState, useEffect, useMemo } from 'react'
import { Routes, Route, Link, useLocation } from 'react-router-dom'
import ExpenseForm from './components/ExpenseForm'
import ExpenseEditForm from './components/ExpenseEditForm'
import Modal from './components/Modal'
import CategoryManager from './components/CategoryManager'
import PersonManager from './components/PersonManager'
import PaymentMethodManager from './components/PaymentMethodManager'
import BucketManager from './components/BucketManager'
import BankManager from './components/BankManager'
import DashboardPage from './pages/DashboardPage'
import RecurringExpensesPage from './pages/RecurringExpensesPage'
import { fetchExpenses, deleteExpense } from './api/expenses'
import { generateDueRecurringExpenses } from './api/recurringExpenses'
import { currentYearMonth, sameYearMonth, shiftMonth } from './utils/date'
import './App.css'

function App() {
  const [expenses, setExpenses] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [editingExpense, setEditingExpense] = useState(null)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false)
  const [isPeopleOpen, setIsPeopleOpen] = useState(false)
  const [isPaymentMethodsOpen, setIsPaymentMethodsOpen] = useState(false)
  const [isBucketsOpen, setIsBucketsOpen] = useState(false)
  const [isBanksOpen, setIsBanksOpen] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(currentYearMonth)
  const location = useLocation()

  useEffect(() => {
    generateDueRecurringExpenses()
      .catch((error) => console.error('Erro ao gerar gastos fixos:', error))
      .finally(() => {
        fetchExpenses()
          .then(setExpenses)
          .catch((error) => {
            console.error('Erro ao buscar despesas:', error)
            setLoadError('Não foi possível carregar as despesas.')
          })
          .finally(() => setIsLoading(false))
      })
  }, [])

  const handleExpenseCreated = (created) => {
    const newExpenses = Array.isArray(created) ? created : [created]
    setExpenses((prevExpenses) => [...prevExpenses, ...newExpenses])
    setIsAddOpen(false)
  }

  const handleDelete = (id) => {
    deleteExpense(id)
      .then(() => {
        setExpenses((prevExpenses) => prevExpenses.filter((expense) => expense.id !== id))
      })
      .catch((error) => console.error('Erro ao excluir despesa:', error))
  }

  const handleExpenseUpdated = (updatedExpense) => {
    setExpenses((prevExpenses) =>
      prevExpenses.map((expense) =>
        expense.id === updatedExpense.id ? updatedExpense : expense
      )
    )
    setEditingExpense(null)
  }

  const monthExpenses = useMemo(
    () => expenses.filter((expense) => sameYearMonth(expense.date, selectedMonth)),
    [expenses, selectedMonth]
  )

  const summary = useMemo(() => {
    const totalByType = (type) =>
      monthExpenses.filter((expense) => expense.type === type).reduce((sum, expense) => sum + expense.amount, 0)

    const totalsByCategory = monthExpenses
      .filter((expense) => expense.type === 'expense')
      .reduce((acc, expense) => {
        acc[expense.category_name] = (acc[expense.category_name] ?? 0) + expense.amount
        return acc
      }, {})

    const topCategory = Object.entries(totalsByCategory).sort((a, b) => b[1] - a[1])[0]

    return {
      totalExpense: totalByType('expense'),
      totalIncome: totalByType('income'),
      totalInvestment: totalByType('investment'),
      count: monthExpenses.length,
      topCategory: topCategory ? topCategory[0] : '—',
      topCategoryAmount: topCategory ? topCategory[1] : 0,
    }
  }, [monthExpenses])

  return (
    <div className="page">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">R$</span>
          <span>Minhas Finanças</span>
        </div>
        <div className="topbar-actions">
          <button
            type="button"
            className="icon-btn icon-btn--header"
            onClick={() => setIsCategoriesOpen(true)}
            aria-label="Categorias"
            title="Categorias"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M8.5 2h4A1.5 1.5 0 0 1 14 3.5v4a1.5 1.5 0 0 1-.44 1.06l-5.5 5.5a1.5 1.5 0 0 1-2.12 0l-3.5-3.5a1.5 1.5 0 0 1 0-2.12l5.5-5.5A1.5 1.5 0 0 1 8.5 2Z"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinejoin="round"
              />
              <circle cx="10.5" cy="5.5" r="0.9" fill="currentColor" />
            </svg>
          </button>
          <button
            type="button"
            className="icon-btn icon-btn--header"
            onClick={() => setIsPeopleOpen(true)}
            aria-label="Responsáveis"
            title="Responsáveis"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="5.3" r="2.6" stroke="currentColor" strokeWidth="1.3" />
              <path
                d="M2.8 13.5c0-2.6 2.3-4.3 5.2-4.3s5.2 1.7 5.2 4.3"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <button
            type="button"
            className="icon-btn icon-btn--header"
            onClick={() => setIsPaymentMethodsOpen(true)}
            aria-label="Métodos de pagamento"
            title="Métodos de pagamento"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="1.5" y="3.5" width="13" height="9" rx="1.3" stroke="currentColor" strokeWidth="1.3" />
              <path d="M1.5 6.5h13" stroke="currentColor" strokeWidth="1.3" />
              <path d="M3.5 10h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
          </button>
          <button
            type="button"
            className="icon-btn icon-btn--header"
            onClick={() => setIsBucketsOpen(true)}
            aria-label="Envelopes"
            title="Envelopes"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M1.5 5.5 8 2l6.5 3.5-6.5 3.5-6.5-3.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
              <path d="M1.5 5.5V11L8 14.5V9" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
              <path d="M14.5 5.5V11L8 14.5" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            className="icon-btn icon-btn--header"
            onClick={() => setIsBanksOpen(true)}
            aria-label="Bancos"
            title="Bancos"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M1.5 5.5 8 1.5l6.5 4M2.3 5.5V13M5.4 5.5V13M8 5.5V13M10.6 5.5V13M13.7 5.5V13M1.5 13h13"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <Link
            to="/gastos-fixos"
            className={`icon-btn icon-btn--header${location.pathname === '/gastos-fixos' ? ' icon-btn--active' : ''}`}
            aria-label="Gastos fixos"
            title="Gastos fixos"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M8 1.5v2M8 12.5v2M2.5 8h2M11.5 8h2M4.2 4.2l1.4 1.4M10.4 10.4l1.4 1.4M4.2 11.8l1.4-1.4M10.4 5.6l1.4-1.4"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
              />
              <circle cx="8" cy="8" r="2.3" stroke="currentColor" strokeWidth="1.3" />
            </svg>
          </Link>
          <button type="button" className="btn btn-primary" onClick={() => setIsAddOpen(true)}>
            + Nova despesa
          </button>
        </div>
      </header>

      <Routes>
        <Route
          path="/"
          element={
            <DashboardPage
              selectedMonth={selectedMonth}
              onShiftMonth={(delta) => setSelectedMonth((month) => shiftMonth(month, delta))}
              summary={summary}
              isLoading={isLoading}
              loadError={loadError}
              expenses={expenses}
              monthExpenses={monthExpenses}
              onAddClick={() => setIsAddOpen(true)}
              onEditExpense={setEditingExpense}
              onDeleteExpense={handleDelete}
            />
          }
        />
        <Route path="/gastos-fixos" element={<RecurringExpensesPage />} />
      </Routes>

      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)}>
        <ExpenseForm onExpenseCreated={handleExpenseCreated} />
      </Modal>

      <Modal isOpen={editingExpense !== null} onClose={() => setEditingExpense(null)}>
        {editingExpense && (
          <ExpenseEditForm expense={editingExpense} onExpenseUpdated={handleExpenseUpdated} />
        )}
      </Modal>

      <Modal isOpen={isCategoriesOpen} onClose={() => setIsCategoriesOpen(false)}>
        <CategoryManager />
      </Modal>

      <Modal isOpen={isPeopleOpen} onClose={() => setIsPeopleOpen(false)}>
        <PersonManager />
      </Modal>

      <Modal isOpen={isPaymentMethodsOpen} onClose={() => setIsPaymentMethodsOpen(false)}>
        <PaymentMethodManager />
      </Modal>

      <Modal isOpen={isBucketsOpen} onClose={() => setIsBucketsOpen(false)}>
        <BucketManager />
      </Modal>

      <Modal isOpen={isBanksOpen} onClose={() => setIsBanksOpen(false)}>
        <BankManager />
      </Modal>
    </div>
  )
}

export default App
