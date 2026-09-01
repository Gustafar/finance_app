import { useState } from 'react'
import { maskAmountInput, toMaskedDisplay, toPlainText } from '../utils/amountFormula'

// Amount field that can toggle between the live pt-BR currency mask and plain free text
// (where "=10+5,50" formulas are easiest to type). The mode is per-field and not persisted —
// every field starts masked. The parent still owns the value string and any stashed formula.
function AmountInput({ id, value, onChange, onBlur, onFocus, placeholder, required, ariaLabel, formula }) {
  const [mode, setMode] = useState('mask')

  const handleChange = (e) => {
    const raw = e.target.value
    onChange(mode === 'mask' ? maskAmountInput(raw) : raw)
  }

  const toggleMode = () => {
    if (mode === 'mask') {
      setMode('text')
      onChange(formula || toPlainText(value))
    } else {
      setMode('mask')
      onChange(toMaskedDisplay(value))
    }
  }

  return (
    <div className="amount-input">
      <input
        id={id}
        type="text"
        inputMode={mode === 'mask' ? 'decimal' : 'text'}
        placeholder={placeholder ?? (mode === 'mask' ? '0,00' : '0,00 (ou =10+5,50)')}
        value={value}
        aria-label={ariaLabel}
        required={required}
        onChange={handleChange}
        onFocus={onFocus}
        onBlur={onBlur ? (e) => onBlur(e.target.value) : undefined}
      />
      <button
        type="button"
        className="amount-input-toggle"
        onClick={toggleMode}
        tabIndex={-1}
        aria-label={mode === 'mask' ? 'Mudar para texto/fórmula' : 'Mudar para máscara de moeda'}
        title={mode === 'mask' ? 'Modo texto/fórmula (ex: =10+5,50)' : 'Modo máscara de moeda'}
      >
        {mode === 'mask' ? '=' : 'R$'}
      </button>
    </div>
  )
}

export default AmountInput
