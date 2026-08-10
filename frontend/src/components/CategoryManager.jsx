import { useState } from 'react'
import { createCategory, updateCategory, deleteCategory, setDefaultCategory } from '../api/categories'
import { paletteColor, COLOR_KEYS } from '../utils/categoryColor'
import { useCategories, sortByName } from '../hooks/useCategories'
import { useBulkSelection } from '../hooks/useBulkSelection'
import ColorSwatchPicker from './ColorSwatchPicker'
import ConfirmDialog from './ConfirmDialog'
import LoadingBar from './LoadingBar'
import SelectionToolbar from './SelectionToolbar'

function CategoryManager() {
  const { categories, setCategories, isLoading, error: loadError } = useCategories()
  const { isSelecting, selectedIds, toggleSelecting, toggleId } = useBulkSelection()
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false)

  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(COLOR_KEYS[0])
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState(null)

  const [editingId, setEditingId] = useState(null)
  const [editingName, setEditingName] = useState('')
  const [editingColor, setEditingColor] = useState(COLOR_KEYS[0])
  const [rowError, setRowError] = useState(null)

  const [deleteError, setDeleteError] = useState(null)
  const [pendingUpdateId, setPendingUpdateId] = useState(null)
  const [pendingDeleteId, setPendingDeleteId] = useState(null)
  const [defaultError, setDefaultError] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)

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

    return updateCategory(id, { name, color: editingColor })
      .then((updated) => {
        setCategories((prev) => sortByName(prev.map((category) => (category.id === id ? updated : category))))
        cancelEditing()
      })
      .catch((error) => {
        console.error('Erro ao atualizar categoria:', error)
        setRowError('Não foi possível salvar. O nome já pode existir.')
      })
  }

  const handleSetDefault = (id) => {
    setDefaultError(null)

    setDefaultCategory(id)
      .then(() => {
        setCategories((prev) => sortByName(prev.map((category) => ({ ...category, is_default: category.id === id }))))
      })
      .catch((error) => {
        console.error('Erro ao definir categoria padrão:', error)
        setDefaultError('Não foi possível definir a categoria padrão. Tente novamente.')
      })
  }

  const handleDelete = (id) => {
    setDeleteError(null)

    return deleteCategory(id)
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
      {isLoading && <LoadingBar variant="dialog" />}
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
            {isCreating ? 'Adicionando…' : 'Adicionar'}
          </button>
        </div>
        <ColorSwatchPicker value={newColor} onChange={setNewColor} />
      </form>
      {createError && <p className="form-error">{createError}</p>}

      {deleteError && <p className="form-error">{deleteError}</p>}
      {defaultError && <p className="form-error">{defaultError}</p>}

      {!isLoading && loadError && <p className="state-message state-message--error">{loadError}</p>}
      {!isLoading && !loadError && categories.length === 0 && (
        <p className="state-message">Nenhuma categoria cadastrada ainda.</p>
      )}

      {!isLoading && !loadError && categories.length > 0 && (
        <SelectionToolbar
          isSelecting={isSelecting}
          count={selectedIds.size}
          onToggle={toggleSelecting}
          onDeleteClick={() => setIsBulkDeleteOpen(true)}
        />
      )}

      {!isLoading && !loadError && categories.length > 0 && (
        <ul className="entity-list">
          {categories.map((category) => {
            const color = paletteColor(category.color)
            const isEditing = editingId === category.id
            const isSelected = selectedIds.has(category.id)

            return (
              <li
                className={`entity-row${isSelected ? ' entity-row--selected' : ''}`}
                key={category.id}
                onClick={() => isSelecting && !category.is_default && toggleId(category.id)}
              >
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
                          onClick={() => setPendingUpdateId(category.id)}
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
                        {isSelecting ? (
                          !category.is_default && (
                            <input
                              type="checkbox"
                              className="select-checkbox"
                              checked={isSelected}
                              onClick={(e) => e.stopPropagation()}
                              onChange={() => toggleId(category.id)}
                              aria-label="Selecionar categoria"
                            />
                          )
                        ) : (
                          <>
                        {!category.is_default && (
                          <button
                            type="button"
                            className="icon-btn"
                            onClick={() => handleSetDefault(category.id)}
                            aria-label="Definir como padrão"
                            title="Definir como padrão"
                          >
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                              <path
                                d="M8 1.6l1.85 3.75 4.14.6-3 2.92.71 4.13L8 11.06l-3.7 1.94.71-4.13-3-2.92 4.14-.6L8 1.6Z"
                                stroke="currentColor"
                                strokeWidth="1.2"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </button>
                        )}
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
                            onClick={() => setPendingDeleteId(category.id)}
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
                          </>
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

      <ConfirmDialog
        isOpen={pendingUpdateId !== null}
        title="Salvar alterações"
        message="Confirma as alterações nesta categoria?"
        confirmLabel="Salvar"
        isConfirming={isProcessing}
        onConfirm={() => {
          setIsProcessing(true)
          handleUpdate(pendingUpdateId).finally(() => {
            setIsProcessing(false)
            setPendingUpdateId(null)
          })
        }}
        onCancel={() => setPendingUpdateId(null)}
      />

      <ConfirmDialog
        isOpen={pendingDeleteId !== null}
        title="Excluir categoria"
        message="Tem certeza que deseja excluir esta categoria? Essa ação não pode ser desfeita."
        confirmLabel="Excluir"
        danger
        isConfirming={isProcessing}
        onConfirm={() => {
          setIsProcessing(true)
          handleDelete(pendingDeleteId).finally(() => {
            setIsProcessing(false)
            setPendingDeleteId(null)
          })
        }}
        onCancel={() => setPendingDeleteId(null)}
      />

      <ConfirmDialog
        isOpen={isBulkDeleteOpen}
        title="Excluir categorias"
        message={`Tem certeza que deseja excluir ${selectedIds.size} categoria${selectedIds.size === 1 ? '' : 's'}? Essa ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        danger
        isConfirming={isProcessing}
        onConfirm={() => {
          setIsProcessing(true)
          Promise.all([...selectedIds].map((id) => handleDelete(id))).finally(() => {
            setIsProcessing(false)
            setIsBulkDeleteOpen(false)
            toggleSelecting()
          })
        }}
        onCancel={() => setIsBulkDeleteOpen(false)}
      />
    </div>
  )
}

export default CategoryManager
