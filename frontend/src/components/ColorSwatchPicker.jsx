import { COLOR_KEYS, paletteColor } from '../utils/categoryColor'

function ColorSwatchPicker({ value, onChange }) {
  return (
    <div className="color-swatches" role="radiogroup" aria-label="Cor da categoria">
      {COLOR_KEYS.map((key) => {
        const color = paletteColor(key)
        const isSelected = value === key

        return (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-label={key}
            title={key}
            className={`color-swatch${isSelected ? ' color-swatch--selected' : ''}`}
            style={{ background: color.text }}
            onClick={() => onChange(key)}
          />
        )
      })}
    </div>
  )
}

export default ColorSwatchPicker
