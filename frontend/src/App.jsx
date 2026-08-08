import { useState, useEffect, useMemo, lazy, Suspense } from 'react'
import { Routes, Route, Link, useLocation } from 'react-router-dom'
import ExpenseForm from './components/ExpenseForm'
import ExpenseEditForm from './components/ExpenseEditForm'
import Modal from './components/Modal'
import Drawer from './components/Drawer'
import LoadingBar from './components/LoadingBar'
import CategoryManager from './components/CategoryManager'
import PersonManager from './components/PersonManager'
import PaymentMethodManager from './components/PaymentMethodManager'
import BucketManager from './components/BucketManager'
import BankManager from './components/BankManager'
import DashboardPage from './pages/DashboardPage'
import RecurringExpensesPage from './pages/RecurringExpensesPage'
import InvestmentsPage from './pages/InvestmentsPage'
import { fetchExpenses, deleteExpense } from './api/expenses'
import { generateDueRecurringExpenses } from './api/recurringExpenses'
import { fetchCategories } from './api/categories'
import { fetchPeople } from './api/people'
import { fetchPaymentMethods } from './api/paymentMethods'
import { fetchBuckets } from './api/buckets'
import { fetchBanks } from './api/banks'
import { currentYearMonth, sameYearMonth, shiftMonth } from './utils/date'
import './App.css'

const ChartsPage = lazy(() => import('./pages/ChartsPage'))

const EMPTY_FILTERS = {
  categoryId: '',
  personId: '',
  paymentMethodId: '',
  bucketId: '',
  bankId: '',
  dateFrom: '',
  dateTo: '',
}

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
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(currentYearMonth)
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [categories, setCategories] = useState([])
  const [people, setPeople] = useState([])
  const [paymentMethods, setPaymentMethods] = useState([])
  const [buckets, setBuckets] = useState([])
  const [banks, setBanks] = useState([])
  const location = useLocation()

  const loadExpenses = () => {
    return fetchExpenses()
      .then(setExpenses)
      .catch((error) => {
        console.error('Erro ao buscar despesas:', error)
        setLoadError('Não foi possível carregar as despesas.')
      })
  }

  useEffect(() => {
    generateDueRecurringExpenses()
      .catch((error) => console.error('Erro ao gerar gastos fixos:', error))
      .finally(() => {
        loadExpenses().finally(() => setIsLoading(false))
      })

    fetchCategories().then(setCategories).catch((error) => console.error('Erro ao buscar categorias:', error))
    fetchPeople().then(setPeople).catch((error) => console.error('Erro ao buscar responsáveis:', error))
    fetchPaymentMethods()
      .then(setPaymentMethods)
      .catch((error) => console.error('Erro ao buscar métodos de pagamento:', error))
    fetchBuckets().then(setBuckets).catch((error) => console.error('Erro ao buscar envelopes:', error))
    fetchBanks().then(setBanks).catch((error) => console.error('Erro ao buscar bancos:', error))
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

  const hasPeriodFilter = Boolean(filters.dateFrom || filters.dateTo)

  const monthExpenses = useMemo(() => {
    if (hasPeriodFilter) {
      return expenses.filter((expense) => {
        const date = expense.date.slice(0, 10)
        if (filters.dateFrom && date < filters.dateFrom) return false
        if (filters.dateTo && date > filters.dateTo) return false
        return true
      })
    }
    return expenses.filter((expense) => sameYearMonth(expense.date, selectedMonth))
  }, [expenses, selectedMonth, hasPeriodFilter, filters.dateFrom, filters.dateTo])

  const filteredExpenses = useMemo(
    () =>
      monthExpenses.filter(
        (expense) =>
          (!filters.categoryId || expense.category_id === Number(filters.categoryId)) &&
          (!filters.personId || expense.person_id === Number(filters.personId)) &&
          (!filters.paymentMethodId || expense.payment_method_id === Number(filters.paymentMethodId)) &&
          (!filters.bucketId || expense.bucket_id === Number(filters.bucketId)) &&
          (!filters.bankId || expense.bank_id === Number(filters.bankId))
      ),
    [monthExpenses, filters.categoryId, filters.personId, filters.paymentMethodId, filters.bucketId, filters.bankId]
  )

  const summary = useMemo(() => {
    const totalByType = (type) =>
      filteredExpenses.filter((expense) => expense.type === type).reduce((sum, expense) => sum + expense.amount, 0)

    const totalsByCategory = filteredExpenses
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
      count: filteredExpenses.length,
      topCategory: topCategory ? topCategory[0] : '—',
      topCategoryAmount: topCategory ? topCategory[1] : 0,
    }
  }, [filteredExpenses])

  return (
    <div className="page">
      {isLoading && <LoadingBar />}

      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">R$</span>
          <span>Minhas Finanças</span>
        </div>
        <div className="topbar-actions">
          <div className="topbar-actions-full">
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
            <Link
              to="/graficos"
              className={`icon-btn icon-btn--header${location.pathname === '/graficos' ? ' icon-btn--active' : ''}`}
              aria-label="Gráficos"
              title="Gráficos"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2.5 13.5v-6M7 13.5V2.5M11.5 13.5V7.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
            </Link>
            <Link
              to="/investimentos"
              className={`icon-btn icon-btn--header${location.pathname === '/investimentos' ? ' icon-btn--active' : ''}`}
              aria-label="Investimentos"
              title="Investimentos"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M2 12.5 6 8l3 3 5-6.5"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path d="M10.5 4.5H14V8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>

          <button
            type="button"
            className="icon-btn icon-btn--header topbar-menu-btn"
            onClick={() => setIsMenuOpen(true)}
            aria-label="Abrir menu"
            title="Menu"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 4.5h12M2 8h12M2 11.5h12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </button>

          <button
            type="button"
            className="btn btn-primary new-expense-btn"
            onClick={() => setIsAddOpen(true)}
            aria-label="Nova despesa"
            title="Nova despesa"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M8 2.5v11M2.5 8h11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            <span className="btn-label">Nova despesa</span>
          </button>
        </div>
      </header>

      <Drawer isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)}>
        <button
          type="button"
          className="drawer-item"
          onClick={() => {
            setIsMenuOpen(false)
            setIsCategoriesOpen(true)
          }}
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
          Categorias
        </button>

        <button
          type="button"
          className="drawer-item"
          onClick={() => {
            setIsMenuOpen(false)
            setIsPeopleOpen(true)
          }}
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
          Responsáveis
        </button>

        <button
          type="button"
          className="drawer-item"
          onClick={() => {
            setIsMenuOpen(false)
            setIsPaymentMethodsOpen(true)
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="1.5" y="3.5" width="13" height="9" rx="1.3" stroke="currentColor" strokeWidth="1.3" />
            <path d="M1.5 6.5h13" stroke="currentColor" strokeWidth="1.3" />
            <path d="M3.5 10h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          Métodos de pagamento
        </button>

        <button
          type="button"
          className="drawer-item"
          onClick={() => {
            setIsMenuOpen(false)
            setIsBucketsOpen(true)
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M1.5 5.5 8 2l6.5 3.5-6.5 3.5-6.5-3.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
            <path d="M1.5 5.5V11L8 14.5V9" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
            <path d="M14.5 5.5V11L8 14.5" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
          </svg>
          Envelopes
        </button>

        <button
          type="button"
          className="drawer-item"
          onClick={() => {
            setIsMenuOpen(false)
            setIsBanksOpen(true)
          }}
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
          Bancos
        </button>

        <Link to="/gastos-fixos" className="drawer-item" onClick={() => setIsMenuOpen(false)}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M8 1.5v2M8 12.5v2M2.5 8h2M11.5 8h2M4.2 4.2l1.4 1.4M10.4 10.4l1.4 1.4M4.2 11.8l1.4-1.4M10.4 5.6l1.4-1.4"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
            />
            <circle cx="8" cy="8" r="2.3" stroke="currentColor" strokeWidth="1.3" />
          </svg>
          Gastos fixos
        </Link>

        <Link to="/graficos" className="drawer-item" onClick={() => setIsMenuOpen(false)}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M2.5 13.5v-6M7 13.5V2.5M11.5 13.5V7.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          Gráficos
        </Link>

        <Link to="/investimentos" className="drawer-item" onClick={() => setIsMenuOpen(false)}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M2 12.5 6 8l3 3 5-6.5"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path d="M10.5 4.5H14V8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Investimentos
        </Link>
      </Drawer>

      <Routes>
        <Route
          path="/"
          element={
            <DashboardPage
              selectedMonth={selectedMonth}
              onShiftMonth={(delta) => setSelectedMonth((month) => shiftMonth(month, delta))}
              periodFilterActive={hasPeriodFilter}
              summary={summary}
              isLoading={isLoading}
              loadError={loadError}
              expenses={expenses}
              filteredExpenses={filteredExpenses}
              filters={filters}
              onFiltersChange={setFilters}
              categories={categories}
              people={people}
              paymentMethods={paymentMethods}
              buckets={buckets}
              banks={banks}
              onAddClick={() => setIsAddOpen(true)}
              onEditExpense={setEditingExpense}
              onDeleteExpense={handleDelete}
            />
          }
        />
        <Route path="/gastos-fixos" element={<RecurringExpensesPage />} />
        <Route
          path="/graficos"
          element={
            <Suspense fallback={<main className="container"><p className="state-message">Carregando gráficos…</p></main>}>
              <ChartsPage
                expenses={expenses}
                filteredExpenses={filteredExpenses}
                isLoading={isLoading}
                loadError={loadError}
                periodFilterActive={hasPeriodFilter}
                selectedMonth={selectedMonth}
              />
            </Suspense>
          }
        />
        <Route
          path="/investimentos"
          element={
            <InvestmentsPage
              expenses={expenses}
              isLoading={isLoading}
              loadError={loadError}
              onExpensesChanged={loadExpenses}
            />
          }
        />
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
