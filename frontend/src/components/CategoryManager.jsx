import { useState } from 'react'
import { createCategory, updateCategory, deleteCategory } from '../api/categories'
import { paletteColor, COLOR_KEYS } from '../utils/categoryColor'
import { useCategories, sortByName } from '../hooks/useCategories'
import ColorSwatchPicker from './ColorSwatchPicker'

function CategoryManager() {
  const { categories, setCategories, isLoading, error: loadError } = useCategories()

  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(COLOR_KEYS[0])
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState(null)

  const [editingId, setEditingId] = useState(null)
  const [editingName, setEditingName] = useState('')
  const [editingColor, setEditingColor] = useState(COLOR_KEYS[0])
  const [rowError, setRowError] = useState(null)

  const [deleteError, setDeleteError] = useState(null)

  const handleCreate = (e) => {
    e.preventDefault()
    const name = newName.trim()
    if (!name) return

    setCreateError(null)
    setIsCreating(true)

    createCategory({ name, color: newColor })
      .then((created) => {
        setCategories((prev) => sortByName([...prev, created]))
        setNewName('')
        setNewColor(COLOR_KEYS[0])
      })
      .catch((error) => {
        console.error('Erro ao criar categoria:', error)
        setCreateError('Não foi possível criar a categoria. O nome já pode existir.')
      })
      .finally(() => setIsCreating(false))
  }

  const startEditing = (category) => {
    setEditingId(category.id)
    setEditingName(category.name)
    setEditingColor(category.color)
    setRowError(null)
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditingName('')
    setRowError(null)
  }

  const handleUpdate = (id) => {
    const name = editingName.trim()
    if (!name) return

    setRowError(null)

    updateCategory(id, { name, color: editingColor })
      .then((updated) => {
        setCategories((prev) => sortByName(prev.map((category) => (category.id === id ? updated : category))))
        cancelEditing()
      })
      .catch((error) => {
        console.error('Erro ao atualizar categoria:', error)
        setRowError('Não foi possível salvar. O nome já pode existir.')
      })
  }

  const handleDelete = (id) => {
    setDeleteError(null)

    deleteCategory(id)
      .then(() => {
        setCategories((prev) => prev.filter((category) => category.id !== id))
      })
      .catch((error) => {
        console.error('Erro ao excluir categoria:', error)
        setDeleteError('Não foi possível excluir a categoria. Tente novamente.')
      })
  }

  return (
    <div className="entity-manager">
      <h2>Categorias</h2>

      <form className="entity-create-form" onSubmit={handleCreate}>
        <div className="entity-create-form-row">
          <input
            type="text"
            placeholder="Nova categoria"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <button type="submit" className="btn btn-primary" disabled={isCreating || !newName.trim()}>
            Adicionar
          </button>
        </div>
        <ColorSwatchPicker value={newColor} onChange={setNewColor} />
      </form>
      {createError && <p className="form-error">{createError}</p>}

      {deleteError && <p className="form-error">{deleteError}</p>}

      {isLoading && <p className="state-message">Carregando categorias…</p>}
      {!isLoading && loadError && <p className="state-message state-message--error">{loadError}</p>}
      {!isLoading && !loadError && categories.length === 0 && (
        <p className="state-message">Nenhuma categoria cadastrada ainda.</p>
      )}

      {!isLoading && !loadError && categories.length > 0 && (
        <ul className="entity-list">
          {categories.map((category) => {
            const color = paletteColor(category.color)
            const isEditing = editingId === category.id

            return (
              <li className="entity-row" key={category.id}>
                <div className="entity-row-main">
                  {isEditing ? (
                    <>
                      <input
                        type="text"
                        className="entity-edit-input"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        autoFocus
                      />
                      <div className="entity-actions">
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => handleUpdate(category.id)}
                          disabled={!editingName.trim()}
                        >
                          Salvar
                        </button>
                        <button
                          type="button"
                          className="icon-btn"
                          onClick={cancelEditing}
                          aria-label="Cancelar edição"
                          title="Cancelar"
                        >
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path
                              d="M4 4l8 8M12 4l-8 8"
                              stroke="currentColor"
                              strokeWidth="1.3"
                              strokeLinecap="round"
                            />
                          </svg>
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="badge" style={{ background: color.bg, color: color.text }}>
                        {category.name}
                        {category.is_default && ' (padrão)'}
                      </span>
                      <div className="entity-actions">
                        <button
                          type="button"
                          className="icon-btn"
                          onClick={() => startEditing(category)}
                          aria-label="Editar categoria"
                          title="Editar"
                        >
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path
                              d="M11.333 2a1.2 1.2 0 0 1 1.697 1.697l-7.03 7.03-2.333.637.636-2.334z"
                              stroke="currentColor"
                              strokeWidth="1.3"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                        {!category.is_default && (
                          <button
                            type="button"
                            className="icon-btn icon-btn--danger"
                            onClick={() => handleDelete(category.id)}
                            aria-label="Excluir categoria"
                            title="Excluir"
                          >
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                              <path
                                d="M3 4.5h10M6.5 4.5V3a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v1.5m-6.5 0 .6 8.1a1 1 0 0 0 1 .9h4.8a1 1 0 0 0 1-.9l.6-8.1"
                                stroke="currentColor"
                                strokeWidth="1.3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
                {isEditing && <ColorSwatchPicker value={editingColor} onChange={setEditingColor} />}
                {isEditing && rowError && <p className="form-error">{rowError}</p>}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

export default CategoryManager
