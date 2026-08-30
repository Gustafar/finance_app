import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatCompactCurrency, formatCurrency } from '../../utils/format'
import { paletteColor } from '../../utils/categoryColor'
import { useVisibility } from '../../hooks/useVisibility'

function BarTooltip({ active, payload, hidden }) {
  if (!active || !payload?.length) return null

  const { name, amount, color } = payload[0].payload

  return (
    <div className="chart-tooltip">
      <span className="chart-tooltip-value" style={{ color }}>
        {formatCurrency(amount, hidden)}
      </span>
      <span className="chart-tooltip-label">{name}</span>
    </div>
  )
}

function BreakdownBarChart({ expenses, idKey, nameKey, colorKey, emptyMessage, tableLabel, onBarClick }) {
  const { hidden } = useVisibility()
  const data = expenses
    .filter((expense) => expense.type === 'expense')
    .reduce((acc, expense) => {
      const id = expense[idKey]
      const existing = acc.find((item) => item.id === id)
      if (existing) {
        existing.amount += expense.amount
      } else {
        acc.push({
          id,
          name: expense[nameKey],
          amount: expense.amount,
          color: paletteColor(expense[colorKey]).text,
        })
      }
      return acc
    }, [])
    .sort((a, b) => b.amount - a.amount)

  if (data.length === 0) {
    return <p className="state-message">{emptyMessage}</p>
  }

  const rowHeight = 36
  const chartHeight = Math.max(data.length * rowHeight, 120)

  return (
    <>
      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 32, bottom: 4, left: 4 }} barCategoryGap={8}>
          <XAxis
            type="number"
            tickFormatter={(value) => formatCompactCurrency(value, hidden)}
            tick={{ fontSize: 12, fill: 'var(--text-muted)' }}
            axisLine={{ stroke: 'var(--border)' }}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={110}
            tick={{ fontSize: 12.5, fill: 'var(--text-h)' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<BarTooltip hidden={hidden} />} cursor={{ fill: 'var(--primary-bg)' }} />
          <Bar dataKey="amount" maxBarSize={22} radius={[0, 4, 4, 0]}>
            {data.map((entry) => (
              <Cell
                key={entry.id}
                fill={entry.color}
                cursor={onBarClick ? 'pointer' : undefined}
                onClick={onBarClick ? () => onBarClick(entry) : undefined}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <details className="chart-table-toggle">
        <summary>Ver como tabela</summary>
        <table className="chart-table">
          <thead>
            <tr>
              <th>{tableLabel}</th>
              <th>Valor</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr
                key={item.id}
                onClick={onBarClick ? () => onBarClick(item) : undefined}
                className={onBarClick ? 'chart-table-row--clickable' : undefined}
              >
                <td>{item.name}</td>
                <td>{formatCurrency(item.amount, hidden)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </>
  )
}

export default BreakdownBarChart
