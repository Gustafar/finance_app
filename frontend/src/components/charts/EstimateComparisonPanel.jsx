import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useRecurringExpenses } from '../../hooks/useRecurringExpenses'
import { formatCurrency } from '../../utils/format'
import { sameYearMonth } from '../../utils/date'

const ROWS = [
  { type: 'expense', label: 'Gasto', tone: 'expense', higherIsBetter: false },
  { type: 'income', label: 'Recebimento', tone: 'income', higherIsBetter: true },
  { type: 'investment', label: 'Investimento', tone: 'investment', higherIsBetter: true },
]

function sumByType(items, type) {
  return items.filter((item) => item.type === type).reduce((sum, item) => sum + item.amount, 0)
}

function EstimateComparisonPanel({ expenses, selectedMonth }) {
  const { recurrences, isLoading } = useRecurringExpenses(selectedMonth.year, selectedMonth.month)

  const monthExpenses = useMemo(
    () => expenses.filter((expense) => sameYearMonth(expense.date, selectedMonth)),
    [expenses, selectedMonth],
  )

  const rows = useMemo(
    () =>
      ROWS.map(({ type, label, tone, higherIsBetter }) => {
        const estimated = sumByType(recurrences, type)
        const actual = sumByType(monthExpenses, type)
        const diff = actual - estimated
        const isGood = higherIsBetter ? diff >= 0 : diff <= 0
        const maxValue = Math.max(estimated, actual, 1)

        return { type, label, tone, estimated, actual, diff, isGood, maxValue }
      }),
    [recurrences, monthExpenses],
  )

  return (
    <section className="panel chart-panel estimate-compare-panel">
      <div className="panel-header chart-panel-header--with-action">
        <div>
          <h2>Estimativa x Real</h2>
          <p className="chart-caption">Planejamento mensal comparado aos lançamentos reais do mês.</p>
        </div>
        <Link to="/estimativa-mensal" className="btn btn-secondary btn-sm">
          Ver estimativa mensal
        </Link>
      </div>

      <div className="chart-body">
        {isLoading ? (
          <p className="state-message">Carregando estimativa…</p>
        ) : (
          <div className="estimate-compare-grid">
            {rows.map((row) => (
              <div className={`estimate-compare-card estimate-compare-card--${row.tone}`} key={row.type}>
                <div className="estimate-compare-card-header">
                  <span className="estimate-compare-label">{row.label}</span>
                  <span
                    className={`estimate-compare-diff ${row.isGood ? 'estimate-compare-diff--good' : 'estimate-compare-diff--bad'}`}
                  >
                    {row.diff > 0 ? '+' : ''}
                    {formatCurrency(row.diff)}
                  </span>
                </div>

                <div className="estimate-compare-bars">
                  <div className="estimate-compare-bar-row">
                    <span className="estimate-compare-bar-tag">Estimado</span>
                    <div className="estimate-compare-bar-track">
                      <div
                        className="estimate-compare-bar-fill estimate-compare-bar-fill--estimated"
                        style={{ width: `${(row.estimated / row.maxValue) * 100}%` }}
                      />
                    </div>
                    <span className="estimate-compare-bar-value">{formatCurrency(row.estimated)}</span>
                  </div>
                  <div className="estimate-compare-bar-row">
                    <span className="estimate-compare-bar-tag">Real</span>
                    <div className="estimate-compare-bar-track">
                      <div
                        className="estimate-compare-bar-fill estimate-compare-bar-fill--actual"
                        style={{ width: `${(row.actual / row.maxValue) * 100}%` }}
                      />
                    </div>
                    <span className="estimate-compare-bar-value">{formatCurrency(row.actual)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export default EstimateComparisonPanel
