import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatCompactCurrency, formatCurrency } from '../../utils/format'
import { formatShortMonthLabel, lastMonths, sameYearMonth } from '../../utils/date'

const SERIES = [
  { key: 'expense', label: 'Despesas', color: 'var(--danger)' },
  { key: 'income', label: 'Receitas', color: 'var(--success)' },
  { key: 'investment', label: 'Investimentos', color: 'var(--info)' },
]

function LineTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null

  return (
    <div className="chart-tooltip chart-tooltip--multi">
      <span className="chart-tooltip-label">{label}</span>
      {SERIES.map((series) => {
        const entry = payload.find((item) => item.dataKey === series.key)
        if (!entry) return null
        return (
          <div key={series.key} className="chart-tooltip-row">
            <span className="chart-tooltip-key" style={{ background: series.color }} />
            <span className="chart-tooltip-row-label">{series.label}</span>
            <span className="chart-tooltip-row-value">{formatCurrency(entry.value)}</span>
          </div>
        )
      })}
    </div>
  )
}

function MonthlyTrendChart({ expenses, monthsCount = 6 }) {
  const months = lastMonths(monthsCount)

  const data = months.map((month) => {
    const monthExpenses = expenses.filter((expense) => sameYearMonth(expense.date, month))
    const totals = { expense: 0, income: 0, investment: 0 }
    monthExpenses.forEach((expense) => {
      totals[expense.type] = (totals[expense.type] ?? 0) + expense.amount
    })
    return { label: formatShortMonthLabel(month), ...totals }
  })

  const hasData = data.some((month) => month.expense || month.income || month.investment)

  if (!hasData) {
    return <p className="state-message">Sem dados suficientes para exibir a evolução mensal.</p>
  }

  return (
    <>
      <div className="chart-legend">
        {SERIES.map((series) => (
          <span key={series.key} className="chart-legend-item">
            <span className="chart-legend-swatch" style={{ background: series.color }} />
            {series.label}
          </span>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 4, left: 4 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 12, fill: 'var(--text-muted)' }}
            axisLine={{ stroke: 'var(--border)' }}
            tickLine={false}
          />
          <YAxis
            tickFormatter={formatCompactCurrency}
            tick={{ fontSize: 12, fill: 'var(--text-muted)' }}
            axisLine={false}
            tickLine={false}
            width={56}
          />
          <Tooltip content={<LineTooltip />} cursor={{ stroke: 'var(--border)', strokeWidth: 1 }} />
          {SERIES.map((series) => (
            <Line
              key={series.key}
              type="monotone"
              dataKey={series.key}
              name={series.label}
              stroke={series.color}
              strokeWidth={2}
              dot={{ r: 4, fill: series.color, stroke: 'var(--surface)', strokeWidth: 2 }}
              activeDot={{ r: 5, fill: series.color, stroke: 'var(--surface)', strokeWidth: 2 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>

      <details className="chart-table-toggle">
        <summary>Ver como tabela</summary>
        <table className="chart-table">
          <thead>
            <tr>
              <th>Mês</th>
              <th>Despesas</th>
              <th>Receitas</th>
              <th>Investimentos</th>
            </tr>
          </thead>
          <tbody>
            {data.map((month) => (
              <tr key={month.label}>
                <td>{month.label}</td>
                <td>{formatCurrency(month.expense)}</td>
                <td>{formatCurrency(month.income)}</td>
                <td>{formatCurrency(month.investment)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </>
  )
}

export default MonthlyTrendChart
