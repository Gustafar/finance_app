import { useState } from 'react'
import BreakdownBarChart from './BreakdownBarChart'
import { formatCurrency, formatDate } from '../../utils/format'

function ExpenseDetailList({ expenses, emptyMessage }) {
  const sorted = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date))

  if (sorted.length === 0) {
    return <p className="state-message">{emptyMessage}</p>
  }

  return (
    <ul className="chart-detail-list">
      {sorted.map((expense) => (
        <li key={expense.id} className="chart-detail-row">
          <div className="chart-detail-main">
            <span className="chart-detail-description" title={expense.description}>{expense.description}</span>
            <span className="chart-detail-date">{formatDate(expense.date)} · {expense.person_name}</span>
          </div>
          <span className="chart-detail-amount">{formatCurrency(expense.amount)}</span>
        </li>
      ))}
    </ul>
  )
}

// dimensions: ordered chain of grouping levels to drill through, e.g. responsável → categoria →
// subcategoria. Each is { idKey, nameKey, colorKey, tableLabel, emptyMessage, noneId?, noneLabel? }
// — noneId/noneLabel group expenses missing that field (e.g. legacy expenses without a
// subcategory) under a synthetic bucket instead of dropping them. Clicking a bar drills one
// level deeper; the last level's clicks reveal the individual expenses behind it.
function DrillDownBreakdownChart({ expenses, dimensions, rootLabel, caption, detailEmptyMessage }) {
  const [drillPath, setDrillPath] = useState([])

  // Reset the drill whenever the underlying scope changes (month, filters, period). Adjusting
  // state during render avoids an extra commit for this reset.
  const [scopeForDrill, setScopeForDrill] = useState(expenses)
  if (scopeForDrill !== expenses) {
    setScopeForDrill(expenses)
    setDrillPath([])
  }

  const scopedExpenses = drillPath.reduce((acc, step, index) => {
    const dimension = dimensions[index]
    return acc.filter((expense) => (expense[dimension.idKey] ?? dimension.noneId) === step.id)
  }, expenses)

  const currentDimension = dimensions[drillPath.length]

  const chartExpenses =
    currentDimension && currentDimension.noneId
      ? scopedExpenses.map((expense) => ({
          ...expense,
          [currentDimension.idKey]: expense[currentDimension.idKey] ?? currentDimension.noneId,
          [currentDimension.nameKey]: expense[currentDimension.nameKey] ?? currentDimension.noneLabel,
        }))
      : scopedExpenses

  return (
    <>
      {drillPath.length > 0 ? (
        <p className="chart-breadcrumb">
          <button type="button" className="chart-breadcrumb-link" onClick={() => setDrillPath([])}>
            {rootLabel}
          </button>
          {drillPath.map((step, index) => {
            const isLast = index === drillPath.length - 1
            return (
              <span key={`${step.id}-${index}`}>
                <span className="chart-breadcrumb-sep">›</span>
                {isLast ? (
                  <span className="chart-breadcrumb-current">{step.name}</span>
                ) : (
                  <button
                    type="button"
                    className="chart-breadcrumb-link"
                    onClick={() => setDrillPath(drillPath.slice(0, index + 1))}
                  >
                    {step.name}
                  </button>
                )}
              </span>
            )
          })}
        </p>
      ) : (
        <p className="chart-caption">{caption}</p>
      )}

      {currentDimension ? (
        <BreakdownBarChart
          expenses={chartExpenses}
          idKey={currentDimension.idKey}
          nameKey={currentDimension.nameKey}
          colorKey={currentDimension.colorKey}
          tableLabel={currentDimension.tableLabel}
          emptyMessage={currentDimension.emptyMessage}
          onBarClick={(item) => setDrillPath([...drillPath, { id: item.id, name: item.name }])}
        />
      ) : (
        <ExpenseDetailList expenses={scopedExpenses} emptyMessage={detailEmptyMessage} />
      )}
    </>
  )
}

export default DrillDownBreakdownChart
