import { useState } from 'react'
import { createBucket, updateBucket, deleteBucket, setDefaultBucket } from '../api/buckets'
import { paletteColor, COLOR_KEYS } from '../utils/categoryColor'
import { useBuckets, sortByName } from '../hooks/useBuckets'
import { useBulkSelection } from '../hooks/useBulkSelection'
import ColorSwatchPicker from './ColorSwatchPicker'
import ConfirmDialog from './ConfirmDialog'
import LoadingBar from './LoadingBar'
import SelectionToolbar from './SelectionToolbar'

function BucketManager() {
  const { buckets, setBuckets, isLoading, error: loadError } = useBuckets()
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

    createBucket({ name, color: newColor })
      .then((created) => {
        setBuckets((prev) => sortByName([...prev, created]))
        setNewName('')
        setNewColor(COLOR_KEYS[0])
      })
      .catch((error) => {
        console.error('Erro ao criar bucket:', error)
        setCreateError('Não foi possível criar o Envelope. O nome já pode existir.')
      })
      .finally(() => setIsCreating(false))
  }

  const startEditing = (bucket) => {
    setEditingId(bucket.id)
    setEditingName(bucket.name)
    setEditingColor(bucket.color)
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

    updateBucket(id, { name, color: editingColor })
      .then((updated) => {
        setBuckets((prev) => sortByName(prev.map((bucket) => (bucket.id === id ? updated : bucket))))
        cancelEditing()
      })
      .catch((error) => {
        console.error('Erro ao atualizar bucket:', error)
        setRowError('Não foi possível salvar. O nome já pode existir.')
      })
  }

  const handleSetDefault = (id) => {
    setDefaultError(null)

    setDefaultBucket(id)
      .then(() => {
        setBuckets((prev) => sortByName(prev.map((bucket) => ({ ...bucket, is_default: bucket.id === id }))))
      })
      .catch((error) => {
        console.error('Erro ao definir Envelope padrão:', error)
        setDefaultError('Não foi possível definir o Envelope padrão. Tente novamente.')
      })
  }

  const handleDelete = (id) => {
    setDeleteError(null)

    deleteBucket(id)
      .then(() => {
        setBuckets((prev) => prev.filter((bucket) => bucket.id !== id))
      })
      .catch((error) => {
        console.error('Erro ao excluir bucket:', error)
        setDeleteError('Não foi possível excluir o Envelope. Tente novamente.')
      })
  }

  return (
    <div className="entity-manager">
      {isLoading && <LoadingBar variant="dialog" />}
      <h2>Envelopes</h2>

      <form className="entity-create-form" onSubmit={handleCreate}>
        <div className="entity-create-form-row">
          <input
            type="text"
            placeholder="Novo Envelope"
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
      {!isLoading && !loadError && buckets.length === 0 && (
        <p className="state-message">Nenhum Envelope cadastrado ainda.</p>
      )}

      {!isLoading && !loadError && buckets.length > 0 && (
        <SelectionToolbar
          isSelecting={isSelecting}
          count={selectedIds.size}
          onToggle={toggleSelecting}
          onDeleteClick={() => setIsBulkDeleteOpen(true)}
        />
      )}

      {!isLoading && !loadError && buckets.length > 0 && (
        <ul className="entity-list">
          {buckets.map((bucket) => {
            const color = paletteColor(bucket.color)
            const isEditing = editingId === bucket.id
            const isSelected = selectedIds.has(bucket.id)

            return (
              <li
                className={`entity-row${isSelected ? ' entity-row--selected' : ''}`}
                key={bucket.id}
                onClick={() => isSelecting && !bucket.is_default && toggleId(bucket.id)}
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
                          onClick={() => setPendingUpdateId(bucket.id)}
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
                        {bucket.name}
                        {bucket.is_default && ' (padrão)'}
                      </span>
                      <div className="entity-actions">
                        {isSelecting ? (
                          !bucket.is_default && (
                            <input
                              type="checkbox"
                              className="select-checkbox"
                              checked={isSelected}
                              onClick={(e) => e.stopPropagation()}
                              onChange={() => toggleId(bucket.id)}
                              aria-label="Selecionar Envelope"
                            />
                          )
                        ) : (
                          <>
                            {!bucket.is_default && (
                              <button
                                type="button"
                                className="icon-btn"
                                onClick={() => handleSetDefault(bucket.id)}
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
                              onClick={() => startEditing(bucket)}
                              aria-label="Editar Envelope"
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
                            {!bucket.is_default && (
                              <button
                                type="button"
                                className="icon-btn icon-btn--danger"
                                onClick={() => setPendingDeleteId(bucket.id)}
                                aria-label="Excluir Envelope"
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
        message="Confirma as alterações neste Envelope?"
        confirmLabel="Salvar"
        onConfirm={() => {
          handleUpdate(pendingUpdateId)
          setPendingUpdateId(null)
        }}
        onCancel={() => setPendingUpdateId(null)}
      />

      <ConfirmDialog
        isOpen={pendingDeleteId !== null}
        title="Excluir Envelope"
        message="Tem certeza que deseja excluir este Envelope? Essa ação não pode ser desfeita."
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
        title="Excluir Envelopes"
        message={`Tem certeza que deseja excluir os ${selectedIds.size} Envelopes selecionados? Essa ação não pode ser desfeita.`}
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

export default BucketManager
