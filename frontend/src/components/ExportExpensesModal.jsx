import { useState } from 'react'
import DateRangePicker from './DateRangePicker'
import { exportExpensesStatement } from '../api/expenses'
import { currentMonthPeriod } from '../utils/date'

function ExportExpensesModal({ onClose }) {
  const [period, setPeriod] = useState(currentMonthPeriod)
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState(null)

  const handleExport = (e) => {
    e.preventDefault()

    setError(null)
    setIsExporting(true)

    exportExpensesStatement(period.from, period.to)
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
        <div className="export-date-field">
          <label htmlFor="export-period">Período</label>
          <DateRangePicker id="export-period" value={period} onChange={setPeriod} />
        </div>

        {error && <p className="form-error">{error}</p>}

        <div className="entity-create-form-row export-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={isExporting}>
            {isExporting ? 'Gerando…' : 'Exportar'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default ExportExpensesModal
