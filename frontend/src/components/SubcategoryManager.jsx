import { useState } from 'react'
import { createSubcategory, updateSubcategory, deleteSubcategory } from '../api/subcategories'
import { paletteColor } from '../utils/categoryColor'
import { useSubcategories, sortByName } from '../hooks/useSubcategories'
import { useCategories } from '../hooks/useCategories'
import { useBulkSelection } from '../hooks/useBulkSelection'
import ConfirmDialog from './ConfirmDialog'
import LoadingBar from './LoadingBar'
import SelectionToolbar from './SelectionToolbar'

function SubcategoryManager() {
  const { subcategories, setSubcategories, isLoading: isLoadingSubcategories, error: loadError } = useSubcategories()
  const { categories, isLoading: isLoadingCategories } = useCategories()
  const { isSelecting, selectedIds, toggleSelecting, toggleId } = useBulkSelection()
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false)

  const isLoading = isLoadingSubcategories || isLoadingCategories

  const [newName, setNewName] = useState('')
  const [newCategoryId, setNewCategoryId] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState(null)

  const [editingId, setEditingId] = useState(null)
  const [editingName, setEditingName] = useState('')
  const [editingCategoryId, setEditingCategoryId] = useState('')
  const [rowError, setRowError] = useState(null)

  const [deleteError, setDeleteError] = useState(null)
  const [pendingUpdateId, setPendingUpdateId] = useState(null)
  const [pendingDeleteId, setPendingDeleteId] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const effectiveNewCategoryId = newCategoryId || (categories[0] ? String(categories[0].id) : '')

  const handleCreate = (e) => {
    e.preventDefault()
    const name = newName.trim()
    if (!name || !effectiveNewCategoryId) return

    setCreateError(null)
    setIsCreating(true)

    createSubcategory({ name, category_id: Number(effectiveNewCategoryId) })
      .then((created) => {
        setSubcategories((prev) => sortByName([...prev, created]))
        setNewName('')
        setNewCategoryId('')
      })
      .catch((error) => {
        console.error('Erro ao criar subcategoria:', error)
        setCreateError('Não foi possível criar a subcategoria. O nome já pode existir nessa categoria.')
      })
      .finally(() => setIsCreating(false))
  }

  const startEditing = (subcategory) => {
    setEditingId(subcategory.id)
    setEditingName(subcategory.name)
    setEditingCategoryId(String(subcategory.category_id))
    setRowError(null)
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditingName('')
    setRowError(null)
  }

  const handleUpdate = (id) => {
    const name = editingName.trim()
    if (!name || !editingCategoryId) return

    setRowError(null)

    return updateSubcategory(id, { name, category_id: Number(editingCategoryId) })
      .then((updated) => {
        setSubcategories((prev) => sortByName(prev.map((subcategory) => (subcategory.id === id ? updated : subcategory))))
        cancelEditing()
      })
      .catch((error) => {
        console.error('Erro ao atualizar subcategoria:', error)
        setRowError('Não foi possível salvar. O nome já pode existir nessa categoria.')
      })
  }

  const handleDelete = (id) => {
    setDeleteError(null)

    return deleteSubcategory(id)
      .then(() => {
        setSubcategories((prev) => prev.filter((subcategory) => subcategory.id !== id))
      })
      .catch((error) => {
        console.error('Erro ao excluir subcategoria:', error)
        setDeleteError('Não foi possível excluir a subcategoria. Tente novamente.')
      })
  }

  const noCategories = !isLoadingCategories && categories.length === 0

  return (
    <div className="entity-manager">
      {isLoading && <LoadingBar variant="dialog" />}
      <h2>Subcategorias</h2>

      <form className="entity-create-form" onSubmit={handleCreate}>
        <div className="entity-create-form-row">
          <input
            type="text"
            placeholder="Nova subcategoria"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <button type="submit" className="btn btn-primary" disabled={isCreating || !newName.trim() || noCategories}>
            {isCreating ? 'Adicionando…' : 'Adicionar'}
          </button>
        </div>
        <div className="field">
          <select
            aria-label="Categoria"
            value={effectiveNewCategoryId}
            onChange={(e) => setNewCategoryId(e.target.value)}
            disabled={noCategories}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </form>
      {createError && <p className="form-error">{createError}</p>}
      {noCategories && <p className="form-error">Cadastre uma categoria antes de adicionar subcategorias.</p>}

      {deleteError && <p className="form-error">{deleteError}</p>}

      {!isLoading && loadError && <p className="state-message state-message--error">{loadError}</p>}
      {!isLoading && !loadError && subcategories.length === 0 && (
        <p className="state-message">Nenhuma subcategoria cadastrada ainda.</p>
      )}

      {!isLoading && !loadError && subcategories.length > 0 && (
        <SelectionToolbar
          isSelecting={isSelecting}
          count={selectedIds.size}
          onToggle={toggleSelecting}
          onDeleteClick={() => setIsBulkDeleteOpen(true)}
        />
      )}

      {!isLoading && !loadError && subcategories.length > 0 && (
        <ul className="entity-list">
          {subcategories.map((subcategory) => {
            const category = categories.find((c) => c.id === subcategory.category_id)
            const color = paletteColor(category?.color)
            const isEditing = editingId === subcategory.id
            const isSelected = selectedIds.has(subcategory.id)

            return (
              <li
                className={`entity-row${isSelected ? ' entity-row--selected' : ''}`}
                key={subcategory.id}
                onClick={() => isSelecting && toggleId(subcategory.id)}
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
                      <div className="field">
                        <select aria-label="Categoria" value={editingCategoryId} onChange={(e) => setEditingCategoryId(e.target.value)}>
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="entity-actions">
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => setPendingUpdateId(subcategory.id)}
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
                        {subcategory.name}
                      </span>
                      <div className="entity-actions">
                        {isSelecting ? (
                          <input
                            type="checkbox"
                            className="select-checkbox"
                            checked={isSelected}
                            onClick={(e) => e.stopPropagation()}
                            onChange={() => toggleId(subcategory.id)}
                            aria-label="Selecionar subcategoria"
                          />
                        ) : (
                          <>
                            <button
                              type="button"
                              className="icon-btn"
                              onClick={() => startEditing(subcategory)}
                              aria-label="Editar subcategoria"
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
                            <button
                              type="button"
                              className="icon-btn icon-btn--danger"
                              onClick={() => setPendingDeleteId(subcategory.id)}
                              aria-label="Excluir subcategoria"
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
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>
                {isEditing && rowError && <p className="form-error">{rowError}</p>}
              </li>
            )
          })}
        </ul>
      )}

      <ConfirmDialog
        isOpen={pendingUpdateId !== null}
        title="Salvar alterações"
        message="Confirma as alterações nesta subcategoria?"
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
        title="Excluir subcategoria"
        message="Tem certeza que deseja excluir esta subcategoria? Essa ação não pode ser desfeita."
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
        title="Excluir subcategorias"
        message={`Tem certeza que deseja excluir as ${selectedIds.size} subcategorias selecionadas? Essa ação não pode ser desfeita.`}
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

export default SubcategoryManager
