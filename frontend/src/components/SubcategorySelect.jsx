import { useMemo } from 'react'
import SearchableSelect from './SearchableSelect'

// Category is intentionally not its own field anywhere expenses are created/edited — the
// category is derived from whichever subcategory is picked here (categories only group the
// options) and reported back to the caller alongside the subcategory id.
function SubcategorySelect({ id, categories, subcategories, value, onChange, disabled }) {
  const options = useMemo(
    () =>
      categories.flatMap((category) =>
        subcategories
          .filter((s) => s.category_id === category.id)
          .map((s) => ({ value: String(s.id), label: s.name, group: category.name }))
      ),
    [categories, subcategories]
  )

  const handleChange = (subcategoryId) => {
    const subcategory = subcategories.find((s) => String(s.id) === subcategoryId)
    onChange(subcategoryId, subcategory ? String(subcategory.category_id) : '')
  }

  return (
    <SearchableSelect
      id={id}
      value={value}
      onChange={handleChange}
      options={options}
      disabled={disabled}
      ariaLabel="Subcategoria"
    />
  )
}

export default SubcategorySelect
