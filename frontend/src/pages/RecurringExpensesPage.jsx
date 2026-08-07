import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { createRecurringExpense, updateRecurringExpense, deleteRecurringExpense } from '../api/recurringExpenses'
import { useRecurringExpenses, sortByDay } from '../hooks/useRecurringExpenses'
import { useCategories } from '../hooks/useCategories'
import { usePeople } from '../hooks/usePeople'
import { usePaymentMethods } from '../hooks/usePaymentMethods'
import { useCaixinhas } from '../hooks/useCaixinhas'
import { useBanks } from '../hooks/useBanks'
import { TRANSACTION_TYPES, TRANSACTION_TYPE_AMOUNT_STYLE } from '../utils/transactionTypes'
import { formatCurrency } from '../utils/format'
import { paletteColor } from '../utils/categoryColor'
import ConfirmDialog from '../components/ConfirmDialog'

const emptyForm = {
  description: '',
  amount: '',
  type: 'expense',
  day_of_month: '1',
  category_id: '',
  person_id: '',
  payment_method_id: '',
  caixinha_id: '',
  bank_id: '',
}

function toPayload(form) {
  return {
    description: form.description.trim(),
    amount: parseFloat(form.amount),
    type: form.type,
    day_of_month: Number(form.day_of_month),
    category_id: Number(form.category_id),
    person_id: Number(form.person_id),
    payment_method_id: Number(form.payment_method_id),
    caixinha_id: Number(form.caixinha_id),
    bank_id: Number(form.bank_id),
  }
}

function isFormComplete(form) {
  return (
    form.description.trim() &&
    form.amount &&
    form.day_of_month &&
    form.category_id &&
    form.person_id &&
    form.payment_method_id &&
    form.caixinha_id &&
    form.bank_id
  )
}

function byId(list, id) {
  return list.find((item) => item.id === id)
}

function RecurringFields({ idPrefix, form, onChange, categories, people, paymentMethods, caixinhas, banks }) {
  return (
    <>
      <div className="field">
        <label>Tipo</label>
        <div className="type-toggle" role="radiogroup" aria-label="Tipo de transação">
          {TRANSACTION_TYPES.map((option) => (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={form.type === option.value}
              className={`type-toggle-option${form.type === option.value ? ' type-toggle-option--selected' : ''}`}
              onClick={() => onChange({ ...form, type: option.value })}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <label htmlFor={`${idPrefix}-description`}>Descrição</label>
        <input
          id={`${idPrefix}-description`}
          type="text"
          placeholder="Ex: Aluguel"
          value={form.description}
          onChange={(e) => onChange({ ...form, description: e.target.value })}
        />
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor={`${idPrefix}-amount`}>Valor</label>
          <input
            id={`${idPrefix}-amount`}
            type="number"
            step="0.01"
            min="0"
            placeholder="0,00"
            value={form.amount}
            onChange={(e) => onChange({ ...form, amount: e.target.value })}
          />
        </div>
        <div className="field">
          <label htmlFor={`${idPrefix}-day`}>Dia do mês</label>
          <input
            id={`${idPrefix}-day`}
            type="number"
            min="1"
            max="31"
            value={form.day_of_month}
            onChange={(e) => onChange({ ...form, day_of_month: e.target.value })}
          />
        </div>
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor={`${idPrefix}-category`}>Categoria</label>
          <select
            id={`${idPrefix}-category`}
            value={form.category_id}
            onChange={(e) => onChange({ ...form, category_id: e.target.value })}
          >
            <option value="" disabled>Selecione…</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor={`${idPrefix}-person`}>Responsável</label>
          <select
            id={`${idPrefix}-person`}
            value={form.person_id}
            onChange={(e) => onChange({ ...form, person_id: e.target.value })}
          >
            <option value="" disabled>Selecione…</option>
            {people.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor={`${idPrefix}-payment-method`}>Método de pagamento</label>
          <select
            id={`${idPrefix}-payment-method`}
            value={form.payment_method_id}
            onChange={(e) => onChange({ ...form, payment_method_id: e.target.value })}
          >
            <option value="" disabled>Selecione…</option>
            {paymentMethods.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor={`${idPrefix}-caixinha`}>Caixinha</label>
          <select
            id={`${idPrefix}-caixinha`}
            value={form.caixinha_id}
            onChange={(e) => onChange({ ...form, caixinha_id: e.target.value })}
          >
            <option value="" disabled>Selecione…</option>
            {caixinhas.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="field">
        <label htmlFor={`${idPrefix}-bank`}>Banco</label>
        <select
          id={`${idPrefix}-bank`}
          value={form.bank_id}
          onChange={(e) => onChange({ ...form, bank_id: e.target.value })}
        >
          <option value="" disabled>Selecione…</option>
          {banks.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
      </div>
    </>
  )
}

function RecurringExpensesPage() {
  const { recurrences, setRecurrences, isLoading, error: loadError } = useRecurringExpenses()
  const { categories } = useCategories()
  const { people } = usePeople()
  const { paymentMethods } = usePaymentMethods()
  const { caixinhas } = useCaixinhas()
  const { banks } = useBanks()

  const [form, setForm] = useState(emptyForm)
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState(null)

  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState(emptyForm)
  const [rowError, setRowError] = useState(null)

  const [deleteError, setDeleteError] = useState(null)
  const [pendingUpdateId, setPendingUpdateId] = useState(null)
  const [pendingDeleteId, setPendingDeleteId] = useState(null)

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return recurrences.filter((r) => {
      if (typeFilter !== 'all' && r.type !== typeFilter) return false
      if (categoryFilter !== 'all' && String(r.category_id) !== categoryFilter) return false
      if (term && !r.description.toLowerCase().includes(term)) return false
      return true
    })
  }, [recurrences, search, typeFilter, categoryFilter])

  const handleCreate = (e) => {
    e.preventDefault()
    if (!isFormComplete(form)) return

    setCreateError(null)
    setIsCreating(true)

    createRecurringExpense(toPayload(form))
      .then((created) => {
        setRecurrences((prev) => sortByDay([...prev, created]))
        setForm(emptyForm)
      })
      .catch((error) => {
        console.error('Erro ao criar gasto fixo:', error)
        setCreateError('Não foi possível criar o gasto fixo. Confira os campos.')
      })
      .finally(() => setIsCreating(false))
  }

  const startEditing = (recurring) => {
    setEditingId(recurring.id)
    setEditForm({
      description: recurring.description,
      amount: String(recurring.amount),
      type: recurring.type,
      day_of_month: String(recurring.day_of_month),
      category_id: String(recurring.category_id),
      person_id: String(recurring.person_id),
      payment_method_id: String(recurring.payment_method_id),
      caixinha_id: String(recurring.caixinha_id),
      bank_id: String(recurring.bank_id),
    })
    setRowError(null)
  }

  const cancelEditing = () => {
    setEditingId(null)
    setRowError(null)
  }

  const handleUpdate = (id) => {
    if (!isFormComplete(editForm)) return

    setRowError(null)

    updateRecurringExpense(id, toPayload(editForm))
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

    deleteRecurringExpense(id)
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
      <div className="page-header">
        <Link to="/" className="icon-btn" aria-label="Voltar" title="Voltar">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3 5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <h1>Gastos fixos</h1>
      </div>

      <section className="panel">
        <div className="panel-header">
          <h2>Novo gasto fixo</h2>
          <p className="state-message" style={{ padding: 0, textAlign: 'left' }}>
            Repetem todo mês no dia configurado — aparecem automaticamente na próxima vez que você abrir o app.
          </p>
        </div>

        <form className="expense-form" onSubmit={handleCreate} style={{ width: 'auto', padding: '20px 24px' }}>
          <RecurringFields
            idPrefix="create"
            form={form}
            onChange={setForm}
            categories={categories}
            people={people}
            paymentMethods={paymentMethods}
            caixinhas={caixinhas}
            banks={banks}
          />
          <button type="submit" className="btn btn-primary" disabled={isCreating || !isFormComplete(form)}>
            Adicionar
          </button>
          {createError && <p className="form-error">{createError}</p>}
        </form>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>Gastos fixos cadastrados</h2>
        </div>

        <div className="field-row" style={{ padding: '16px 24px 0' }}>
          <div className="field">
            <label htmlFor="filter-search">Buscar</label>
            <input
              id="filter-search"
              type="text"
              placeholder="Descrição…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
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
            <label htmlFor="filter-category">Categoria</label>
            <select id="filter-category" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              <option value="all">Todas</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {deleteError && <p className="form-error" style={{ padding: '0 24px' }}>{deleteError}</p>}

        {isLoading && <p className="state-message">Carregando gastos fixos…</p>}
        {!isLoading && loadError && <p className="state-message state-message--error">{loadError}</p>}
        {!isLoading && !loadError && recurrences.length === 0 && (
          <p className="state-message">Nenhum gasto fixo cadastrado ainda.</p>
        )}
        {!isLoading && !loadError && recurrences.length > 0 && filtered.length === 0 && (
          <p className="state-message">Nenhum gasto fixo corresponde ao filtro.</p>
        )}

        {!isLoading && !loadError && filtered.length > 0 && (
          <ul className="expense-list">
            {filtered.map((recurring) => {
              const isEditing = editingId === recurring.id
              const amountConfig = TRANSACTION_TYPE_AMOUNT_STYLE[recurring.type] ?? TRANSACTION_TYPE_AMOUNT_STYLE.expense

              if (isEditing) {
                return (
                  <li className="entity-row" key={recurring.id}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <RecurringFields
                        idPrefix={`edit-${recurring.id}`}
                        form={editForm}
                        onChange={setEditForm}
                        categories={categories}
                        people={people}
                        paymentMethods={paymentMethods}
                        caixinhas={caixinhas}
                        banks={banks}
                      />
                      <div className="entity-actions">
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => setPendingUpdateId(recurring.id)}
                          disabled={!isFormComplete(editForm)}
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
              const person = byId(people, recurring.person_id)
              const paymentMethod = byId(paymentMethods, recurring.payment_method_id)
              const caixinha = byId(caixinhas, recurring.caixinha_id)
              const bank = byId(banks, recurring.bank_id)
              const categoryColor = paletteColor(category?.color)
              const personColor = paletteColor(person?.color)
              const paymentMethodColor = paletteColor(paymentMethod?.color)
              const caixinhaColor = paletteColor(caixinha?.color)
              const bankColor = paletteColor(bank?.color)

              return (
                <li className="expense-row" key={recurring.id}>
                  <div className="expense-badges">
                    <span className="badge" style={{ background: categoryColor.bg, color: categoryColor.text }}>
                      {category?.name ?? '—'}
                    </span>
                    <span className="badge" style={{ background: personColor.bg, color: personColor.text }}>
                      {person?.name ?? '—'}
                    </span>
                    <span className="badge" style={{ background: paymentMethodColor.bg, color: paymentMethodColor.text }}>
                      {paymentMethod?.name ?? '—'}
                    </span>
                    <span className="badge" style={{ background: caixinhaColor.bg, color: caixinhaColor.text }}>
                      {caixinha?.name ?? '—'}
                    </span>
                    <span className="badge" style={{ background: bankColor.bg, color: bankColor.text }}>
                      {bank?.name ?? '—'}
                    </span>
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
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <ConfirmDialog
        isOpen={pendingUpdateId !== null}
        title="Salvar alterações"
        message="Confirma as alterações neste gasto fixo?"
        confirmLabel="Salvar"
        onConfirm={() => {
          handleUpdate(pendingUpdateId)
          setPendingUpdateId(null)
        }}
        onCancel={() => setPendingUpdateId(null)}
      />

      <ConfirmDialog
        isOpen={pendingDeleteId !== null}
        title="Excluir gasto fixo"
        message="Tem certeza que deseja excluir este gasto fixo? Essa ação não pode ser desfeita."
        confirmLabel="Excluir"
        danger
        onConfirm={() => {
          handleDelete(pendingDeleteId)
          setPendingDeleteId(null)
        }}
        onCancel={() => setPendingDeleteId(null)}
      />
    </main>
  )
}

export default RecurringExpensesPage
