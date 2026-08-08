import DatePicker from './DatePicker'

function FilterBar({ filters, onChange, categories, people, paymentMethods, buckets, banks }) {
  const handleField = (field) => (event) => {
    onChange({ ...filters, [field]: event.target.value })
  }

  return (
    <div className="filter-bar">
      <div className="filter-field">
        <label htmlFor="filter-category">Categoria</label>
        <select id="filter-category" value={filters.categoryId} onChange={handleField('categoryId')}>
          <option value="">Todas</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-field">
        <label htmlFor="filter-person">Responsável</label>
        <select id="filter-person" value={filters.personId} onChange={handleField('personId')}>
          <option value="">Todos</option>
          {people.map((person) => (
            <option key={person.id} value={person.id}>
              {person.name}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-field">
        <label htmlFor="filter-payment-method">Método de pagamento</label>
        <select id="filter-payment-method" value={filters.paymentMethodId} onChange={handleField('paymentMethodId')}>
          <option value="">Todos</option>
          {paymentMethods.map((paymentMethod) => (
            <option key={paymentMethod.id} value={paymentMethod.id}>
              {paymentMethod.name}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-field">
        <label htmlFor="filter-bucket">Envelope</label>
        <select id="filter-bucket" value={filters.bucketId} onChange={handleField('bucketId')}>
          <option value="">Todos</option>
          {buckets.map((bucket) => (
            <option key={bucket.id} value={bucket.id}>
              {bucket.name}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-field">
        <label htmlFor="filter-bank">Banco</label>
        <select id="filter-bank" value={filters.bankId} onChange={handleField('bankId')}>
          <option value="">Todos</option>
          {banks.map((bank) => (
            <option key={bank.id} value={bank.id}>
              {bank.name}
            </option>
          ))}
        </select>
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
