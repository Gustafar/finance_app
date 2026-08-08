import ExpenseList from '../components/ExpenseList'
import SummaryCard from '../components/SummaryCard'
import FilterButton from '../components/FilterButton'
import { formatCurrency } from '../utils/format'
import { formatMonthLabel } from '../utils/date'

function DashboardPage({
  selectedMonth,
  onShiftMonth,
  periodFilterActive,
  summary,
  isLoading,
  loadError,
  expenses,
  filteredExpenses,
  onOpenFilters,
  hasActiveFilters,
  onAddClick,
  onEditExpense,
  onDeleteExpense,
}) {
  return (
    <main className="container">
      <div className="dashboard-toolbar">
        <div className="month-nav">
          <button
            type="button"
            className="icon-btn"
            onClick={() => onShiftMonth(-1)}
            disabled={periodFilterActive}
            aria-label="Mês anterior"
            title="Mês anterior"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 3 5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <span className="month-nav-label">
            {periodFilterActive ? 'Período personalizado' : formatMonthLabel(selectedMonth)}
          </span>
          <button
            type="button"
            className="icon-btn"
            onClick={() => onShiftMonth(1)}
            disabled={periodFilterActive}
            aria-label="Próximo mês"
            title="Próximo mês"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <FilterButton onClick={onOpenFilters} active={hasActiveFilters} />
      </div>

      <section className="summary-grid">
        <SummaryCard label="Total gasto" value={formatCurrency(summary.totalExpense)} tone="expense" />
        <SummaryCard label="Total recebido" value={formatCurrency(summary.totalIncome)} tone="income" />
        <SummaryCard label="Total investido" value={formatCurrency(summary.totalInvestment)} tone="investment" />
        <SummaryCard
          label="Maior categoria"
          value={summary.topCategory}
          sub={summary.count > 0 ? formatCurrency(summary.topCategoryAmount) : null}
        />
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>Despesas</h2>
        </div>

        {isLoading && <p className="state-message">Carregando despesas…</p>}

        {!isLoading && loadError && <p className="state-message state-message--error">{loadError}</p>}

        {!isLoading && !loadError && expenses.length === 0 && (
          <div className="empty-state">
            <p>Nenhuma despesa registrada ainda.</p>
            <button type="button" className="btn btn-secondary" onClick={onAddClick}>
              Adicionar a primeira despesa
            </button>
          </div>
        )}

        {!isLoading && !loadError && expenses.length > 0 && filteredExpenses.length === 0 && (
          <p className="state-message">Nenhuma transação encontrada para os filtros selecionados.</p>
        )}

        {!isLoading && !loadError && filteredExpenses.length > 0 && (
          <ExpenseList expenses={filteredExpenses} onDelete={onDeleteExpense} onEdit={onEditExpense} />
        )}
      </section>
    </main>
  )
}

export default DashboardPage
