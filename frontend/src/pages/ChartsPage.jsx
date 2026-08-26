import { Link } from 'react-router-dom'
import MonthlyTrendChart from '../components/charts/MonthlyTrendChart'
import DrillDownBreakdownChart from '../components/charts/DrillDownBreakdownChart'
import EstimateComparisonPanel from '../components/charts/EstimateComparisonPanel'
import FilterButton from '../components/FilterButton'
import SearchInput from '../components/SearchInput'
import { formatMonthLabel } from '../utils/date'

const NO_SUBCATEGORY_ID = 'none'
const NO_SUBCATEGORY_NAME = 'Sem subcategoria'

const subcategoryDimension = {
  idKey: 'subcategory_id',
  nameKey: 'subcategory_name',
  colorKey: 'category_color',
  tableLabel: 'Subcategoria',
  emptyMessage: 'Nenhuma despesa nesta categoria.',
  noneId: NO_SUBCATEGORY_ID,
  noneLabel: NO_SUBCATEGORY_NAME,
}

function ChartsPage({
  expenses,
  trendExpenses,
  filteredExpenses,
  isLoading,
  loadError,
  periodFilterActive,
  selectedMonth,
  filters,
  trendDateFrom,
  trendDateTo,
  onOpenFilters,
  hasActiveFilters,
  searchValue,
  onSearchChange,
  onEditExpense,
}) {
  const scopeLabel = periodFilterActive ? 'período personalizado' : formatMonthLabel(selectedMonth)
  const caption = `Filtros ativos · ${scopeLabel}`
  // Identifies the current scope (month + all active filters) so the drill-down charts only
  // reset their position when the scope actually changes — not on every reload triggered by
  // saving an edit inside a drilled-in card.
  const resetKey = `${selectedMonth}|${JSON.stringify(filters)}`
  const trendCaption = periodFilterActive
    ? 'Despesas, receitas e investimentos no período selecionado.'
    : 'Despesas, receitas e investimentos nos últimos 6 meses.'

  return (
    <main className="container">
      <div className="page-header">
        <Link to="/" className="icon-btn" aria-label="Voltar" title="Voltar">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3 5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <h1>Gráficos</h1>
        <div className="page-header-actions">
          <SearchInput value={searchValue} onChange={onSearchChange} />
          <FilterButton onClick={onOpenFilters} active={hasActiveFilters} />
        </div>
      </div>

      {isLoading && <p className="state-message">Carregando dados…</p>}
      {!isLoading && loadError && <p className="state-message state-message--error">{loadError}</p>}

      {!isLoading && !loadError && (
        <>
          <section className="panel chart-panel">
            <MonthlyTrendChart
              title="Evolução mensal"
              caption={trendCaption}
              expenses={trendExpenses}
              dateFrom={trendDateFrom}
              dateTo={trendDateTo}
            />
          </section>

          <EstimateComparisonPanel expenses={expenses} selectedMonth={selectedMonth} />

          <div className="charts-grid">
            <section className="panel chart-panel">
              <DrillDownBreakdownChart
                title="Gastos por categoria"
                expenses={filteredExpenses}
                resetKey={resetKey}
                rootLabel="Categorias"
                caption={caption}
                detailEmptyMessage="Nenhuma despesa para exibir."
                onEditExpense={onEditExpense}
                dimensions={[
                  {
                    idKey: 'category_id',
                    nameKey: 'category_name',
                    colorKey: 'category_color',
                    tableLabel: 'Categoria',
                    emptyMessage: 'Nenhuma despesa no período para exibir por categoria.',
                  },
                  subcategoryDimension,
                ]}
              />
            </section>

            <section className="panel chart-panel">
              <DrillDownBreakdownChart
                title="Gastos por envelope"
                expenses={filteredExpenses}
                resetKey={resetKey}
                rootLabel="Envelopes"
                caption={caption}
                detailEmptyMessage="Nenhuma despesa para exibir."
                onEditExpense={onEditExpense}
                dimensions={[
                  {
                    idKey: 'bucket_id',
                    nameKey: 'bucket_name',
                    colorKey: 'bucket_color',
                    tableLabel: 'Envelope',
                    emptyMessage: 'Nenhuma despesa no período para exibir por envelope.',
                    chartType: 'pie',
                  },
                  {
                    idKey: 'category_id',
                    nameKey: 'category_name',
                    colorKey: 'category_color',
                    tableLabel: 'Categoria',
                    emptyMessage: 'Nenhuma despesa deste envelope.',
                  },
                  subcategoryDimension,
                ]}
              />
            </section>

            <section className="panel chart-panel">
              <DrillDownBreakdownChart
                title="Gastos por responsável"
                expenses={filteredExpenses}
                resetKey={resetKey}
                rootLabel="Responsáveis"
                caption={caption}
                detailEmptyMessage="Nenhuma despesa para exibir."
                onEditExpense={onEditExpense}
                dimensions={[
                  {
                    idKey: 'person_id',
                    nameKey: 'person_name',
                    colorKey: 'person_color',
                    tableLabel: 'Responsável',
                    emptyMessage: 'Nenhuma despesa no período para exibir por responsável.',
                  },
                  {
                    idKey: 'category_id',
                    nameKey: 'category_name',
                    colorKey: 'category_color',
                    tableLabel: 'Categoria',
                    emptyMessage: 'Nenhuma despesa deste responsável.',
                  },
                  subcategoryDimension,
                ]}
              />
            </section>
          </div>
        </>
      )}
    </main>
  )
}

export default ChartsPage
