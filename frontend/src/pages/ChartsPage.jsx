import { Link } from 'react-router-dom'
import MonthlyTrendChart from '../components/charts/MonthlyTrendChart'
import BreakdownBarChart from '../components/charts/BreakdownBarChart'
import { formatMonthLabel } from '../utils/date'

function ChartsPage({ expenses, filteredExpenses, isLoading, loadError, periodFilterActive, selectedMonth }) {
  const scopeLabel = periodFilterActive ? 'período personalizado' : formatMonthLabel(selectedMonth)

  return (
    <main className="container">
      <div className="page-header">
        <Link to="/" className="icon-btn" aria-label="Voltar" title="Voltar">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3 5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <h1>Gráficos</h1>
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
              <MonthlyTrendChart expenses={expenses} />
            </div>
          </section>

          <div className="charts-grid">
            <section className="panel chart-panel">
              <div className="panel-header">
                <h2>Gastos por categoria</h2>
                <p className="chart-caption">Filtros ativos · {scopeLabel}</p>
              </div>
              <div className="chart-body">
                <BreakdownBarChart
                  expenses={filteredExpenses}
                  idKey="category_id"
                  nameKey="category_name"
                  colorKey="category_color"
                  tableLabel="Categoria"
                  emptyMessage="Nenhuma despesa no período para exibir por categoria."
                />
              </div>
            </section>

            <section className="panel chart-panel">
              <div className="panel-header">
                <h2>Gastos por responsável</h2>
                <p className="chart-caption">Filtros ativos · {scopeLabel}</p>
              </div>
              <div className="chart-body">
                <BreakdownBarChart
                  expenses={filteredExpenses}
                  idKey="person_id"
                  nameKey="person_name"
                  colorKey="person_color"
                  tableLabel="Responsável"
                  emptyMessage="Nenhuma despesa no período para exibir por responsável."
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
