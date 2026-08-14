import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import SummaryCard from '../components/SummaryCard'
import InvestmentBoxManager from '../components/InvestmentBoxManager'
import GoalProgressChart from '../components/charts/GoalProgressChart'
import { useInvestmentBoxes } from '../hooks/useInvestmentBoxes'
import { paletteColor } from '../utils/categoryColor'
import { formatCurrency } from '../utils/format'
import { MONTH_NAMES_PT, monthsUntilGoal } from '../utils/date'

function BoxGoal({ box, saved, color }) {
  const remaining = Math.max(box.goal_amount - saved, 0)
  const percent = (saved / box.goal_amount) * 100
  const monthsLeft = monthsUntilGoal(box.goal_month, box.goal_year)
  const targetLabel = `${MONTH_NAMES_PT[box.goal_month - 1]}/${box.goal_year}`

  let simulationText
  if (remaining <= 0) {
    simulationText = 'Meta atingida! 🎉'
  } else if (monthsLeft < 0) {
    simulationText = `Meta vencida — faltam ${formatCurrency(remaining)}`
  } else {
    const monthly = remaining / (monthsLeft + 1)
    simulationText = `Guarde ${formatCurrency(monthly)}/mês até ${targetLabel} para atingir a meta`
  }

  return (
    <div className="investment-box-goal">
      <GoalProgressChart percent={percent} color={color.text} />
      <div className="investment-box-goal-text">
        <span>Meta: {formatCurrency(box.goal_amount)} até {targetLabel}</span>
        <span className="investment-box-goal-simulation">{simulationText}</span>
      </div>
    </div>
  )
}

function InvestmentsPage({ expenses, isLoading, loadError, onExpensesChanged }) {
  const {
    investmentBoxes,
    setInvestmentBoxes,
    isLoading: isLoadingBoxes,
    error: boxesError,
  } = useInvestmentBoxes()

  const totalsByBoxId = useMemo(() => {
    const totals = {}
    expenses
      .filter((expense) => expense.type === 'investment' && expense.investment_box_id)
      .forEach((expense) => {
        totals[expense.investment_box_id] = (totals[expense.investment_box_id] ?? 0) + expense.amount
      })
    return totals
  }, [expenses])

  const totalInvested = Object.values(totalsByBoxId).reduce((sum, value) => sum + value, 0)

  return (
    <main className="container">
      <div className="page-header">
        <Link to="/" className="icon-btn" aria-label="Voltar" title="Voltar">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3 5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <h1>Investimentos</h1>
      </div>

      {isLoading && <p className="state-message">Carregando…</p>}
      {!isLoading && loadError && <p className="state-message state-message--error">{loadError}</p>}

      {!isLoading && !loadError && (
        <>
          <section className="summary-grid">
            <SummaryCard label="Total investido" value={formatCurrency(totalInvested)} tone="investment" />
          </section>

          <section className="panel">
            <div className="panel-header">
              <h2>Caixinhas</h2>
              <p className="chart-caption">Quanto dinheiro está investido em cada caixinha, no total.</p>
            </div>

            {isLoadingBoxes && <p className="state-message">Carregando caixinhas…</p>}
            {!isLoadingBoxes && boxesError && <p className="state-message state-message--error">{boxesError}</p>}
            {!isLoadingBoxes && !boxesError && investmentBoxes.length === 0 && (
              <p className="state-message">Nenhuma caixinha cadastrada ainda. Crie uma abaixo.</p>
            )}

            {!isLoadingBoxes && !boxesError && investmentBoxes.length > 0 && (
              <div className="investment-box-grid">
                {investmentBoxes.map((box) => {
                  const color = paletteColor(box.color)
                  const total = totalsByBoxId[box.id] ?? 0

                  return (
                    <div className="investment-box-card" key={box.id}>
                      <span className="badge" style={{ background: color.bg, color: color.text }}>
                        {box.name}
                      </span>
                      <span className="investment-box-total">{formatCurrency(total)}</span>
                      {box.goal_amount && <BoxGoal box={box} saved={total} color={color} />}
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          <section className="panel investment-manager-panel">
            <InvestmentBoxManager
              investmentBoxes={investmentBoxes}
              setInvestmentBoxes={setInvestmentBoxes}
              isLoading={isLoadingBoxes}
              loadError={boxesError}
              onBoxDeleted={onExpensesChanged}
            />
          </section>
        </>
      )}
    </main>
  )
}

export default InvestmentsPage
