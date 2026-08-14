import DatePicker from './DatePicker'
import MultiSelectField from './MultiSelectField'

function FilterBar({ filters, onChange, subcategories, people, paymentMethods, buckets, banks }) {
  const handleField = (field) => (event) => {
    onChange({ ...filters, [field]: event.target.value })
  }

  const handleMultiField = (field) => (value) => {
    onChange({ ...filters, [field]: value })
  }

  return (
    <div className="filter-bar">
      <div className="filter-field">
        <label htmlFor="filter-description">Nome</label>
        <input
          id="filter-description"
          type="text"
          placeholder="Buscar por nome..."
          value={filters.description}
          onChange={handleField('description')}
        />
      </div>

      <div className="filter-field">
        <label htmlFor="filter-subcategory">Subcategoria</label>
        <MultiSelectField
          id="filter-subcategory"
          allLabel="Todas"
          options={subcategories}
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

      <div className="filter-field">
        <label htmlFor="filter-date-from">Período de</label>
        <DatePicker id="filter-date-from" value={filters.dateFrom} onChange={handleField('dateFrom')} />
      </div>

      <div className="filter-field">
        <label htmlFor="filter-date-to">até</label>
        <DatePicker id="filter-date-to" value={filters.dateTo} onChange={handleField('dateTo')} />
      </div>
    </div>
  )
}

export default FilterBar
