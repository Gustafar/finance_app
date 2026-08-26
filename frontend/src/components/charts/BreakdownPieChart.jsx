import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { formatCurrency } from '../../utils/format'
import { paletteColor } from '../../utils/categoryColor'

function PieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null

  const { name, amount, percent, color } = payload[0].payload

  return (
    <div className="chart-tooltip">
      <span className="chart-tooltip-value" style={{ color }}>
        {formatCurrency(amount)} · {percent.toFixed(1)}%
      </span>
      <span className="chart-tooltip-label">{name}</span>
    </div>
  )
}

function renderPercentLabel({ cx, cy, midAngle, outerRadius, percent, payload }) {
  const RADIAN = Math.PI / 180
  const radius = outerRadius + 18
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)

  return (
    <text
      x={x}
      y={y}
      fill={payload.color}
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      fontSize={12}
      fontWeight={600}
    >
      {(percent * 100).toFixed(1)}%
    </text>
  )
}

function BreakdownPieChart({ expenses, idKey, nameKey, colorKey, emptyMessage, tableLabel, onSliceClick }) {
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

  const total = data.reduce((sum, item) => sum + item.amount, 0)
  data.forEach((item) => {
    item.percent = total > 0 ? (item.amount / total) * 100 : 0
  })

  return (
    <>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart margin={{ top: 24, right: 40, bottom: 24, left: 40 }}>
          <Pie
            data={data}
            dataKey="amount"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={64}
            outerRadius={92}
            paddingAngle={2}
            label={renderPercentLabel}
            labelLine={false}
          >
            {data.map((entry) => (
              <Cell
                key={entry.id}
                fill={entry.color}
                cursor={onSliceClick ? 'pointer' : undefined}
                onClick={onSliceClick ? () => onSliceClick(entry) : undefined}
              />
            ))}
          </Pie>
          <Tooltip content={<PieTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      <ul className="chart-legend">
        {data.map((item) => (
          <li
            key={item.id}
            className={onSliceClick ? 'chart-legend-item chart-legend-item--clickable' : 'chart-legend-item'}
            onClick={onSliceClick ? () => onSliceClick(item) : undefined}
          >
            <span className="chart-legend-swatch" style={{ background: item.color }} />
            {item.name}
          </li>
        ))}
      </ul>

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
                onClick={onSliceClick ? () => onSliceClick(item) : undefined}
                className={onSliceClick ? 'chart-table-row--clickable' : undefined}
              >
                <td>{item.name}</td>
                <td>{formatCurrency(item.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </>
  )
}

export default BreakdownPieChart
