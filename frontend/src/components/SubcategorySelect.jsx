import { useMemo } from 'react'

// Category is intentionally not its own field anywhere expenses are created/edited — the
// category is derived from whichever subcategory is picked here (categories only group the
// options into <optgroup>s) and reported back to the caller alongside the subcategory id.
function SubcategorySelect({ id, categories, subcategories, value, onChange, disabled, required = true }) {
  const byCategory = useMemo(() => {
    const map = new Map()
    subcategories.forEach((s) => {
      const list = map.get(s.category_id) ?? []
      list.push(s)
      map.set(s.category_id, list)
    })
    return map
  }, [subcategories])

  const handleChange = (e) => {
    const subcategoryId = e.target.value
    const subcategory = subcategories.find((s) => String(s.id) === subcategoryId)
    onChange(subcategoryId, subcategory ? String(subcategory.category_id) : '')
  }

  return (
    <select id={id} value={value} onChange={handleChange} required={required} disabled={disabled}>
      <option value="" disabled={required}>Selecione…</option>
      {categories.map((category) => {
        const options = byCategory.get(category.id) ?? []
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
  )
}

export default SubcategorySelect
