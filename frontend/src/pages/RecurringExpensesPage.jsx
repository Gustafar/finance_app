import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { createRecurringExpense, updateRecurringExpense, deleteRecurringExpense } from '../api/recurringExpenses'
import { useRecurringExpenses, sortByDay } from '../hooks/useRecurringExpenses'
import { useCategories } from '../hooks/useCategories'
import { useSubcategories } from '../hooks/useSubcategories'
import { usePeople } from '../hooks/usePeople'
import { usePaymentMethods } from '../hooks/usePaymentMethods'
import { useBuckets } from '../hooks/useBuckets'
import { useBanks } from '../hooks/useBanks'
import { TRANSACTION_TYPES, TRANSACTION_TYPE_AMOUNT_STYLE } from '../utils/transactionTypes'
import { formatCurrency } from '../utils/format'
import { currentYearMonth, shiftMonth } from '../utils/date'
import { paletteColor } from '../utils/categoryColor'
import { useBulkSelection } from '../hooks/useBulkSelection'
import ConfirmDialog from '../components/ConfirmDialog'
import LoadingBar from '../components/LoadingBar'
import Modal from '../components/Modal'
import FilterButton from '../components/FilterButton'
import SearchInput from '../components/SearchInput'
import MonthPicker from '../components/MonthPicker'
import RecurringExpenseBulkForm from '../components/RecurringExpenseBulkForm'
import CopyPreviousPlanDialog from '../components/CopyPreviousPlanDialog'
import SelectionToolbar from '../components/SelectionToolbar'
import RecurringFields from '../components/RecurringFields'
import SummaryCard from '../components/SummaryCard'
import DrillDownBreakdownChart from '../components/charts/DrillDownBreakdownChart'
import { emptyRecurringForm as emptyForm, isRecurringFormComplete as isFormComplete, recurringFormFromRow, recurringFormToPayload } from '../utils/recurringForm'

const NO_SUBCATEGORY_ID = 'none'
const NO_SUBCATEGORY_NAME = 'Sem subcategoria'

function toPayload(form, selectedMonth) {
  return { ...recurringFormToPayload(form), plan_year: selectedMonth.year, plan_month: selectedMonth.month + 1 }
}

function byId(list, id) {
  return list.find((item) => item.id === id)
}

// Builds a display-only date for the viewed month at the rule's day, clamped to the
// month's last day — only used so the chart's leaf-level detail list has something to sort/show.
function monthDateForDay({ year, month }, day) {
  const lastDay = new Date(year, month + 1, 0).getDate()
  return new Date(year, month, Math.min(day, lastDay)).toISOString()
}

function sumAmount(rules) {
  return rules.reduce((total, rule) => total + rule.amount, 0)
}

function RecurringExpensesPage() {
  const [selectedMonth, setSelectedMonth] = useState(currentYearMonth)
  const { recurrences, setRecurrences, isLoading: isLoadingRecurrences, error: loadError } = useRecurringExpenses(selectedMonth.year, selectedMonth.month)
  const { categories, isLoading: isLoadingCategories } = useCategories()
  const { subcategories, isLoading: isLoadingSubcategories } = useSubcategories()
  const { people, isLoading: isLoadingPeople } = usePeople()
  const { paymentMethods, isLoading: isLoadingPaymentMethods } = usePaymentMethods()
  const { buckets, isLoading: isLoadingBuckets } = useBuckets()
  const { banks, isLoading: isLoadingBanks } = useBanks()

  const isLoading =
    isLoadingRecurrences ||
    isLoadingCategories ||
    isLoadingPeople ||
    isLoadingPaymentMethods ||
    isLoadingBuckets ||
    isLoadingBanks ||
    isLoadingSubcategories

  const [form, setForm] = useState(emptyForm)
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState(null)
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false)
  const [createMode, setCreateMode] = useState('single')
  const [createAttemptedSubmit, setCreateAttemptedSubmit] = useState(false)

  const createDefaults = useMemo(() => {
    const defaultCategory = categories.find((c) => c.is_default)
    const defaultPerson = people.find((p) => p.is_default)
    const defaultPaymentMethod = paymentMethods.find((m) => m.is_default)
    const defaultBucket = buckets.find((b) => b.is_default)
    const defaultBank = banks.find((b) => b.is_default)
    return {
      category_id: defaultCategory ? String(defaultCategory.id) : categories[0] ? String(categories[0].id) : '',
      person_id: defaultPerson ? String(defaultPerson.id) : people[0] ? String(people[0].id) : '',
      payment_method_id: defaultPaymentMethod
        ? String(defaultPaymentMethod.id)
        : paymentMethods[0]
          ? String(paymentMethods[0].id)
          : '',
      bucket_id: defaultBucket ? String(defaultBucket.id) : buckets[0] ? String(buckets[0].id) : '',
      bank_id: defaultBank ? String(defaultBank.id) : banks[0] ? String(banks[0].id) : '',
    }
  }, [categories, people, paymentMethods, buckets, banks])

  const effectiveCreateForm = {
    ...form,
    category_id: form.category_id || createDefaults.category_id,
    person_id: form.person_id || createDefaults.person_id,
    payment_method_id: form.payment_method_id || createDefaults.payment_method_id,
    bucket_id: form.bucket_id || createDefaults.bucket_id,
    bank_id: form.bank_id || createDefaults.bank_id,
  }

  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState(emptyForm)
  const [rowError, setRowError] = useState(null)
  const [editAttemptedSubmit, setEditAttemptedSubmit] = useState(false)

  const [deleteError, setDeleteError] = useState(null)
  const [pendingUpdateId, setPendingUpdateId] = useState(null)
  const [pendingDeleteId, setPendingDeleteId] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const { isSelecting, selectedIds, toggleSelecting, toggleId } = useBulkSelection()
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false)
  const [expandedIds, setExpandedIds] = useState(() => new Set())

  const toggleExpanded = (id) => {
    setExpandedIds((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [subcategoryFilter, setSubcategoryFilter] = useState('all')
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const [listTab, setListTab] = useState('fixed')
  const [isCopyOpen, setIsCopyOpen] = useState(false)

  const plannedAsExpenses = useMemo(
    () =>
      recurrences.map((recurring) => {
        const category = byId(categories, recurring.category_id)
        const subcategory = byId(subcategories, recurring.subcategory_id)
        const person = byId(people, recurring.person_id)

        return {
          id: recurring.id,
          description: recurring.description,
          date: monthDateForDay(selectedMonth, recurring.day_of_month),
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
    [recurrences, categories, subcategories, people, selectedMonth],
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

  const hasActiveFilters = search.trim() !== '' || typeFilter !== 'all' || subcategoryFilter !== 'all'

  const handleClearFilters = () => {
    setSearch('')
    setTypeFilter('all')
    setSubcategoryFilter('all')
  }

  const byTab = useMemo(
    () => recurrences.filter((r) => (listTab === 'fixed' ? r.include_in_expenses : !r.include_in_expenses)),
    [recurrences, listTab],
  )

  const fixedExpenseTotal = useMemo(
    () => sumAmount(recurrences.filter((r) => r.type === 'expense' && r.include_in_expenses)),
    [recurrences],
  )

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return byTab.filter((r) => {
      if (typeFilter !== 'all' && r.type !== typeFilter) return false
      if (subcategoryFilter !== 'all' && String(r.subcategory_id) !== subcategoryFilter) return false
      if (term && !r.description.toLowerCase().includes(term)) return false
      return true
    })
  }, [byTab, search, typeFilter, subcategoryFilter])

  const handleCreate = (e) => {
    e.preventDefault()
    setCreateAttemptedSubmit(true)
    if (!isFormComplete(effectiveCreateForm)) return

    setCreateError(null)
    setIsCreating(true)

    createRecurringExpense(toPayload(effectiveCreateForm, selectedMonth))
      .then((created) => {
        setRecurrences((prev) => sortByDay([...prev, created]))
        setForm(emptyForm)
        setCreateAttemptedSubmit(false)
      })
      .catch((error) => {
        console.error('Erro ao criar gasto fixo:', error)
        setCreateError('Não foi possível criar o gasto fixo. Confira os campos.')
      })
      .finally(() => setIsCreating(false))
  }

  const startEditing = (recurring) => {
    setEditingId(recurring.id)
    setEditForm(recurringFormFromRow(recurring))
    setRowError(null)
    setEditAttemptedSubmit(false)
  }

  const handleEditFromChart = (item) => {
    const recurring = byId(recurrences, item.id)
    if (!recurring) return
    setListTab(recurring.include_in_expenses ? 'fixed' : 'planned')
    setSearch('')
    setTypeFilter('all')
    setSubcategoryFilter('all')
    startEditing(recurring)
  }

  const cancelEditing = () => {
    setEditingId(null)
    setRowError(null)
    setEditAttemptedSubmit(false)
  }

  const handleUpdate = (id) => {
    if (!isFormComplete(editForm)) return

    setRowError(null)

    return updateRecurringExpense(id, toPayload(editForm, selectedMonth))
      .then((updated) => {
        setRecurrences((prev) => sortByDay(prev.map((r) => (r.id === id ? updated : r))))
        cancelEditing()
      })
      .catch((error) => {
        console.error('Erro ao atualizar gasto fixo:', error)
        setRowError('Não foi possível salvar. Confira os campos.')
      })
  }

  const handleDelete = (id) => {
    setDeleteError(null)

    return deleteRecurringExpense(id)
      .then(() => {
        setRecurrences((prev) => prev.filter((r) => r.id !== id))
      })
      .catch((error) => {
        console.error('Erro ao excluir gasto fixo:', error)
        setDeleteError('Não foi possível excluir o gasto fixo. Tente novamente.')
      })
  }

  return (
    <main className="container">
      {isLoading && <LoadingBar />}

      <div className="page-header">
        <Link to="/" className="icon-btn" aria-label="Voltar" title="Voltar">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3 5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <h1>Planejamento Mensal</h1>
        <div className="page-header-actions">
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsCopyOpen(true)}>
            Copiar planejamento anterior
          </button>
        </div>
      </div>

      <div className="dashboard-toolbar">
        <div className="month-nav">
          <button
            type="button"
            className="icon-btn"
            onClick={() => setSelectedMonth((m) => shiftMonth(m, -1))}
            aria-label="Mês anterior"
            title="Mês anterior"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 3 5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <MonthPicker value={selectedMonth} onChange={setSelectedMonth} />
          <button
            type="button"
            className="icon-btn"
            onClick={() => setSelectedMonth((m) => shiftMonth(m, 1))}
            aria-label="Próximo mês"
            title="Próximo mês"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

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
                onEditExpense={handleEditFromChart}
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
        </>
      )}

      <section className="panel">
        <button
          type="button"
          className="panel-header panel-header--toggle"
          onClick={() => setIsCreateFormOpen((open) => !open)}
          aria-expanded={isCreateFormOpen}
        >
          <span>
            <h2>Novo gasto fixo</h2>
            <p className="state-message" style={{ padding: 0, textAlign: 'left' }}>
              Repetem todo mês no dia configurado. Marque "Lançar automaticamente" para que também virem despesas
              reais — caso contrário ficam só no planejamento.
            </p>
          </span>
          <svg
            className={`panel-header-chevron${isCreateFormOpen ? ' panel-header-chevron--open' : ''}`}
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
          >
            <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <div className={`collapsible${isCreateFormOpen ? ' collapsible--open' : ''}`}>
          <div className="collapsible-inner">
            <div style={{ padding: '16px 24px 20px' }}>
              <div className="type-toggle" role="tablist" aria-label="Modo de lançamento" style={{ marginBottom: 16 }}>
                <button
                  type="button"
                  role="tab"
                  aria-selected={createMode === 'single'}
                  className={`type-toggle-option${createMode === 'single' ? ' type-toggle-option--selected' : ''}`}
                  onClick={() => setCreateMode('single')}
                >
                  Transação única
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={createMode === 'bulk'}
                  className={`type-toggle-option${createMode === 'bulk' ? ' type-toggle-option--selected' : ''}`}
                  onClick={() => setCreateMode('bulk')}
                >
                  Múltiplas transações
                </button>
              </div>

              {createMode === 'single' ? (
                <form className="expense-form" onSubmit={handleCreate} style={{ width: 'auto' }}>
                  <RecurringFields
                    idPrefix="create"
                    form={effectiveCreateForm}
                    onChange={setForm}
                    categories={categories}
                    subcategories={subcategories}
                    people={people}
                    paymentMethods={paymentMethods}
                    buckets={buckets}
                    banks={banks}
                    attemptedSubmit={createAttemptedSubmit}
                  />
                  {createAttemptedSubmit && !isFormComplete(effectiveCreateForm) && (
                    <p className="form-error">Preencha os campos destacados antes de continuar.</p>
                  )}
                  <button type="submit" className="btn btn-primary" disabled={isCreating}>
                    {isCreating ? 'Adicionando…' : 'Adicionar'}
                  </button>
                  {createError && <p className="form-error">{createError}</p>}
                </form>
              ) : (
                <RecurringExpenseBulkForm
                  categories={categories}
                  subcategories={subcategories}
                  people={people}
                  paymentMethods={paymentMethods}
                  buckets={buckets}
                  banks={banks}
                  planYear={selectedMonth.year}
                  planMonth={selectedMonth.month}
                  onRecurrencesCreated={(created) => setRecurrences((prev) => sortByDay([...prev, ...created]))}
                />
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header panel-header--actions">
          <h2>Itens cadastrados</h2>
          <div className="panel-header-actions-group">
            <SearchInput value={search} onChange={setSearch} />
            {!isLoading && !loadError && recurrences.length > 0 && (
              <button type="button" className="btn btn-secondary btn-sm" onClick={toggleSelecting}>
                {isSelecting ? 'Cancelar' : 'Selecionar'}
              </button>
            )}
            <FilterButton onClick={() => setIsFiltersOpen(true)} active={hasActiveFilters} />
          </div>
        </div>

        <div className="type-toggle" role="tablist" aria-label="Planejado ou gasto fixo" style={{ margin: '12px 24px' }}>
          <button
            type="button"
            role="tab"
            aria-selected={listTab === 'fixed'}
            className={`type-toggle-option${listTab === 'fixed' ? ' type-toggle-option--selected' : ''}`}
            onClick={() => setListTab('fixed')}
          >
            Gasto fixo
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={listTab === 'planned'}
            className={`type-toggle-option${listTab === 'planned' ? ' type-toggle-option--selected' : ''}`}
            onClick={() => setListTab('planned')}
          >
            Somente planejamento
          </button>
        </div>

        {!isLoading && !loadError && recurrences.length > 0 && (
          <p className="recurring-fixed-total" style={{ margin: '0 24px 12px' }}>
            Total gasto fixo (saídas): {formatCurrency(fixedExpenseTotal)}
          </p>
        )}

        {deleteError && <p className="form-error" style={{ padding: '0 24px' }}>{deleteError}</p>}

        {!isLoading && !loadError && recurrences.length > 0 && (
          <SelectionToolbar
            isSelecting={isSelecting}
            count={selectedIds.size}
            onToggle={toggleSelecting}
            onDeleteClick={() => setIsBulkDeleteOpen(true)}
            panel
            hideIdle
            hideCancel
          />
        )}

        {isLoading && <p className="state-message">Carregando gastos fixos…</p>}
        {!isLoading && loadError && <p className="state-message state-message--error">{loadError}</p>}
        {!isLoading && !loadError && recurrences.length === 0 && (
          <p className="state-message">Nenhum gasto fixo cadastrado ainda.</p>
        )}
        {!isLoading && !loadError && recurrences.length > 0 && byTab.length === 0 && (
          <p className="state-message">
            {listTab === 'fixed' ? 'Nenhum gasto fixo lançado automaticamente.' : 'Nenhum item somente em planejamento.'}
          </p>
        )}
        {!isLoading && !loadError && byTab.length > 0 && filtered.length === 0 && (
          <p className="state-message">Nenhum gasto fixo corresponde ao filtro.</p>
        )}

        {!isLoading && !loadError && filtered.length > 0 && (
          <ul className="expense-list recurring-list">
            {filtered.map((recurring) => {
              const isEditing = editingId === recurring.id
              const amountConfig = TRANSACTION_TYPE_AMOUNT_STYLE[recurring.type] ?? TRANSACTION_TYPE_AMOUNT_STYLE.expense

              if (isEditing) {
                return (
                  <li className="entity-row entity-row--inline-edit" key={recurring.id}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <RecurringFields
                        idPrefix={`edit-${recurring.id}`}
                        form={editForm}
                        onChange={setEditForm}
                        categories={categories}
                        subcategories={subcategories}
                        people={people}
                        paymentMethods={paymentMethods}
                        buckets={buckets}
                        banks={banks}
                        attemptedSubmit={editAttemptedSubmit}
                      />
                      {editAttemptedSubmit && !isFormComplete(editForm) && (
                        <p className="form-error">Preencha os campos destacados antes de continuar.</p>
                      )}
                      <div className="entity-actions">
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => {
                            setEditAttemptedSubmit(true)
                            if (!isFormComplete(editForm)) return
                            setPendingUpdateId(recurring.id)
                          }}
                        >
                          Salvar
                        </button>
                        <button
                          type="button"
                          className="icon-btn"
                          onClick={cancelEditing}
                          aria-label="Cancelar edição"
                          title="Cancelar"
                        >
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                          </svg>
                        </button>
                      </div>
                      {rowError && <p className="form-error">{rowError}</p>}
                    </div>
                  </li>
                )
              }

              const category = byId(categories, recurring.category_id)
              const subcategory = byId(subcategories, recurring.subcategory_id)
              const person = byId(people, recurring.person_id)
              const paymentMethod = byId(paymentMethods, recurring.payment_method_id)
              const bucket = byId(buckets, recurring.bucket_id)
              const bank = byId(banks, recurring.bank_id)
              const categoryColor = paletteColor(category?.color)
              const personColor = paletteColor(person?.color)
              const paymentMethodColor = paletteColor(paymentMethod?.color)
              const bucketColor = paletteColor(bucket?.color)
              const bankColor = paletteColor(bank?.color)
              const isSelected = selectedIds.has(recurring.id)
              const isExpanded = expandedIds.has(recurring.id)

              return (
                <li
                  className={`expense-row${isExpanded ? ' expense-row--expanded' : ''}${isSelected ? ' expense-row--selected' : ''}`}
                  key={recurring.id}
                  onClick={() => (isSelecting ? toggleId(recurring.id) : toggleExpanded(recurring.id))}
                >
                  <div className="expense-badges">
                    <span className="badge" style={{ background: categoryColor.bg, color: categoryColor.text }}>
                      {subcategory?.name ?? category?.name ?? '—'}
                    </span>
                    <span className="badge" style={{ background: personColor.bg, color: personColor.text }}>
                      {person?.name ?? '—'}
                    </span>
                    <span className="badge" style={{ background: paymentMethodColor.bg, color: paymentMethodColor.text }}>
                      {paymentMethod?.name ?? '—'}
                    </span>
                    <span className="badge" style={{ background: bucketColor.bg, color: bucketColor.text }}>
                      {bucket?.name ?? '—'}
                    </span>
                    <span className="badge" style={{ background: bankColor.bg, color: bankColor.text }}>
                      {bank?.name ?? '—'}
                    </span>
                    {!recurring.include_in_expenses && (
                      <span className="badge badge--planning-only" style={{ background: 'var(--border)', color: 'var(--text-muted)' }}>
                        Somente planejamento
                      </span>
                    )}
                  </div>

                  <div className="expense-main">
                    <span className="expense-description" title={recurring.description}>{recurring.description}</span>
                    <span className="expense-date">Todo dia {recurring.day_of_month}</span>
                  </div>

                  <span className={`expense-amount ${amountConfig.className}`}>
                    {amountConfig.prefix}
                    {formatCurrency(recurring.amount)}
                  </span>

                  <div className="expense-actions">
                    {isSelecting ? (
                      <input
                        type="checkbox"
                        className="select-checkbox"
                        checked={isSelected}
                        onClick={(e) => e.stopPropagation()}
                        onChange={() => toggleId(recurring.id)}
                        aria-label="Selecionar gasto fixo"
                      />
                    ) : (
                      <>
                        <button
                          type="button"
                          className="icon-btn"
                          onClick={() => startEditing(recurring)}
                          aria-label="Editar gasto fixo"
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
                        <button
                          type="button"
                          className="icon-btn icon-btn--danger"
                          onClick={() => setPendingDeleteId(recurring.id)}
                          aria-label="Excluir gasto fixo"
                          title="Excluir"
                        >
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path
                              d="M3 4.5h10M6.5 4.5V3a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v1.5m-6.5 0 .6 8.1a1 1 0 0 0 1 .9h4.8a1 1 0 0 0 1-.9l.6-8.1"
                              stroke="currentColor"
                              strokeWidth="1.3"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                      </>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <Modal isOpen={isFiltersOpen} onClose={() => setIsFiltersOpen(false)}>
        <h2 className="modal-title">Filtros</h2>

        <div className="field-row">
          <div className="field">
            <label htmlFor="filter-type">Tipo</label>
            <select id="filter-type" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="all">Todos</option>
              {TRANSACTION_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="filter-subcategory">Subcategoria</label>
            <select id="filter-subcategory" value={subcategoryFilter} onChange={(e) => setSubcategoryFilter(e.target.value)}>
              <option value="all">Todas</option>
              {categories.map((category) => {
                const options = subcategories.filter((s) => s.category_id === category.id)
                if (options.length === 0) return null
                return (
                  <optgroup key={category.id} label={category.name}>
                    {options.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </optgroup>
                )
              })}
            </select>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="filter-dialog-actions">
            <button type="button" className="btn btn-secondary" onClick={handleClearFilters}>
              Limpar filtros
            </button>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={pendingUpdateId !== null}
        title="Salvar alterações"
        message="Confirma as alterações neste gasto fixo?"
        confirmLabel="Salvar"
        isConfirming={isProcessing}
        onConfirm={() => {
          setIsProcessing(true)
          handleUpdate(pendingUpdateId).finally(() => {
            setIsProcessing(false)
            setPendingUpdateId(null)
          })
        }}
        onCancel={() => setPendingUpdateId(null)}
      />

      <ConfirmDialog
        isOpen={pendingDeleteId !== null}
        title="Excluir gasto fixo"
        message="Tem certeza que deseja excluir este gasto fixo? Essa ação não pode ser desfeita."
        confirmLabel="Excluir"
        danger
        isConfirming={isProcessing}
        onConfirm={() => {
          setIsProcessing(true)
          handleDelete(pendingDeleteId).finally(() => {
            setIsProcessing(false)
            setPendingDeleteId(null)
          })
        }}
        onCancel={() => setPendingDeleteId(null)}
      />

      <ConfirmDialog
        isOpen={isBulkDeleteOpen}
        title="Excluir gastos fixos"
        message={`Tem certeza que deseja excluir ${selectedIds.size} gasto${selectedIds.size === 1 ? '' : 's'} fixo${selectedIds.size === 1 ? '' : 's'}? Essa ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        danger
        isConfirming={isProcessing}
        onConfirm={() => {
          setIsProcessing(true)
          Promise.all([...selectedIds].map((id) => handleDelete(id))).finally(() => {
            setIsProcessing(false)
            setIsBulkDeleteOpen(false)
            toggleSelecting()
          })
        }}
        onCancel={() => setIsBulkDeleteOpen(false)}
      />

      <CopyPreviousPlanDialog
        isOpen={isCopyOpen}
        onClose={() => setIsCopyOpen(false)}
        selectedMonth={selectedMonth}
        hasCurrentMonthData={recurrences.length > 0}
        categories={categories}
        subcategories={subcategories}
        people={people}
        paymentMethods={paymentMethods}
        buckets={buckets}
        banks={banks}
        onSaved={(created) => setRecurrences(sortByDay(created))}
      />
    </main>
  )
}

export default RecurringExpensesPage
