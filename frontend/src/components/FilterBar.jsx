import DatePicker from './DatePicker'
import MultiSelectField from './MultiSelectField'

function FilterBar({ filters, onChange, categories, subcategories, people, paymentMethods, buckets, banks, hideDateRange }) {
  const handleField = (field) => (event) => {
    onChange({ ...filters, [field]: event.target.value })
  }

  const handleMultiField = (field) => (value) => {
    onChange({ ...filters, [field]: value })
  }

  // Picking a category narrows which subcategories are offered below; any already-selected
  // subcategory outside the new category set is dropped so the two fields never disagree.
  const handleCategoryChange = (value) => {
    const allowedSubcategoryIds = new Set(
      subcategories.filter((s) => value.includes(String(s.category_id))).map((s) => String(s.id))
    )
    const nextSubcategoryId =
      value.length === 0 ? filters.subcategoryId : filters.subcategoryId.filter((id) => allowedSubcategoryIds.has(id))
    onChange({ ...filters, categoryId: value, subcategoryId: nextSubcategoryId })
  }

  const visibleSubcategories =
    filters.categoryId.length === 0
      ? subcategories
      : subcategories.filter((s) => filters.categoryId.includes(String(s.category_id)))

  return (
    <div className="filter-bar">
      <div className="filter-field">
        <label htmlFor="filter-category">Categoria</label>
        <MultiSelectField
          id="filter-category"
          allLabel="Todas"
          options={categories}
          selected={filters.categoryId}
          onChange={handleCategoryChange}
        />
      </div>

      <div className="filter-field">
        <label htmlFor="filter-subcategory">Subcategoria</label>
        <MultiSelectField
          id="filter-subcategory"
          allLabel="Todas"
          options={visibleSubcategories}
          selected={filters.subcategoryId}
          onChange={handleMultiField('subcategoryId')}
        />
      </div>

      <div className="filter-field">
        <label htmlFor="filter-person">Responsável</label>
        <MultiSelectField
          id="filter-person"
          allLabel="Todos"
          options={people}
          selected={filters.personId}
          onChange={handleMultiField('personId')}
        />
      </div>

      <div className="filter-field">
        <label htmlFor="filter-payment-method">Método de pagamento</label>
        <MultiSelectField
          id="filter-payment-method"
          allLabel="Todos"
          options={paymentMethods}
          selected={filters.paymentMethodId}
          onChange={handleMultiField('paymentMethodId')}
        />
      </div>

      <div className="filter-field">
        <label htmlFor="filter-bucket">Envelope</label>
        <MultiSelectField
          id="filter-bucket"
          allLabel="Todos"
          options={buckets}
          selected={filters.bucketId}
          onChange={handleMultiField('bucketId')}
        />
      </div>

      <div className="filter-field">
        <label htmlFor="filter-bank">Banco</label>
        <MultiSelectField
          id="filter-bank"
          allLabel="Todos"
          options={banks}
          selected={filters.bankId}
          onChange={handleMultiField('bankId')}
        />
      </div>

      {!hideDateRange && (
        <>
          <div className="filter-field">
            <label htmlFor="filter-date-from">Período de</label>
            <DatePicker id="filter-date-from" value={filters.dateFrom} onChange={handleField('dateFrom')} />
          </div>

          <div className="filter-field">
            <label htmlFor="filter-date-to">até</label>
            <DatePicker id="filter-date-to" value={filters.dateTo} onChange={handleField('dateTo')} />
          </div>
        </>
      )}
    </div>
  )
}

export default FilterBar
