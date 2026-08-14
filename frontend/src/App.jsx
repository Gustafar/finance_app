import { useState, useEffect, useMemo, useRef, lazy, Suspense } from 'react'
import { Routes, Route, Link, useLocation } from 'react-router-dom'
import AddExpenseModal from './components/AddExpenseModal'
import ExpenseEditForm from './components/ExpenseEditForm'
import FilterDialog from './components/FilterDialog'
import ThemeToggle from './components/ThemeToggle'
import Modal from './components/Modal'
import Drawer from './components/Drawer'
import LoadingBar from './components/LoadingBar'
import CategoryManager from './components/CategoryManager'
import SubcategoryManager from './components/SubcategoryManager'
import PersonManager from './components/PersonManager'
import PaymentMethodManager from './components/PaymentMethodManager'
import BucketManager from './components/BucketManager'
import BankManager from './components/BankManager'
import DashboardPage from './pages/DashboardPage'
import RecurringExpensesPage from './pages/RecurringExpensesPage'
import MonthlyEstimatePage from './pages/MonthlyEstimatePage'
import InvestmentsPage from './pages/InvestmentsPage'
import { fetchExpenses, deleteExpense } from './api/expenses'
import { generateDueRecurringExpenses } from './api/recurringExpenses'
import { fetchSubcategories } from './api/subcategories'
import { fetchPeople } from './api/people'
import { fetchPaymentMethods } from './api/paymentMethods'
import { fetchBuckets } from './api/buckets'
import { fetchBanks } from './api/banks'
import { currentYearMonth, sameYearMonth, shiftMonth } from './utils/date'
import { EMPTY_FILTERS, hasActiveFilters, matchesFilters } from './utils/filters'
import { useTheme } from './hooks/useTheme'
import './App.css'

const ChartsPage = lazy(() => import('./pages/ChartsPage'))

function App() {
  const topbarRef = useRef(null)
  const [expenses, setExpenses] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [loadError, setLoadError] = useState(null)
  const [editingExpense, setEditingExpense] = useState(null)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false)
  const [isSubcategoriesOpen, setIsSubcategoriesOpen] = useState(false)
  const [isPeopleOpen, setIsPeopleOpen] = useState(false)
  const [isPaymentMethodsOpen, setIsPaymentMethodsOpen] = useState(false)
  const [isBucketsOpen, setIsBucketsOpen] = useState(false)
  const [isBanksOpen, setIsBanksOpen] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(currentYearMonth)
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [subcategories, setSubcategories] = useState([])
  const [people, setPeople] = useState([])
  const [paymentMethods, setPaymentMethods] = useState([])
  const [buckets, setBuckets] = useState([])
  const [banks, setBanks] = useState([])
  const [isLoadingFilterOptions, setIsLoadingFilterOptions] = useState(true)
  const location = useLocation()
  const { theme, cycleTheme } = useTheme()

  const loadExpenses = () => {
    return fetchExpenses()
      .then((data) => {
        setExpenses(data)
        setLoadError(null)
      })
      .catch((error) => {
        console.error('Erro ao buscar despesas:', error)
        setLoadError('Não foi possível carregar as despesas.')
      })
  }

  const handleRefresh = () => {
    setIsRefreshing(true)
    generateDueRecurringExpenses()
      .catch((error) => console.error('Erro ao gerar gastos fixos:', error))
      .finally(() => {
        loadExpenses().finally(() => setIsRefreshing(false))
      })
  }

  useEffect(() => {
    generateDueRecurringExpenses()
      .catch((error) => console.error('Erro ao gerar gastos fixos:', error))
      .finally(() => {
        loadExpenses().finally(() => setIsLoading(false))
      })

    Promise.all([
      fetchSubcategories().then(setSubcategories).catch((error) => console.error('Erro ao buscar subcategorias:', error)),
      fetchPeople().then(setPeople).catch((error) => console.error('Erro ao buscar responsáveis:', error)),
      fetchPaymentMethods()
        .then(setPaymentMethods)
        .catch((error) => console.error('Erro ao buscar métodos de pagamento:', error)),
      fetchBuckets().then(setBuckets).catch((error) => console.error('Erro ao buscar envelopes:', error)),
      fetchBanks().then(setBanks).catch((error) => console.error('Erro ao buscar bancos:', error)),
    ]).finally(() => setIsLoadingFilterOptions(false))
  }, [])

  // Re-download the expense list every time the user navigates back to the home screen,
  // skipping the very first mount (already covered by the effect above).
  const isInitialMount = useRef(true)
  useEffect(() => {
    if (location.pathname !== '/') return
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }
    loadExpenses()
  }, [location.pathname])

  useEffect(() => {
    const el = topbarRef.current
    if (!el) return

    const setTopbarHeight = () => {
      document.documentElement.style.setProperty('--topbar-height', `${el.offsetHeight}px`)
    }

    setTopbarHeight()
    const observer = new ResizeObserver(setTopbarHeight)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const handleExpenseCreated = (created) => {
    const newExpenses = Array.isArray(created) ? created : [created]
    setExpenses((prevExpenses) => [...prevExpenses, ...newExpenses])
    setIsAddOpen(false)
  }

  const handleExpensesCreated = (created) => {
    setExpenses((prevExpenses) => [...prevExpenses, ...created])
  }

  const handleDelete = (id) => {
    return deleteExpense(id)
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
  const filtersAreActive = hasActiveFilters(filters)

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
    () => monthExpenses.filter((expense) => matchesFilters(expense, filters)),
    [monthExpenses, filters]
  )

  const trendExpenses = useMemo(
    () => expenses.filter((expense) => matchesFilters(expense, filters)),
    [expenses, filters]
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

      <header className="topbar" ref={topbarRef}>
        <div className="topbar-start">
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
          <Link to="/" className="brand">
            <span className="brand-mark">R$</span>
            <span>Minhas Finanças</span>
          </Link>
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
              onClick={() => setIsSubcategoriesOpen(true)}
              aria-label="Subcategorias"
              title="Subcategorias"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M6 2h3.2A1.2 1.2 0 0 1 10.4 3.2v3.2a1.2 1.2 0 0 1-.35.85l-4.4 4.4a1.2 1.2 0 0 1-1.7 0l-2.8-2.8a1.2 1.2 0 0 1 0-1.7l4.4-4.4A1.2 1.2 0 0 1 6 2Z"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinejoin="round"
                />
                <circle cx="7.7" cy="4.5" r="0.7" fill="currentColor" />
                <path
                  d="M9.5 7.5 12 10"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                />
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
              aria-label="Planejador Mensal"
              title="Planejador Mensal"
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
            <ThemeToggle theme={theme} onToggle={cycleTheme} />
          </div>

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
            setIsSubcategoriesOpen(true)
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M6 2h3.2A1.2 1.2 0 0 1 10.4 3.2v3.2a1.2 1.2 0 0 1-.35.85l-4.4 4.4a1.2 1.2 0 0 1-1.7 0l-2.8-2.8a1.2 1.2 0 0 1 0-1.7l4.4-4.4A1.2 1.2 0 0 1 6 2Z"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
            <circle cx="7.7" cy="4.5" r="0.7" fill="currentColor" />
            <path d="M9.5 7.5 12 10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          Subcategorias
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
          Planejador Mensal
        </Link>

        <Link to="/estimativa-mensal" className="drawer-item" onClick={() => setIsMenuOpen(false)}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M2.5 13.5h11M4 13.5V9M7.5 13.5V6M11 13.5V3"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Estimativa mensal
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

        <ThemeToggle theme={theme} onToggle={cycleTheme} variant="drawer" />
      </Drawer>

      <Routes>
        <Route
          path="/"
          element={
            <DashboardPage
              selectedMonth={selectedMonth}
              onShiftMonth={(delta) => setSelectedMonth((month) => shiftMonth(month, delta))}
              onSelectMonth={setSelectedMonth}
              periodFilterActive={hasPeriodFilter}
              summary={summary}
              isLoading={isLoading}
              loadError={loadError}
              expenses={expenses}
              filteredExpenses={filteredExpenses}
              onOpenFilters={() => setIsFiltersOpen(true)}
              hasActiveFilters={filtersAreActive}
              onAddClick={() => setIsAddOpen(true)}
              onEditExpense={setEditingExpense}
              onDeleteExpense={handleDelete}
              onRefresh={handleRefresh}
              isRefreshing={isRefreshing}
              searchValue={filters.description}
              onSearchChange={(value) => setFilters((prev) => ({ ...prev, description: value }))}
            />
          }
        />
        <Route path="/gastos-fixos" element={<RecurringExpensesPage />} />
        <Route path="/estimativa-mensal" element={<MonthlyEstimatePage />} />
        <Route
          path="/graficos"
          element={
            <Suspense fallback={<main className="container"><p className="state-message">Carregando gráficos…</p></main>}>
              <ChartsPage
                trendExpenses={trendExpenses}
                filteredExpenses={filteredExpenses}
                isLoading={isLoading}
                loadError={loadError}
                periodFilterActive={hasPeriodFilter}
                selectedMonth={selectedMonth}
                trendDateFrom={filters.dateFrom}
                trendDateTo={filters.dateTo}
                onOpenFilters={() => setIsFiltersOpen(true)}
                hasActiveFilters={filtersAreActive}
                searchValue={filters.description}
                onSearchChange={(value) => setFilters((prev) => ({ ...prev, description: value }))}
                onEditExpense={setEditingExpense}
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

      <AddExpenseModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onExpenseCreated={handleExpenseCreated}
        onExpensesCreated={handleExpensesCreated}
      />

      <FilterDialog
        isOpen={isFiltersOpen}
        onClose={() => setIsFiltersOpen(false)}
        filters={filters}
        onChange={setFilters}
        subcategories={subcategories}
        people={people}
        paymentMethods={paymentMethods}
        buckets={buckets}
        banks={banks}
        isLoading={isLoadingFilterOptions}
      />

      <Modal isOpen={editingExpense !== null} onClose={() => setEditingExpense(null)}>
        {editingExpense && (
          <ExpenseEditForm expense={editingExpense} onExpenseUpdated={handleExpenseUpdated} />
        )}
      </Modal>

      <Modal isOpen={isCategoriesOpen} onClose={() => setIsCategoriesOpen(false)}>
        <CategoryManager />
      </Modal>

      <Modal isOpen={isSubcategoriesOpen} onClose={() => setIsSubcategoriesOpen(false)}>
        <SubcategoryManager />
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
