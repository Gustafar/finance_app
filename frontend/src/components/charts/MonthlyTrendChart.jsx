import { useState } from 'react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import Modal from '../Modal'
import { formatCompactCurrency, formatCurrency } from '../../utils/format'
import { formatShortMonthLabel, lastMonths, monthsInRange, sameYearMonth } from '../../utils/date'

const SERIES = [
  { key: 'expense', label: 'Despesas', color: 'var(--danger)' },
  { key: 'income', label: 'Receitas', color: 'var(--success)' },
  { key: 'investment', label: 'Investimentos', color: 'var(--info)' },
]

const TABLE_COLUMNS = [
  { key: 'expense', label: 'Despesas' },
  { key: 'income', label: 'Receitas' },
  { key: 'investment', label: 'Investimentos' },
]

const TABLE_STAT_ROWS = [
  { key: 'mean', label: 'Média' },
  { key: 'stdDev', label: 'Desvio padrão' },
]

const DEFAULT_TABLE_COLUMNS = ['expense']

function mean(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function stdDev(values) {
  const avg = mean(values)
  const variance = values.reduce((sum, value) => sum + (value - avg) ** 2, 0) / values.length
  return Math.sqrt(variance)
}

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

function MonthlyTrendChart({ title, caption, expenses, dateFrom, dateTo }) {
  const [tableColumns, setTableColumns] = useState(DEFAULT_TABLE_COLUMNS)
  const [tableStatRows, setTableStatRows] = useState([])
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  const toggleTableColumn = (key) => {
    setTableColumns((current) =>
      current.includes(key) ? current.filter((column) => column !== key) : [...current, key]
    )
  }

  const toggleTableStatRow = (key) => {
    setTableStatRows((current) =>
      current.includes(key) ? current.filter((row) => row !== key) : [...current, key]
    )
  }

  const months = dateFrom || dateTo ? monthsInRange(dateFrom, dateTo) : lastMonths(6)
  const showYear = months.length > 12

  const data = months.map((month) => {
    const monthExpenses = expenses.filter((expense) => sameYearMonth(expense.date, month))
    const totals = { expense: 0, income: 0, investment: 0 }
    monthExpenses.forEach((expense) => {
      totals[expense.type] = (totals[expense.type] ?? 0) + expense.amount
    })
    return { label: formatShortMonthLabel(month, showYear), ...totals }
  })

  const hasData = data.some((month) => month.expense || month.income || month.investment)

  return (
    <>
      <div className="panel-header">
        <h2>{title}</h2>
        <p className="chart-caption">{caption}</p>
      </div>

      <div className="chart-body">
        {!hasData ? (
          <p className="state-message">Sem dados suficientes para exibir a evolução mensal.</p>
        ) : (
          <>
            <div className="chart-legend">
              {SERIES.map((series) => (
                <span key={series.key} className="chart-legend-item">
                  <span className="chart-legend-swatch" style={{ background: series.color }} />
                  {series.label}
                </span>
              ))}
            </div>

            <div className="chart-scroll-row">
              <div className="chart-axis-fixed">
                <ResponsiveContainer width={56} height={260}>
                  <LineChart data={data} margin={{ top: 8, right: 0, bottom: 4, left: 4 }}>
                    <YAxis
                      tickFormatter={formatCompactCurrency}
                      tick={{ fontSize: 12, fill: 'var(--text-muted)' }}
                      axisLine={false}
                      tickLine={false}
                      width={56}
                    />
                    {SERIES.map((series) => (
                      <Line
                        key={series.key}
                        type="monotone"
                        dataKey={series.key}
                        stroke="transparent"
                        dot={false}
                        activeDot={false}
                        isAnimationActive={false}
                        legendType="none"
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="chart-scroll">
                <ResponsiveContainer width="100%" minWidth={months.length * 56} height={260}>
                  <LineChart data={data} margin={{ top: 8, right: 16, bottom: 4, left: 4 }}>
                    <CartesianGrid vertical={false} stroke="var(--border)" />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 12, fill: 'var(--text-muted)' }}
                      axisLine={{ stroke: 'var(--border)' }}
                      tickLine={false}
                    />
                    <YAxis hide width={0} />
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
              </div>
            </div>

            <details className="chart-table-toggle">
              <summary>
                <span>Ver como tabela</span>
                <button
                  type="button"
                  className="icon-btn chart-table-settings-btn"
                  onClick={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                    setIsSettingsOpen(true)
                  }}
                  aria-label="Configurar tabela"
                  title="Configurar tabela"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
                  </svg>
                </button>
              </summary>
              <table className="chart-table">
                <thead>
                  <tr>
                    <th>Mês</th>
                    {TABLE_COLUMNS.filter((column) => tableColumns.includes(column.key)).map((column) => (
                      <th key={column.key}>{column.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.map((month) => (
                    <tr key={month.label}>
                      <td>{month.label}</td>
                      {TABLE_COLUMNS.filter((column) => tableColumns.includes(column.key)).map((column) => (
                        <td key={column.key}>{formatCurrency(month[column.key])}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
                {tableStatRows.length > 0 && (
                  <tfoot>
                    {TABLE_STAT_ROWS.filter((row) => tableStatRows.includes(row.key)).map((row) => (
                      <tr key={row.key} className="chart-table-stat-row">
                        <td>{row.label}</td>
                        {TABLE_COLUMNS.filter((column) => tableColumns.includes(column.key)).map((column) => {
                          const values = data.map((month) => month[column.key])
                          const value = row.key === 'mean' ? mean(values) : stdDev(values)
                          return <td key={column.key}>{formatCurrency(value)}</td>
                        })}
                      </tr>
                    ))}
                  </tfoot>
                )}
              </table>
            </details>
          </>
        )}
      </div>

      <Modal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)}>
        <h2 className="modal-title">Configurar tabela</h2>

        <p className="table-settings-label">Colunas</p>
        <div className="table-settings-group">
          {TABLE_COLUMNS.map((column) => (
            <label key={column.key} className="checkbox-field">
              <input
                type="checkbox"
                checked={tableColumns.includes(column.key)}
                onChange={() => toggleTableColumn(column.key)}
              />
              {column.label}
            </label>
          ))}
        </div>

        <p className="table-settings-label">Estatísticas</p>
        <div className="table-settings-group">
          {TABLE_STAT_ROWS.map((row) => (
            <label key={row.key} className="checkbox-field">
              <input
                type="checkbox"
                checked={tableStatRows.includes(row.key)}
                onChange={() => toggleTableStatRow(row.key)}
              />
              {row.label}
            </label>
          ))}
        </div>
      </Modal>
    </>
  )
}

export default MonthlyTrendChart
