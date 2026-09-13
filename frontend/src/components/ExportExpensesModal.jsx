import { useState } from 'react'
import DatePicker from './DatePicker'
import { exportExpensesStatement } from '../api/expenses'
import { currentYearMonth } from '../utils/date'

function defaultRange() {
  const { year, month } = currentYearMonth()
  const monthStr = String(month + 1).padStart(2, '0')
  const from = `${year}-${monthStr}-01`
  const lastDay = new Date(year, month + 1, 0).getDate()
  const to = `${year}-${monthStr}-${String(lastDay).padStart(2, '0')}`
  return { from, to }
}

function ExportExpensesModal({ onClose }) {
  const [{ from, to }] = useState(defaultRange)
  const [dateFrom, setDateFrom] = useState(from)
  const [dateTo, setDateTo] = useState(to)
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState(null)

  const isValidRange = Boolean(dateFrom && dateTo) && dateFrom <= dateTo

  const handleExport = (e) => {
    e.preventDefault()
    if (!isValidRange) return

    setError(null)
    setIsExporting(true)

    exportExpensesStatement(dateFrom, dateTo)
      .catch((err) => {
        console.error('Erro ao exportar extrato:', err)
        setError('Não foi possível gerar o extrato. Tente novamente.')
      })
      .finally(() => setIsExporting(false))
  }

  return (
    <div className="export-modal-body">
      <h2>Exportar extrato</h2>
      <p className="export-hint">Selecione o período que deseja exportar em Excel (.xlsx).</p>

      <form className="entity-create-form" onSubmit={handleExport}>
        <div className="export-date-range">
          <div className="export-date-field">
            <label htmlFor="export-date-from">De</label>
            <DatePicker id="export-date-from" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div className="export-date-field">
            <label htmlFor="export-date-to">até</label>
            <DatePicker id="export-date-to" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
        </div>

        {!isValidRange && dateFrom && dateTo && (
          <p className="form-error">A data inicial não pode ser depois da data final.</p>
        )}
        {error && <p className="form-error">{error}</p>}

        <div className="entity-create-form-row export-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={!isValidRange || isExporting}>
            {isExporting ? 'Gerando…' : 'Exportar'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default ExportExpensesModal
