import Modal from './Modal'
import FilterBar from './FilterBar'
import LoadingBar from './LoadingBar'
import { EMPTY_FILTERS, hasActiveFilters } from '../utils/filters'

function FilterDialog({ isOpen, onClose, filters, onChange, subcategories, people, paymentMethods, buckets, banks, isLoading }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} contentClassName="modal-content--align-top">
      {isLoading && <LoadingBar variant="dialog" />}

      <h2 className="modal-title">Filtros</h2>
      <FilterBar
        filters={filters}
        onChange={onChange}
        subcategories={subcategories}
        people={people}
        paymentMethods={paymentMethods}
        buckets={buckets}
        banks={banks}
      />

      {hasActiveFilters(filters) && (
        <div className="filter-dialog-actions">
          <button type="button" className="btn btn-secondary" onClick={() => onChange(EMPTY_FILTERS)}>
            Limpar filtros
          </button>
        </div>
      )}
    </Modal>
  )
}

export default FilterDialog
