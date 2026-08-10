import { useState } from 'react'
import { createPerson, updatePerson, deletePerson, setDefaultPerson } from '../api/people'
import { paletteColor, COLOR_KEYS } from '../utils/categoryColor'
import { usePeople, sortByName } from '../hooks/usePeople'
import { useBulkSelection } from '../hooks/useBulkSelection'
import ColorSwatchPicker from './ColorSwatchPicker'
import ConfirmDialog from './ConfirmDialog'
import LoadingBar from './LoadingBar'
import SelectionToolbar from './SelectionToolbar'

function PersonManager() {
  const { people, setPeople, isLoading, error: loadError } = usePeople()
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

  const handleCreate = (e) => {
    e.preventDefault()
    const name = newName.trim()
    if (!name) return

    setCreateError(null)
    setIsCreating(true)

    createPerson({ name, color: newColor })
      .then((created) => {
        setPeople((prev) => sortByName([...prev, created]))
        setNewName('')
        setNewColor(COLOR_KEYS[0])
      })
      .catch((error) => {
        console.error('Erro ao criar responsável:', error)
        setCreateError('Não foi possível criar o responsável. O nome já pode existir.')
      })
      .finally(() => setIsCreating(false))
  }

  const startEditing = (person) => {
    setEditingId(person.id)
    setEditingName(person.name)
    setEditingColor(person.color)
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

    updatePerson(id, { name, color: editingColor })
      .then((updated) => {
        setPeople((prev) => sortByName(prev.map((person) => (person.id === id ? updated : person))))
        cancelEditing()
      })
      .catch((error) => {
        console.error('Erro ao atualizar responsável:', error)
        setRowError('Não foi possível salvar. O nome já pode existir.')
      })
  }

  const handleSetDefault = (id) => {
    setDefaultError(null)

    setDefaultPerson(id)
      .then(() => {
        setPeople((prev) => sortByName(prev.map((person) => ({ ...person, is_default: person.id === id }))))
      })
      .catch((error) => {
        console.error('Erro ao definir responsável padrão:', error)
        setDefaultError('Não foi possível definir o responsável padrão. Tente novamente.')
      })
  }

  const handleDelete = (id) => {
    setDeleteError(null)

    deletePerson(id)
      .then(() => {
        setPeople((prev) => prev.filter((person) => person.id !== id))
      })
      .catch((error) => {
        console.error('Erro ao excluir responsável:', error)
        setDeleteError('Não foi possível excluir o responsável. Tente novamente.')
      })
  }

  return (
    <div className="entity-manager">
      {isLoading && <LoadingBar variant="dialog" />}
      <h2>Responsáveis</h2>

      <form className="entity-create-form" onSubmit={handleCreate}>
        <div className="entity-create-form-row">
          <input
            type="text"
            placeholder="Novo responsável"
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
      {defaultError && <p className="form-error">{defaultError}</p>}

      {!isLoading && loadError && <p className="state-message state-message--error">{loadError}</p>}
      {!isLoading && !loadError && people.length === 0 && (
        <p className="state-message">Nenhum responsável cadastrado ainda.</p>
      )}

      {!isLoading && !loadError && people.length > 0 && (
        <SelectionToolbar
          isSelecting={isSelecting}
          count={selectedIds.size}
          onToggle={toggleSelecting}
          onDeleteClick={() => setIsBulkDeleteOpen(true)}
        />
      )}

      {!isLoading && !loadError && people.length > 0 && (
        <ul className="entity-list">
          {people.map((person) => {
            const color = paletteColor(person.color)
            const isEditing = editingId === person.id
            const isSelected = selectedIds.has(person.id)

            return (
              <li
                className={`entity-row${isSelected ? ' entity-row--selected' : ''}`}
                key={person.id}
                onClick={() => isSelecting && !person.is_default && toggleId(person.id)}
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
                          onClick={() => setPendingUpdateId(person.id)}
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
                        {person.name}
                        {person.is_default && ' (padrão)'}
                      </span>
                      <div className="entity-actions">
                        {isSelecting ? (
                          !person.is_default && (
                            <input
                              type="checkbox"
                              className="select-checkbox"
                              checked={isSelected}
                              onClick={(e) => e.stopPropagation()}
                              onChange={() => toggleId(person.id)}
                              aria-label="Selecionar responsável"
                            />
                          )
                        ) : (
                          <>
                            {!person.is_default && (
                              <button
                                type="button"
                                className="icon-btn"
                                onClick={() => handleSetDefault(person.id)}
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
                              onClick={() => startEditing(person)}
                              aria-label="Editar responsável"
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
                            {!person.is_default && (
                              <button
                                type="button"
                                className="icon-btn icon-btn--danger"
                                onClick={() => setPendingDeleteId(person.id)}
                                aria-label="Excluir responsável"
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
        message="Confirma as alterações neste responsável?"
        confirmLabel="Salvar"
        onConfirm={() => {
          handleUpdate(pendingUpdateId)
          setPendingUpdateId(null)
        }}
        onCancel={() => setPendingUpdateId(null)}
      />

      <ConfirmDialog
        isOpen={pendingDeleteId !== null}
        title="Excluir responsável"
        message="Tem certeza que deseja excluir este responsável? Essa ação não pode ser desfeita."
        confirmLabel="Excluir"
        danger
        onConfirm={() => {
          handleDelete(pendingDeleteId)
          setPendingDeleteId(null)
        }}
        onCancel={() => setPendingDeleteId(null)}
      />

      <ConfirmDialog
        isOpen={isBulkDeleteOpen}
        title="Excluir responsáveis"
        message={`Tem certeza que deseja excluir os ${selectedIds.size} responsáveis selecionados? Essa ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        danger
        onConfirm={() => {
          selectedIds.forEach((id) => handleDelete(id))
          setIsBulkDeleteOpen(false)
          toggleSelecting()
        }}
        onCancel={() => setIsBulkDeleteOpen(false)}
      />
    </div>
  )
}

export default PersonManager
