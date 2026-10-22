import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import MonthlyTrendChart from '../components/charts/MonthlyTrendChart'
import DrillDownBreakdownChart from '../components/charts/DrillDownBreakdownChart'
import EstimateComparisonPanel from '../components/charts/EstimateComparisonPanel'
import DateRangePicker from '../components/DateRangePicker'
import FilterButton from '../components/FilterButton'
import SearchInput from '../components/SearchInput'
import { dateStringToYearMonth, formatMonthLabel, formatPeriodLabel, todayDateInputValue } from '../utils/date'

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
  period,
  onPeriodChange,
  filters,
  onOpenFilters,
  hasActiveFilters,
  searchValue,
  onSearchChange,
  onEditExpense,
}) {
  const caption = `Filtros ativos · ${formatPeriodLabel(period)}`
  // Identifies the current scope (period + all active filters) so the drill-down charts only
  // reset their position when the scope actually changes — not on every reload triggered by
  // saving an edit inside a drilled-in card.
  const resetKey = `${period.from}|${period.to}|${JSON.stringify(filters)}`
  const endMonth = dateStringToYearMonth(period.to)
  const trendCaption =
    period.from.slice(0, 7) !== period.to.slice(0, 7)
      ? 'Despesas, receitas e investimentos no período selecionado.'
      : `Despesas, receitas e investimentos nos 6 meses até ${formatMonthLabel(endMonth).toLowerCase()}.`

  // The estimate panel is per month: show the current month while it's inside the period,
  // otherwise the period's last month.
  const comparisonMonth = useMemo(() => {
    const today = todayDateInputValue()
    return dateStringToYearMonth(today >= period.from && today <= period.to ? today : period.to)
  }, [period.from, period.to])

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
          <div className="header-date-range">
            <label htmlFor="charts-period">Período</label>
            <DateRangePicker id="charts-period" value={period} onChange={onPeriodChange} />
          </div>
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
              dateFrom={period.from}
              dateTo={period.to}
            />
          </section>

          <EstimateComparisonPanel expenses={expenses} selectedMonth={comparisonMonth} />

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
