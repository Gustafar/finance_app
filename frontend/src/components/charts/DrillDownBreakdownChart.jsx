import { useState } from 'react'
import BreakdownBarChart from './BreakdownBarChart'
import BreakdownPieChart from './BreakdownPieChart'
import { formatCurrency, formatDate } from '../../utils/format'

function ExpenseDetailList({ expenses, emptyMessage, onEditExpense, sortBy }) {
  const sorted = [...expenses].sort((a, b) =>
    sortBy === 'amount' ? b.amount - a.amount : new Date(b.date) - new Date(a.date)
  )

  if (sorted.length === 0) {
    return <p className="state-message">{emptyMessage}</p>
  }

  return (
    <ul className="chart-detail-list">
      {sorted.map((expense) => (
        <li key={expense.id} className="chart-detail-row">
          <div className="chart-detail-main">
            <span className="chart-detail-description" title={expense.description}>{expense.description}</span>
            {expense.comment && (
              <span className="chart-detail-comment" title={expense.comment}>{expense.comment}</span>
            )}
            <span className="chart-detail-date">{formatDate(expense.date)} · {expense.person_name}</span>
          </div>
          <span className="chart-detail-amount">{formatCurrency(expense.amount)}</span>
          {onEditExpense && (
            <button
              type="button"
              className="icon-btn"
              onClick={() => onEditExpense(expense)}
              aria-label="Editar despesa"
              title="Editar"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M11.333 2a1.2 1.2 0 0 1 1.697 1.697l-7.03 7.03-2.333.637.636-2.334z"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}
        </li>
      ))}
    </ul>
  )
}

// dimensions: ordered chain of grouping levels to drill through, e.g. responsável → categoria →
// subcategoria. Each is { idKey, nameKey, colorKey, tableLabel, emptyMessage, chartType?, noneId?,
// noneLabel? } — chartType picks 'bar' (default) or 'pie' for that level. noneId/noneLabel group
// expenses missing that field (e.g. legacy expenses without a subcategory) under a synthetic
// bucket instead of dropping them. Clicking a bar/slice drills one level deeper; the last level's
// clicks reveal the individual expenses behind it.
function DrillDownBreakdownChart({ title, expenses, resetKey, dimensions, rootLabel, caption, detailEmptyMessage, onEditExpense }) {
  const [drillPath, setDrillPath] = useState([])
  const [sortBy, setSortBy] = useState('date')

  // Reset the drill whenever the underlying scope changes (month, filters, period) — but not
  // when `expenses` merely gets a new array reference from an in-place edit (e.g. saving an
  // expense reloads the list). `resetKey` is caller-supplied and only changes with real scope
  // changes, so drilling in and editing an item there doesn't bounce back to the top level.
  const [scopeForDrill, setScopeForDrill] = useState(resetKey)
  if (scopeForDrill !== resetKey) {
    setScopeForDrill(resetKey)
    setDrillPath([])
  }

  const scopedExpenses = drillPath.reduce((acc, step, index) => {
    const dimension = dimensions[index]
    return acc.filter((expense) => (expense[dimension.idKey] ?? dimension.noneId) === step.id)
  }, expenses)

  const currentDimension = dimensions[drillPath.length]
  const isLeaf = !currentDimension

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
      <div className={`panel-header${isLeaf ? ' chart-panel-header--with-action' : ''}`}>
        <h2>{title}</h2>
        {isLeaf && (
          <div className="chart-sort-toggle" role="group" aria-label="Ordenar por">
            <button
              type="button"
              className={sortBy === 'date' ? 'chart-sort-btn chart-sort-btn--active' : 'chart-sort-btn'}
              onClick={() => setSortBy('date')}
            >
              Data
            </button>
            <button
              type="button"
              className={sortBy === 'amount' ? 'chart-sort-btn chart-sort-btn--active' : 'chart-sort-btn'}
              onClick={() => setSortBy('amount')}
            >
              Valor
            </button>
          </div>
        )}
      </div>

      <div className="chart-body">
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

        {currentDimension && currentDimension.chartType === 'pie' ? (
          <BreakdownPieChart
            expenses={chartExpenses}
            idKey={currentDimension.idKey}
            nameKey={currentDimension.nameKey}
            colorKey={currentDimension.colorKey}
            tableLabel={currentDimension.tableLabel}
            emptyMessage={currentDimension.emptyMessage}
            onSliceClick={(item) => setDrillPath([...drillPath, { id: item.id, name: item.name }])}
          />
        ) : currentDimension ? (
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
          <ExpenseDetailList
            expenses={scopedExpenses}
            emptyMessage={detailEmptyMessage}
            onEditExpense={onEditExpense}
            sortBy={sortBy}
          />
        )}
      </div>
    </>
  )
}

export default DrillDownBreakdownChart
