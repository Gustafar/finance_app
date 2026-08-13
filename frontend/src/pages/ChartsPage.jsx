import { Link } from 'react-router-dom'
import MonthlyTrendChart from '../components/charts/MonthlyTrendChart'
import DrillDownBreakdownChart from '../components/charts/DrillDownBreakdownChart'
import FilterButton from '../components/FilterButton'
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
  trendExpenses,
  filteredExpenses,
  isLoading,
  loadError,
  periodFilterActive,
  selectedMonth,
  onOpenFilters,
  hasActiveFilters,
}) {
  const scopeLabel = periodFilterActive ? 'período personalizado' : formatMonthLabel(selectedMonth)
  const caption = `Filtros ativos · ${scopeLabel}`

  return (
    <main className="container">
      <div className="page-header">
        <Link to="/" className="icon-btn" aria-label="Voltar" title="Voltar">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3 5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <h1>Gráficos</h1>
        <FilterButton onClick={onOpenFilters} active={hasActiveFilters} className="page-header-filter-btn" />
      </div>

      {isLoading && <p className="state-message">Carregando dados…</p>}
      {!isLoading && loadError && <p className="state-message state-message--error">{loadError}</p>}

      {!isLoading && !loadError && (
        <>
          <section className="panel chart-panel">
            <div className="panel-header">
              <h2>Evolução mensal</h2>
              <p className="chart-caption">Despesas, receitas e investimentos nos últimos 6 meses.</p>
            </div>
            <div className="chart-body">
              <MonthlyTrendChart expenses={trendExpenses} />
            </div>
          </section>

          <div className="charts-grid">
            <section className="panel chart-panel">
              <div className="panel-header">
                <h2>Gastos por categoria</h2>
              </div>
              <div className="chart-body">
                <DrillDownBreakdownChart
                  expenses={filteredExpenses}
                  rootLabel="Categorias"
                  caption={caption}
                  detailEmptyMessage="Nenhuma despesa para exibir."
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
              </div>
            </section>

            <section className="panel chart-panel">
              <div className="panel-header">
                <h2>Gastos por responsável</h2>
              </div>
              <div className="chart-body">
                <DrillDownBreakdownChart
                  expenses={filteredExpenses}
                  rootLabel="Responsáveis"
                  caption={caption}
                  detailEmptyMessage="Nenhuma despesa para exibir."
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
              </div>
            </section>
          </div>
        </>
      )}
    </main>
  )
}

export default ChartsPage
