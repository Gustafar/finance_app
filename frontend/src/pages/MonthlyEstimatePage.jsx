import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useRecurringExpenses } from '../hooks/useRecurringExpenses'
import { useCategories } from '../hooks/useCategories'
import { useSubcategories } from '../hooks/useSubcategories'
import { usePeople } from '../hooks/usePeople'
import SummaryCard from '../components/SummaryCard'
import DrillDownBreakdownChart from '../components/charts/DrillDownBreakdownChart'
import { formatCurrency } from '../utils/format'
import { paletteColor } from '../utils/categoryColor'

const NO_SUBCATEGORY_ID = 'none'
const NO_SUBCATEGORY_NAME = 'Sem subcategoria'

function byId(list, id) {
  return list.find((item) => item.id === id)
}

// Builds a display-only date for the current month at the rule's day, clamped to the
// month's last day — only used so the chart's leaf-level detail list has something to sort/show.
function currentMonthDateForDay(day) {
  const now = new Date()
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  return new Date(now.getFullYear(), now.getMonth(), Math.min(day, lastDay)).toISOString()
}

function sumAmount(rules) {
  return rules.reduce((total, rule) => total + rule.amount, 0)
}

function MonthlyEstimatePage() {
  const { recurrences, isLoading: isLoadingRecurrences, error: loadError } = useRecurringExpenses()
  const { categories, isLoading: isLoadingCategories } = useCategories()
  const { subcategories, isLoading: isLoadingSubcategories } = useSubcategories()
  const { people, isLoading: isLoadingPeople } = usePeople()

  const isLoading = isLoadingRecurrences || isLoadingCategories || isLoadingSubcategories || isLoadingPeople

  const plannedAsExpenses = useMemo(
    () =>
      recurrences.map((recurring) => {
        const category = byId(categories, recurring.category_id)
        const subcategory = byId(subcategories, recurring.subcategory_id)
        const person = byId(people, recurring.person_id)

        return {
          id: recurring.id,
          description: recurring.description,
          date: currentMonthDateForDay(recurring.day_of_month),
          type: recurring.type,
          amount: recurring.amount,
          category_id: recurring.category_id,
          category_name: category?.name ?? '—',
          category_color: category?.color,
          subcategory_id: recurring.subcategory_id,
          subcategory_name: subcategory?.name,
          person_id: recurring.person_id,
          person_name: person?.name ?? '—',
          person_color: person?.color,
          include_in_expenses: recurring.include_in_expenses,
        }
      }),
    [recurrences, categories, subcategories, people],
  )

  const totals = useMemo(() => {
    const byType = (type) => recurrences.filter((r) => r.type === type)
    const plannedOnlyExpense = recurrences.filter((r) => r.type === 'expense' && !r.include_in_expenses)

    return {
      expense: sumAmount(byType('expense')),
      income: sumAmount(byType('income')),
      investment: sumAmount(byType('investment')),
      plannedOnly: sumAmount(plannedOnlyExpense),
    }
  }, [recurrences])

  return (
    <main className="container">
      <div className="page-header">
        <Link to="/gastos-fixos" className="icon-btn" aria-label="Voltar" title="Voltar">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3 5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <h1>Estimativa mensal</h1>
      </div>

      {isLoading && <p className="state-message">Carregando estimativa…</p>}
      {!isLoading && loadError && <p className="state-message state-message--error">{loadError}</p>}

      {!isLoading && !loadError && (
        <>
          <section className="summary-grid">
            <SummaryCard label="Estimativa de gasto" value={formatCurrency(totals.expense)} tone="expense" />
            <SummaryCard label="Estimativa de recebimento" value={formatCurrency(totals.income)} tone="income" />
            <SummaryCard label="Estimativa de investimento" value={formatCurrency(totals.investment)} tone="investment" />
            <SummaryCard
              label="Só planejamento"
              value={formatCurrency(totals.plannedOnly)}
              sub="Ainda não vira despesa real"
            />
          </section>

          <section className="panel chart-panel">
            <div className="panel-header">
              <h2>Estimativa por categoria</h2>
            </div>
            <div className="chart-body">
              <DrillDownBreakdownChart
                expenses={plannedAsExpenses}
                rootLabel="Categorias"
                caption="Todo o Planejamento Mensal, marcado ou não para lançamento automático."
                detailEmptyMessage="Nenhum item do planejamento para exibir."
                dimensions={[
                  {
                    idKey: 'category_id',
                    nameKey: 'category_name',
                    colorKey: 'category_color',
                    tableLabel: 'Categoria',
                    emptyMessage: 'Nenhum item do planejamento para exibir por categoria.',
                  },
                  {
                    idKey: 'subcategory_id',
                    nameKey: 'subcategory_name',
                    colorKey: 'category_color',
                    tableLabel: 'Subcategoria',
                    emptyMessage: 'Nenhum item nesta categoria.',
                    noneId: NO_SUBCATEGORY_ID,
                    noneLabel: NO_SUBCATEGORY_NAME,
                  },
                ]}
              />
            </div>
          </section>

          <section className="panel">
            <div className="panel-header">
              <h2>Itens do planejamento</h2>
            </div>
            {recurrences.length === 0 ? (
              <p className="state-message">Nenhum gasto fixo cadastrado ainda.</p>
            ) : (
              <ul className="expense-list estimate-list">
                {recurrences.map((recurring) => {
                  const category = byId(categories, recurring.category_id)
                  const subcategory = byId(subcategories, recurring.subcategory_id)
                  const categoryColor = paletteColor(category?.color)

                  return (
                    <li className="expense-row" key={recurring.id}>
                      <div className="expense-badges">
                        <span className="badge" style={{ background: categoryColor.bg, color: categoryColor.text }}>
                          {subcategory?.name ?? category?.name ?? '—'}
                        </span>
                        {!recurring.include_in_expenses && (
                          <span className="badge" style={{ background: 'var(--border)', color: 'var(--text-muted)' }}>
                            Somente planejamento
                          </span>
                        )}
                      </div>
                      <div className="expense-main">
                        <span className="expense-description" title={recurring.description}>{recurring.description}</span>
                        <span className="expense-date">Todo dia {recurring.day_of_month}</span>
                      </div>
                      <div className="expense-amount-group">
                        <span className="expense-amount">{formatCurrency(recurring.amount)}</span>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        </>
      )}
    </main>
  )
}

export default MonthlyEstimatePage
